import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
    getLeads, getLeadSummary, createLead, updateLead,
    deleteLead, getLeadById, addLeadActivity,
    getScoreRules, saveScoreRules,
    getCustomFields, createCustomField, updateCustomField, deleteCustomField,
} from '../state/leadSlice';
import { getOrgMembers } from '../../organisation/state/orgSlice';
import usePermission from '../../../hooks/usePermission';
import {
    Box, Card, CardContent, Typography, Button, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, IconButton, Chip, Stack, Avatar, Tooltip,
    InputAdornment, Select, MenuItem, FormControl, InputLabel,
    Grid, CircularProgress, Alert, Checkbox, TablePagination,
    Radio, RadioGroup, FormControlLabel, Divider,
    List, ListItem, ListItemText, ListItemSecondaryAction,
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Search as SearchIcon, Visibility as ViewIcon,
    Close as CloseIcon, Save as SaveIcon,
    Business as BusinessIcon, Phone as PhoneIcon,
    Email as EmailIcon, Public as PublicIcon,
    TrendingUp as TrendingUpIcon, WarningAmber as WarningIcon,
    EventAvailable as EventIcon, Person as PersonIcon,
    FileDownload as ExportIcon, UploadFile as ImportIcon,
    Rule as RuleIcon, AssignmentInd as AssignIcon,
    CallMerge as MergeIcon, Dashboard as DashboardIcon,
    ViewColumn as CustomFieldsIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const GlassCard = styled(Card)(() => ({
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
}));

const GradientButton = styled(Button)(({ gradient }) => ({
    background: gradient || 'linear-gradient(135deg,#667eea,#764ba2)',
    color: '#fff', borderRadius: '10px', textTransform: 'none', fontWeight: 600,
    '&:hover': { opacity: 0.9, transform: 'translateY(-1px)' },
    '&:disabled': { background: '#ccc' },
    transition: 'all 0.2s',
}));

const STATUS_CONFIG = {
    new: { color: '#6366f1', bg: '#eef2ff', label: 'New' },
    contact_attempted: { color: '#f59e0b', bg: '#fffbeb', label: 'Contact Attempted' },
    connected: { color: '#0891b2', bg: '#ecfeff', label: 'Connected' },
    requirement_discussion: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Requirement Discussion' },
    quotation_sent: { color: '#ec4899', bg: '#fdf2f8', label: 'Quotation Sent' },
    negotiation: { color: '#f97316', bg: '#fff7ed', label: 'Negotiation' },
    positive_response: { color: '#10b981', bg: '#ecfdf5', label: 'Positive Response' },
    po_received: { color: '#0284c7', bg: '#eff6ff', label: 'PO Received' },
    invoice_generated: { color: '#7c3aed', bg: '#f5f3ff', label: 'Invoice Generated' },
    closed_won: { color: '#16a34a', bg: '#dcfce7', label: 'Closed Won' },
    closed_lost: { color: '#dc2626', bg: '#fee2e2', label: 'Closed Lost' },
};

const SOURCE_OPTIONS = [
    'website', 'indiamart', 'whatsapp', 'referral',
    'cold_call', 'email', 'social_media', 'other',
];

const emptyForm = {
    company_name: '', contact_person: '', phone: '', email: '',
    website: '', country: '', city: '', source: 'other',
    product_interest: '', budget: '', currency: 'INR',
    notes: '', status: 'new', owner_id: '', expected_close_date: '', lost_reason: '',
    custom_fields: {},
};

// ── Custom Fields (dynamic per-org/user lead attributes) ──────────
const CUSTOM_FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select (dropdown)' },
];

const emptyCustomFieldForm = {
    label: '', field_type: 'text', options: '', is_required: false, sort_order: 0,
};

// LeadCustomField.options comes back from the API as an array (json column);
// the "Manage Custom Fields" form edits it as a comma-separated string.
const optionsArrayToString = (options) => (Array.isArray(options) ? options.join(', ') : '');
const optionsStringToArray = (str) =>
    (str || '').split(',').map((s) => s.trim()).filter(Boolean);

const getUserLabel = (user) => {
    if (!user) return '';
    return user.name || user.full_name || user.username || user.email || '';
};

const getAssignableUser = (entry) => entry?.user || entry?.member || entry;

const getAssignableUserId = (entry) => {
    const user = getAssignableUser(entry);
    return user?.id ?? entry?.user_id ?? entry?.member_id ?? entry?.id ?? '';
};

const getAssignableUserRoleLabel = (entry) => {
    const user = getAssignableUser(entry);
    return entry?.role?.label || user?.role?.label || '';
};

const ROUND_ROBIN_STORAGE_KEY = 'crm_round_robin_index';

const getEligibleAssignees = (assignableUsers) =>
    (assignableUsers || [])
        .map((entry) => ({ id: getAssignableUserId(entry), label: getUserLabel(getAssignableUser(entry)) }))
        .filter((entry) => entry.id && entry.label);

const getNextRoundRobinOwnerId = (assignableUsers) => {
    const eligible = getEligibleAssignees(assignableUsers);
    if (eligible.length === 0) return null;
    let lastIndex = -1;
    try {
        lastIndex = parseInt(localStorage.getItem(ROUND_ROBIN_STORAGE_KEY), 10);
        if (Number.isNaN(lastIndex)) lastIndex = -1;
    } catch { /* localStorage unavailable */ }
    const nextIndex = (lastIndex + 1) % eligible.length;
    try {
        localStorage.setItem(ROUND_ROBIN_STORAGE_KEY, String(nextIndex));
    } catch { /* localStorage unavailable */ }
    return eligible[nextIndex].id;
};

const getLeadOwnerId = (lead) => {
    if (!lead) return '';
    const ownerId =
        lead?.owner?.id ??
        lead?.owner_id ??
        lead?.assigned_to?.id ??
        lead?.assigned_to_id ??
        lead?.assigned_user?.id ??
        '';
    return ownerId === null || ownerId === undefined ? '' : ownerId;
};

const getLeadOwnerLabel = (lead) => {
    if (!lead) return 'Unassigned';
    return (
        getUserLabel(lead?.owner) ||
        getUserLabel(lead?.assigned_to) ||
        getUserLabel(lead?.assigned_user) ||
        lead?.owner_name ||
        lead?.assigned_to_name ||
        'Unassigned'
    );
};

const SALES_STAGE_WEIGHT = {
    new: 10,
    contact_attempted: 20,
    connected: 35,
    requirement_discussion: 50,
    quotation_sent: 65,
    negotiation: 75,
    positive_response: 85,
    po_received: 92,
    invoice_generated: 96,
    closed_won: 100,
    closed_lost: 0,
};

const DEFAULT_SCORE_RULES = {
    stageWeights: SALES_STAGE_WEIGHT,
    highValueBudget: 100000,
    highValueBonus: 8,
    contactBonus: 5,
    ownerBonus: 5,
    productBonus: 4,
    closingSoonBonus: 6,
    overduePenalty: 12,
    stalePenalty: 10,
    hotScore: 80,
    warmScore: 55,
    staleDays: 14,
};

const LEAD_IMPORT_FIELDS = [
    'company_name', 'contact_person', 'phone', 'email', 'website', 'country', 'city',
    'source', 'product_interest', 'budget', 'currency', 'status', 'owner_id',
    'expected_close_date', 'notes',
];

const terminalStatuses = new Set(['closed_won', 'closed_lost']);

const normalizeComparable = (value) => String(value || '').trim().toLowerCase();
const normalizePhone = (value) => String(value || '').replace(/\D/g, '');

const escapeCsv = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const parseCsv = (text) => {
    const rows = [];
    let current = '';
    let row = [];
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && quoted && next === '"') {
            current += '"';
            i += 1;
        } else if (char === '"') {
            quoted = !quoted;
        } else if (char === ',' && !quoted) {
            row.push(current);
            current = '';
        } else if ((char === '\n' || char === '\r') && !quoted) {
            if (char === '\r' && next === '\n') i += 1;
            row.push(current);
            if (row.some((cell) => cell.trim())) rows.push(row);
            row = [];
            current = '';
        } else {
            current += char;
        }
    }

    row.push(current);
    if (row.some((cell) => cell.trim())) rows.push(row);
    return rows;
};

const rowsToLeadPayloads = (rows) => {
    if (!rows || !rows.length) return [];
    const headers = rows[0].map((header) => normalizeComparable(header).replace(/\s+/g, '_'));
    return rows.slice(1).map((row) => {
        const item = { ...emptyForm };
        headers.forEach((header, index) => {
            if (LEAD_IMPORT_FIELDS.includes(header)) item[header] = row[index] || '';
        });
        return {
            ...item,
            source: item.source || 'other',
            status: item.status || 'new',
            currency: item.currency || 'INR',
            owner_id: item.owner_id ? parseInt(item.owner_id) : null,
            budget: item.budget ? parseFloat(item.budget) : null,
        };
    }).filter((item) => item.company_name);
};

const mergeScoreRules = (rules) => ({
    ...DEFAULT_SCORE_RULES,
    ...(rules || {}),
    stageWeights: { ...SALES_STAGE_WEIGHT, ...(rules?.stageWeights || {}) },
});

const getDaysBetween = (dateValue, baseDate = new Date()) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    return Math.ceil((date.setHours(0, 0, 0, 0) - new Date(baseDate).setHours(0, 0, 0, 0)) / 86400000);
};

const getOpenFollowUps = (lead) => (lead?.follow_ups || []).filter((item) => !item.is_done);

const getLeadValue = (lead) => Number(lead?.budget || 0);

const formatMoney = (amount, currency = 'INR') => {
    if (!amount) return '-';
    return `${currency || 'INR'} ${Number(amount).toLocaleString()}`;
};

const getLeadSignals = (lead, rawRules = DEFAULT_SCORE_RULES) => {
    if (!lead) return { score: 0, priority: { key: 'normal', label: 'Normal', color: '#2563eb', bg: '#dbeafe' }, value: 0, daysUntilClose: null, openFollowUps: 0, overdueFollowUps: 0, isStale: false, isCloseOverdue: false, isClosingSoon: false };
    
    const rules = mergeScoreRules(rawRules);
    const daysUntilClose = getDaysBetween(lead.expected_close_date);
    const openFollowUps = getOpenFollowUps(lead);
    const overdueFollowUps = openFollowUps.filter((item) => {
        if (item.is_overdue) return true;
        const dueDays = getDaysBetween(item.due_date);
        return dueDays !== null && dueDays < 0;
    });
    const createdDaysAgo = lead.created_at ? Math.abs(getDaysBetween(lead.created_at)) : 0;
    const value = getLeadValue(lead);
    const isClosingSoon = daysUntilClose !== null && daysUntilClose >= 0 && daysUntilClose <= 7;
    const isCloseOverdue = daysUntilClose !== null && daysUntilClose < 0 && !terminalStatuses.has(lead.status);
    const isStale = createdDaysAgo >= Number(rules.staleDays || 14) && !terminalStatuses.has(lead.status) && openFollowUps.length === 0;
    let score = Number(rules.stageWeights[lead.status] ?? 10);

    if (value >= Number(rules.highValueBudget || 0)) score += Number(rules.highValueBonus || 0);
    if (lead.phone || lead.email) score += Number(rules.contactBonus || 0);
    if (lead.owner || lead.owner_id || lead.assigned_to || lead.assigned_to_id) score += Number(rules.ownerBonus || 0);
    if (lead.product_interest) score += Number(rules.productBonus || 0);
    if (isClosingSoon) score += Number(rules.closingSoonBonus || 0);
    if (overdueFollowUps.length) score -= Number(rules.overduePenalty || 0);
    if (isStale) score -= Number(rules.stalePenalty || 0);
    score = Math.max(0, Math.min(100, score));

    const priority = overdueFollowUps.length || isCloseOverdue || score >= Number(rules.hotScore || 80)
        ? { key: 'hot', label: 'Hot', color: '#dc2626', bg: '#fee2e2' }
        : isStale || score >= Number(rules.warmScore || 55)
            ? { key: 'warm', label: 'Warm', color: '#d97706', bg: '#fef3c7' }
            : { key: 'normal', label: 'Normal', color: '#2563eb', bg: '#dbeafe' };

    return {
        score,
        priority,
        value,
        daysUntilClose,
        openFollowUps: openFollowUps.length,
        overdueFollowUps: overdueFollowUps.length,
        isStale,
        isCloseOverdue,
        isClosingSoon,
    };
};

const ACTIVITY_TONE = {
    call: { label: 'Call', color: '#16a34a', bg: '#dcfce7' },
    whatsapp: { label: 'WhatsApp', color: '#15803d', bg: '#dcfce7' },
    email: { label: 'Email', color: '#0284c7', bg: '#e0f2fe' },
    meeting: { label: 'Meeting', color: '#7c3aed', bg: '#f3e8ff' },
    note: { label: 'Note', color: '#475569', bg: '#f1f5f9' },
    status_change: { label: 'Status', color: '#d97706', bg: '#fef3c7' },
};

const getActivityTone = (type) => ACTIVITY_TONE[type] || { label: type?.replace('_', ' ') || 'Activity', color: '#475569', bg: '#f1f5f9' };

const formatActivityDate = (value) => {
    if (!value) return 'No date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const getFollowUpAction = (followUp) => followUp?.next_action || followUp?.action_type || followUp?.type || 'follow-up';

const getLeadActivitySignals = (lead) => {
    if (!lead) {
        return {
            activitiesCount: 0,
            followUpsCount: 0,
            openFollowUpsCount: 0,
            overdueCount: 0,
            dueTodayCount: 0,
            lastActivity: null,
            lastActivityDays: null,
            nextFollowUp: null,
            nextAction: '',
            hasMeeting: false,
            noActivity: true,
            notSynced: false,
            noNextAction: true,
        };
    }

    const directActivities = [
        ...(lead.activities || []),
        lead.last_activity,
        lead.latest_activity,
    ].filter(Boolean);

    const hasActivityData = Array.isArray(lead.activities);

    const activities = [...directActivities]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const followUps = lead.follow_ups || [];
    const openFollowUps = followUps.filter((item) => !item.is_done);
    const overdueFollowUps = openFollowUps.filter((item) => {
        if (item.is_overdue) return true;
        const dueDays = getDaysBetween(item.due_date);
        return dueDays !== null && dueDays < 0;
    });
    const dueTodayFollowUps = openFollowUps.filter((item) => getDaysBetween(item.due_date) === 0);
    const nextFollowUp = [...openFollowUps]
        .filter((item) => item.due_date)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0] || openFollowUps[0] || null;
    const lastActivity = activities[0] || null;
    const lastActivityDays = lastActivity?.created_at ? Math.abs(getDaysBetween(lastActivity.created_at)) : null;
    const hasMeeting = openFollowUps.some((item) => getFollowUpAction(item) === 'meeting') || activities.some((item) => item.type === 'meeting');

    return {
        activitiesCount: activities.length,
        followUpsCount: followUps.length,
        openFollowUpsCount: openFollowUps.length,
        overdueCount: overdueFollowUps.length,
        dueTodayCount: dueTodayFollowUps.length,
        lastActivity,
        lastActivityDays,
        nextFollowUp,
        nextAction: getFollowUpAction(nextFollowUp),
        hasMeeting,
        noActivity: hasActivityData && activities.length === 0,
        notSynced: !hasActivityData,
        noNextAction: openFollowUps.length === 0,
    };
};

function LastActivityCell({ lead, activitySignal }) {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const firedRef = useRef(false);
    const lastTone = getActivityTone(activitySignal?.lastActivity?.type);

    const handleHoverSync = () => {
        if (firedRef.current || !activitySignal?.notSynced || !lead?.id) return;
        firedRef.current = true;
        setLoading(true);
        dispatch(getLeadById(lead.id)).finally(() => setLoading(false));
    };

    if (activitySignal?.lastActivity) {
        return (
            <Stack spacing={0.5}>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                    <Chip label={lastTone.label} size="small"
                        sx={{ bgcolor: lastTone.bg, color: lastTone.color, fontWeight: 700, fontSize: 10, height: 20, textTransform: 'capitalize' }} />
                    <Typography variant="caption" color="text.secondary">
                        {formatActivityDate(activitySignal.lastActivity.created_at)}
                    </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                    {activitySignal.lastActivity.note || activitySignal.lastActivity.outcome || 'Activity logged'}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                    {activitySignal.activitiesCount} activities
                </Typography>
            </Stack>
        );
    }

    if (activitySignal?.notSynced) {
        return (
            <Box onMouseEnter={handleHoverSync}>
                <Tooltip title={loading ? 'Syncing…' : 'Hover karo, activity load ho jayegi'}>
                    <Chip
                        label={loading ? 'Syncing…' : 'Hover to sync'}
                        size="small"
                        icon={loading ? <CircularProgress size={10} sx={{ color: '#94a3b8', ml: '6px' }} /> : undefined}
                        sx={{ bgcolor: '#f8fafc', color: '#94a3b8', fontWeight: 700, fontSize: 10, border: '1px dashed #cbd5e1' }}
                    />
                </Tooltip>
            </Box>
        );
    }

    return <Chip label="No Activity" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: 10 }} />;
}

// Error Boundary Component - Now using React directly
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('LeadList Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        Something went wrong loading the lead list.
                    </Alert>
                    <Button variant="outlined" onClick={() => window.location.reload()}>
                        Refresh Page
                    </Button>
                </Box>
            );
        }
        return this.props.children;
    }
}

function LeadListComponent() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { leads = [], summary, isLoading, actionLoading, scoreRules: remoteScoreRules, customFields = [] } = useSelector((s) => s.leads || { leads: [] });
    const { can } = usePermission();
    const { user: currentUser } = useSelector((s) => s.auth || {});
    const { members: orgMembers = [] } = useSelector((s) => s.orgs || {});
    const assignableUsers = Array.isArray(orgMembers) ? orgMembers : [];

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [statusFilter, setStatusFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [ownerFilter, setOwnerFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [activityFilter, setActivityFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [dialog, setDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [deleteDialog, setDeleteDialog] = useState(null);
    const [formError, setFormError] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkDialog, setBulkDialog] = useState(null);
    const [bulkOwnerId, setBulkOwnerId] = useState('');
    const [bulkStatus, setBulkStatus] = useState('connected');
    const [bulkLostReason, setBulkLostReason] = useState('');
    const [bulkError, setBulkError] = useState('');
    const [scoreDialog, setScoreDialog] = useState(false);
    const scoreRules = useMemo(
        () => mergeScoreRules(remoteScoreRules),
        [remoteScoreRules]
    );
    const [scoreForm, setScoreForm] = useState(scoreRules);
    const [scoreSaving, setScoreSaving] = useState(false);
    const [customFieldsDialog, setCustomFieldsDialog] = useState(false);
    const [cfEditId, setCfEditId] = useState(null);
    const [cfForm, setCfForm] = useState(emptyCustomFieldForm);
    const [cfError, setCfError] = useState('');
    const [cfSaving, setCfSaving] = useState(false);
    const [cfDeleteId, setCfDeleteId] = useState(null);
    const [cfFilterKey, setCfFilterKey] = useState('');
    const [cfFilterValue, setCfFilterValue] = useState('');
    const [importError, setImportError] = useState('');
    const [pageMsg, setPageMsg] = useState('');

    useEffect(() => {
        dispatch(getLeads());
        dispatch(getLeadSummary());
        dispatch(getOrgMembers());
        dispatch(getScoreRules());
        dispatch(getCustomFields());
    }, [dispatch]);

    const leadSignals = useMemo(() => {
        if (!leads || !Array.isArray(leads)) return {};
        return Object.fromEntries(leads.map((lead) => [lead.id, getLeadSignals(lead, scoreRules)]));
    }, [leads, scoreRules]);

    const activitySignals = useMemo(() => {
        if (!leads || !Array.isArray(leads)) return {};
        return Object.fromEntries(leads.map((lead) => [lead.id, getLeadActivitySignals(lead)]));
    }, [leads]);

    const filtered = useMemo(() => {
        if (!leads || !Array.isArray(leads)) return [];
        
        return leads.filter((l) => {
            if (!l) return false;
            const matchSearch = !search ||
                l.company_name?.toLowerCase().includes(search.toLowerCase()) ||
                l.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
                l.phone?.includes(search) || l.email?.toLowerCase().includes(search.toLowerCase());
            const matchStatus = !statusFilter || l.status === statusFilter;
            const matchSource = !sourceFilter || l.source === sourceFilter;
            const matchOwner = !ownerFilter || String(getLeadOwnerId(l) || 'unassigned') === ownerFilter;
            const matchPriority = !priorityFilter || leadSignals[l.id]?.priority?.key === priorityFilter;
            const leadDate = l.created_at ? new Date(l.created_at) : null;
            const startDate = fromDate ? new Date(fromDate) : null;
            const endDate = toDate ? new Date(toDate) : null;
            if (endDate) endDate.setHours(23, 59, 59, 999);
            const matchFromDate = !startDate || (leadDate && leadDate >= startDate);
            const matchToDate = !endDate || (leadDate && leadDate <= endDate);
            const activity = activitySignals[l.id] || getLeadActivitySignals(l);
            const matchActivity = !activityFilter ||
                (activityFilter === 'due_today' && activity.dueTodayCount > 0) ||
                (activityFilter === 'overdue_followup' && activity.overdueCount > 0) ||
                (activityFilter === 'meeting' && activity.hasMeeting) ||
                (activityFilter === 'no_activity' && activity.noActivity) ||
                (activityFilter === 'no_next_action' && activity.noNextAction);
            const cfRawValue = l.custom_fields?.[cfFilterKey];
            const matchCustomField = !cfFilterKey || (cfFilterValue.trim()
                ? String(cfRawValue ?? '').toLowerCase().includes(cfFilterValue.trim().toLowerCase())
                : cfRawValue !== undefined && cfRawValue !== null && cfRawValue !== '');
            return matchSearch && matchStatus && matchSource && matchOwner && matchPriority && matchFromDate && matchToDate && matchActivity && matchCustomField;
        });
    }, [activityFilter, activitySignals, cfFilterKey, cfFilterValue, fromDate, leadSignals, leads, ownerFilter, priorityFilter, search, sourceFilter, statusFilter, toDate]);

    useEffect(() => {
        setPage(0);
    }, [search, statusFilter, sourceFilter, ownerFilter, priorityFilter, activityFilter, fromDate, toDate]);

    const paginatedLeads = useMemo(
        () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filtered, page, rowsPerPage]
    );

    const handleChangePage = (_event, newPage) => setPage(newPage);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const insights = useMemo(() => {
        const openLeads = (leads || []).filter((lead) => !terminalStatuses.has(lead?.status));
        const weightedPipeline = (leads || []).reduce((total, lead) => {
            const value = getLeadValue(lead);
            return total + (value * ((SALES_STAGE_WEIGHT[lead?.status] ?? 10) / 100));
        }, 0);
        const hotLeads = (leads || []).filter((lead) => leadSignals[lead?.id]?.priority?.key === 'hot').length;
        const overdueLeads = (leads || []).filter((lead) => {
            const signal = leadSignals[lead?.id];
            return signal?.overdueFollowUps || signal?.isCloseOverdue;
        }).length;
        const unassigned = (leads || []).filter((lead) => !getLeadOwnerId(lead)).length;
        const closeThisWeek = (leads || []).filter((lead) => leadSignals[lead?.id]?.isClosingSoon).length;
        const dueToday = (leads || []).filter((lead) => activitySignals[lead?.id]?.dueTodayCount > 0).length;
        const noActivity = (leads || []).filter((lead) => activitySignals[lead?.id]?.noActivity).length;
        const noNextAction = (leads || []).filter((lead) => activitySignals[lead?.id]?.noNextAction).length;

        return {
            openLeads: openLeads.length,
            weightedPipeline,
            hotLeads,
            overdueLeads,
            unassigned,
            closeThisWeek,
            dueToday,
            noActivity,
            noNextAction
        };
    }, [activitySignals, leadSignals, leads]);

    const sourceAttribution = useMemo(() => {
        const grouped = new Map();
        (leads || []).forEach((lead) => {
            const key = lead?.source || 'other';
            const current = grouped.get(key) || { source: key, leads: 0, won: 0, pipeline: 0, revenue: 0 };
            const value = getLeadValue(lead);
            current.leads += 1;
            current.pipeline += value * ((scoreRules?.stageWeights?.[lead?.status] ?? SALES_STAGE_WEIGHT[lead?.status] ?? 10) / 100);
            if (lead?.status === 'closed_won') {
                current.won += 1;
                current.revenue += value;
            }
            grouped.set(key, current);
        });
        return [...grouped.values()].sort((a, b) => b.pipeline - a.pipeline).slice(0, 5);
    }, [leads, scoreRules?.stageWeights]);

    const duplicateGroups = useMemo(() => {
        const buckets = new Map();
        const add = (type, value, lead) => {
            const normalized = type === 'phone' ? normalizePhone(value) : normalizeComparable(value);
            if (!normalized || (type === 'phone' && normalized.length < 7)) return;
            const key = `${type}:${normalized}`;
            if (!buckets.has(key)) buckets.set(key, { type, value, leads: [] });
            buckets.get(key).leads.push(lead);
        };

        (leads || []).forEach((lead) => {
            add('phone', lead.phone, lead);
            add('email', lead.email, lead);
            add('company', lead.company_name, lead);
        });

        return [...buckets.values()].filter((group) => group.leads.length > 1);
    }, [leads]);

    const [mergeGroup, setMergeGroup] = useState(null);
    const [mergePrimaryId, setMergePrimaryId] = useState(null);
    const [mergeLoading, setMergeLoading] = useState(false);
    const [mergeError, setMergeError] = useState('');

    const openMergeDialog = (group) => {
        setMergeGroup(group);
        setMergePrimaryId(group.leads[0].id);
        setMergeError('');
    };

    const closeMergeDialog = () => {
        setMergeGroup(null);
        setMergePrimaryId(null);
        setMergeError('');
    };

    const MERGEABLE_FIELDS = [
        'company_name', 'contact_person', 'phone', 'email', 'website',
        'country', 'city', 'product_interest', 'budget', 'currency', 'notes',
    ];

    const handleMergeConfirm = async () => {
        if (!mergeGroup || !mergePrimaryId) return;
        const primary = mergeGroup.leads.find((lead) => lead.id === mergePrimaryId);
        const duplicates = mergeGroup.leads.filter((lead) => lead.id !== mergePrimaryId);
        if (!primary || duplicates.length === 0) return;

        setMergeLoading(true);
        setMergeError('');
        try {
            const filledFrom = {};
            const mergedData = { ...primary };
            MERGEABLE_FIELDS.forEach((field) => {
                if (!mergedData[field]) {
                    const source = duplicates.find((lead) => lead[field]);
                    if (source) {
                        mergedData[field] = source[field];
                        filledFrom[field] = source.company_name || `Lead #${source.id}`;
                    }
                }
            });

            if (Object.keys(filledFrom).length > 0) {
                await dispatch(updateLead({ id: primary.id, data: mergedData })).unwrap();
            }

            const mergeNote = `Merged ${duplicates.length} duplicate lead(s): ` +
                duplicates.map((lead) => `${lead.company_name || lead.id} (#${lead.id})`).join(', ') +
                (Object.keys(filledFrom).length > 0
                    ? `. Filled fields: ${Object.entries(filledFrom).map(([f, src]) => `${f} from ${src}`).join(', ')}`
                    : '');
            await dispatch(addLeadActivity({ id: primary.id, data: { type: 'note', note: mergeNote } })).unwrap();

            await Promise.all(duplicates.map((lead) => dispatch(deleteLead(lead.id)).unwrap()));

            setPageMsg(`${duplicates.length} duplicate lead(s) merge ho gaye`);
            closeMergeDialog();
            dispatch(getLeads());
            dispatch(getLeadSummary());
        } catch (err) {
            setMergeError(err || 'Merge nahi ho paya');
        } finally {
            setMergeLoading(false);
        }
    };

    const selectedLeads = useMemo(() => {
        const selected = new Set(selectedIds);
        return (leads || []).filter((lead) => selected.has(lead.id));
    }, [leads, selectedIds]);

    const toggleSelected = (leadId) => {
        setSelectedIds((prev) => prev.includes(leadId)
            ? prev.filter((id) => id !== leadId)
            : [...prev, leadId]);
    };

    const toggleAllFiltered = () => {
        const filteredIds = filtered.map((lead) => lead.id);
        const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
        setSelectedIds(allSelected
            ? selectedIds.filter((id) => !filteredIds.includes(id))
            : [...new Set([...selectedIds, ...filteredIds])]);
    };

    const closeBulkDialog = () => {
        setBulkDialog(null);
        setBulkOwnerId('');
        setBulkStatus('connected');
        setBulkLostReason('');
        setBulkError('');
    };

    const handleBulkAssign = async () => {
        if (!bulkOwnerId) {
            setBulkError('Owner select karo');
            return;
        }
        try {
            await Promise.all(selectedLeads.map((lead) => dispatch(updateLead({
                id: lead.id,
                data: { ...lead, owner_id: parseInt(bulkOwnerId) },
            })).unwrap()));
            setPageMsg(`${selectedLeads.length} lead owner update ho gaye`);
            setSelectedIds([]);
            closeBulkDialog();
            dispatch(getLeads());
        } catch (err) {
            setBulkError(err || 'Bulk assign failed');
        }
    };

    const handleBulkStatusUpdate = async () => {
        if (bulkStatus === 'closed_lost' && !bulkLostReason.trim()) {
            setBulkError('Closed lost ke liye lost reason required hai');
            return;
        }
        try {
            await Promise.all(selectedLeads.map((lead) => dispatch(updateLead({
                id: lead.id,
                data: {
                    ...lead,
                    status: bulkStatus,
                    lost_reason: bulkStatus === 'closed_lost' ? bulkLostReason.trim() : lead.lost_reason,
                },
            })).unwrap()));
            setPageMsg(`${selectedLeads.length} lead status update ho gaye`);
            setSelectedIds([]);
            closeBulkDialog();
            dispatch(getLeads());
            dispatch(getLeadSummary());
        } catch (err) {
            setBulkError(err || 'Bulk status update failed');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await Promise.all(selectedIds.map((leadId) => dispatch(deleteLead(leadId)).unwrap()));
            setPageMsg(`${selectedIds.length} leads delete ho gaye`);
            setSelectedIds([]);
            closeBulkDialog();
            dispatch(getLeadSummary());
        } catch (err) {
            setBulkError(err || 'Bulk delete failed');
        }
    };

    const handleAutoAssignUnassigned = async () => {
        const unassignedLeads = (leads || []).filter((lead) => !getLeadOwnerId(lead));
        if (unassignedLeads.length === 0) {
            setPageMsg('Koi unassigned lead nahi hai');
            return;
        }
        const eligible = getEligibleAssignees(assignableUsers);
        if (eligible.length === 0) {
            setPageMsg('Team me koi assignable member nahi mila');
            return;
        }
        try {
            await Promise.all(unassignedLeads.map((lead) => dispatch(updateLead({
                id: lead.id,
                data: { ...lead, owner_id: getNextRoundRobinOwnerId(assignableUsers) },
            })).unwrap()));
            setPageMsg(`${unassignedLeads.length} unassigned leads round-robin se assign ho gaye`);
            dispatch(getLeads());
            dispatch(getLeadSummary());
        } catch (err) {
            setPageMsg(err || 'Auto-assign failed');
        }
    };

    const handleScoreField = (name, value) => {
        setScoreForm((prev) => ({ ...prev, [name]: Number(value) }));
    };

    const handleStageWeight = (status, value) => {
        setScoreForm((prev) => ({
            ...prev,
            stageWeights: { ...prev.stageWeights, [status]: Number(value) },
        }));
    };

    const handleSaveScoreRules = async () => {
        setScoreSaving(true);
        try {
            await dispatch(saveScoreRules(mergeScoreRules(scoreForm))).unwrap();
            setScoreDialog(false);
            setPageMsg('Lead scoring rules update ho gaye (poori team ke liye)');
        } catch (err) {
            setPageMsg(err || 'Score rules save nahi ho paye');
        } finally {
            setScoreSaving(false);
        }
    };

    const handleResetScoreRules = async () => {
        setScoreSaving(true);
        try {
            await dispatch(saveScoreRules(DEFAULT_SCORE_RULES)).unwrap();
            setScoreForm(DEFAULT_SCORE_RULES);
        } catch (err) {
            setPageMsg(err || 'Reset nahi ho paya');
        } finally {
            setScoreSaving(false);
        }
    };

    const exportRows = (rows) => rows.map((lead) => {
        const activity = activitySignals[lead.id] || getLeadActivitySignals(lead);
        return {
            company_name: lead.company_name || '',
            contact_person: lead.contact_person || '',
            phone: lead.phone || '',
            email: lead.email || '',
            website: lead.website || '',
            country: lead.country || '',
            city: lead.city || '',
            source: lead.source || '',
            product_interest: lead.product_interest || '',
            budget: lead.budget || '',
            currency: lead.currency || 'INR',
            status: lead.status || 'new',
            owner_id: getLeadOwnerId(lead) || '',
            expected_close_date: lead.expected_close_date || '',
            notes: lead.notes || '',
            score: leadSignals[lead.id]?.score || '',
            priority: leadSignals[lead.id]?.priority?.label || '',
            last_activity_type: activity.lastActivity?.type || '',
            last_activity_at: activity.lastActivity?.created_at || '',
            next_action: activity.nextAction || '',
            next_action_due: activity.nextFollowUp?.due_date || '',
            due_today: activity.dueTodayCount || 0,
            overdue_followups: activity.overdueCount || 0,
            activity_count: activity.activitiesCount || 0,
            open_followups: activity.openFollowUpsCount || 0,
        };
    });

    const handleExportCsv = () => {
        const rows = exportRows(filtered);
        const headers = Object.keys(rows[0] || Object.fromEntries([...LEAD_IMPORT_FIELDS, 'score', 'priority'].map((key) => [key, ''])));
        const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(','))].join('\n');
        saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'leads-export.csv');
    };

    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Leads');
        const rows = exportRows(filtered);
        const headers = Object.keys(rows[0] || Object.fromEntries([...LEAD_IMPORT_FIELDS, 'score', 'priority'].map((key) => [key, ''])));
        sheet.columns = headers.map((header) => ({ header, key: header, width: 20 }));
        rows.forEach((row) => sheet.addRow(row));
        sheet.getRow(1).font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), 'leads-export.xlsx');
    };

    const handleImportFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setImportError('');
        try {
            let payloads = [];
            if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(await file.arrayBuffer());
                const sheet = workbook.worksheets[0];
                const rows = [];
                sheet.eachRow((row) => rows.push(row.values.slice(1).map((cell) => cell?.text || cell?.result || cell || '')));
                payloads = rowsToLeadPayloads(rows);
            } else {
                payloads = rowsToLeadPayloads(parseCsv(await file.text()));
            }

            if (!payloads.length) {
                setImportError('Import file me valid company_name rows nahi mile');
                return;
            }

            await Promise.all(payloads.map((payload) => dispatch(createLead(payload)).unwrap()));
            setPageMsg(`${payloads.length} leads import ho gaye`);
            dispatch(getLeads());
            dispatch(getLeadSummary());
        } catch (err) {
            setImportError(err?.message || err || 'Import failed');
        }
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setSourceFilter('');
        setOwnerFilter('');
        setPriorityFilter('');
        setActivityFilter('');
        setFromDate('');
        setToDate('');
    };

    const applyQuickView = (view) => {
        clearFilters();
        if (view === 'hot') setPriorityFilter('hot');
        if (view === 'overdue') setPriorityFilter('hot');
        if (view === 'unassigned') setOwnerFilter('unassigned');
        if (view === 'won') setStatusFilter('closed_won');
        if (view === 'lost') setStatusFilter('closed_lost');
        if (view === 'due_today') setActivityFilter('due_today');
        if (view === 'no_activity') setActivityFilter('no_activity');
        if (view === 'no_next_action') setActivityFilter('no_next_action');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
    };

    // Dynamic custom-field value change inside the Add/Edit Lead form
    const handleLeadCustomFieldChange = (fieldKey, value) => {
        setFormData((p) => ({ ...p, custom_fields: { ...p.custom_fields, [fieldKey]: value } }));
    };

    // ── Manage Custom Fields (field definitions, not lead values) ──
    const handleOpenCustomFieldCreate = () => {
        setCfForm(emptyCustomFieldForm);
        setCfEditId(null);
        setCfError('');
    };

    const handleOpenCustomFieldEdit = (field) => {
        setCfForm({
            label: field.label || '',
            field_type: field.field_type || 'text',
            options: optionsArrayToString(field.options),
            is_required: !!field.is_required,
            sort_order: field.sort_order ?? 0,
        });
        setCfEditId(field.id);
        setCfError('');
    };

    const handleCustomFieldFormChange = (e) => {
        const { name, value } = e.target;
        setCfForm((p) => ({ ...p, [name]: value }));
    };

    const handleSubmitCustomField = async (e) => {
        e.preventDefault();
        setCfError('');
        if (!cfForm.label.trim()) {
            setCfError('Label required hai');
            return;
        }
        if (cfForm.field_type === 'select' && optionsStringToArray(cfForm.options).length === 0) {
            setCfError('Select type ke liye kam se kam ek option required hai');
            return;
        }
        const payload = {
            label: cfForm.label.trim(),
            field_type: cfForm.field_type,
            options: cfForm.field_type === 'select' ? optionsStringToArray(cfForm.options) : null,
            is_required: !!cfForm.is_required,
            sort_order: cfForm.sort_order === '' ? 0 : parseInt(cfForm.sort_order, 10),
        };
        setCfSaving(true);
        try {
            if (cfEditId) {
                await dispatch(updateCustomField({ id: cfEditId, data: payload })).unwrap();
            } else {
                await dispatch(createCustomField(payload)).unwrap();
            }
            handleOpenCustomFieldCreate(); // reset the inline form back to "add new"
        } catch (err) {
            setCfError(err || 'Something went wrong');
        } finally {
            setCfSaving(false);
        }
    };

    const handleDeleteCustomField = async () => {
        if (!cfDeleteId) return;
        await dispatch(deleteCustomField(cfDeleteId));
        setCfDeleteId(null);
    };

    const handleOpenCreate = () => {
        setFormData(emptyForm);
        setEditMode(false);
        setEditId(null);
        setFormError('');
        setDialog(true);
    };

    const handleOpenEdit = (lead) => {
        setFormData({
            company_name: lead.company_name || '',
            contact_person: lead.contact_person || '',
            phone: lead.phone || '',
            email: lead.email || '',
            website: lead.website || '',
            country: lead.country || '',
            city: lead.city || '',
            source: lead.source || 'other',
            product_interest: lead.product_interest || '',
            budget: lead.budget || '',
            currency: lead.currency || 'INR',
            notes: lead.notes || '',
            status: lead.status || 'new',
            owner_id: getLeadOwnerId(lead),
            expected_close_date: lead.expected_close_date || '',
            lost_reason: lead.lost_reason || '',
            custom_fields: lead.custom_fields || {},
        });
        setEditMode(true);
        setEditId(lead.id);
        setFormError('');
        setDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (formData.status === 'closed_lost' && !formData.lost_reason.trim()) {
            setFormError('Closed lost ke liye lost reason required hai');
            return;
        }
        const submitData = {
            ...formData,
            owner_id: formData.owner_id === 'auto'
                ? getNextRoundRobinOwnerId(assignableUsers)
                : (formData.owner_id ? parseInt(formData.owner_id) : null),
            budget: formData.budget ? parseFloat(formData.budget) : null,
        };
        try {
            if (editMode) {
                await dispatch(updateLead({ id: editId, data: submitData })).unwrap();
            } else {
                await dispatch(createLead(submitData)).unwrap();
            }
            setDialog(false);
            dispatch(getLeads());
            dispatch(getLeadSummary());
        } catch (err) {
            setFormError(err || 'Something went wrong');
        }
    };

    const handleDelete = async () => {
        await dispatch(deleteLead(deleteDialog));
        setDeleteDialog(null);
        dispatch(getLeadSummary());
    };

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard sx={{ mb: 3, background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', color: '#fff' }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h5" fontWeight={700}>Lead List's</Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                            <Button variant="outlined" startIcon={<DashboardIcon />} onClick={() => navigate('/crm/dashboard')}
                                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', borderRadius: '10px', textTransform: 'none' }}>
                                Dashboard
                            </Button>
                            <Button variant="outlined" onClick={() => navigate('/crm/pipeline')}
                                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', borderRadius: '10px', textTransform: 'none' }}>
                                Pipeline View
                            </Button>
                        </Stack>
                    </CardContent>
                </GlassCard>
            </motion.div>
            {pageMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPageMsg('')}>{pageMsg}</Alert>}
            {importError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setImportError('')}>{importError}</Alert>}
            {duplicateGroups.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                        {duplicateGroups.length} duplicate signal(s) found by phone/email/company
                    </Typography>
                    <Stack spacing={0.75}>
                        {duplicateGroups.map((group) => (
                            <Stack key={`${group.type}:${group.value}`} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {group.type}: <strong>{group.value}</strong> — {group.leads.map((lead) => lead.company_name || `#${lead.id}`).join(', ')}
                                </Typography>
                                <Button size="small" startIcon={<MergeIcon fontSize="small" />}
                                    onClick={() => openMergeDialog(group)}
                                    sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}>
                                    Review & Merge
                                </Button>
                            </Stack>
                        ))}
                    </Stack>
                </Alert>
            )}

            {sourceAttribution.length > 0 && (
                <GlassCard sx={{ mb: 3 }}>
                    <CardContent>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
                            <Box>
                                <Typography variant="h6" fontWeight={800}>Source ROI Attribution</Typography>
                                <Typography variant="caption" color="text.secondary">Revenue and weighted pipeline grouped by lead source</Typography>
                            </Box>
                            <Chip label="Campaign/source tracking" sx={{ bgcolor: '#ecfeff', color: '#0e7490', fontWeight: 700 }} />
                        </Stack>
                        <Grid container spacing={1.5}>
                            {sourceAttribution.map((item) => (
                                <Grid item xs={12} sm={6} md={2.4} key={item.source}>
                                    <Box sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: '12px', bgcolor: '#fff' }}>
                                        <Typography fontWeight={800} variant="body2">{item.source.replace('_', ' ').toUpperCase()}</Typography>
                                        <Typography variant="caption" color="text.secondary">{item.leads} leads | {item.won} won</Typography>
                                        <Typography variant="body2" fontWeight={700} sx={{ mt: 1 }}>Won {formatMoney(item.revenue)}</Typography>
                                        <Typography variant="caption" color="text.secondary">Weighted {formatMoney(item.pipeline)}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </GlassCard>
            )}

            {/* Filters */}
            <GlassCard sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                        {[
                            { key: 'all', label: 'All Leads', count: leads?.length || 0 },
                            { key: 'hot', label: 'Hot', count: insights.hotLeads },
                            { key: 'overdue', label: 'Overdue', count: insights.overdueLeads },
                            { key: 'unassigned', label: 'Unassigned', count: insights.unassigned },
                            { key: 'due_today', label: 'Due Today', count: insights.dueToday },
                            { key: 'no_activity', label: 'No Activity', count: insights.noActivity },
                            { key: 'no_next_action', label: 'No Next Action', count: insights.noNextAction },
                            { key: 'won', label: 'Won', count: summary?.closed_won || 0 },
                            { key: 'lost', label: 'Lost', count: summary?.closed_lost || 0 },
                        ].map((view) => (
                            <Chip
                                key={view.key}
                                label={`${view.label} ${view.count}`}
                                onClick={() => view.key === 'all' ? clearFilters() : applyQuickView(view.key)}
                                clickable
                                sx={{
                                    bgcolor: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    color: '#334155',
                                    fontWeight: 700,
                                    '&:hover': { bgcolor: '#f8fafc' },
                                }}
                            />
                        ))}
                    </Stack>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} flexWrap="wrap" useFlexGap>
                        <TextField size="small" placeholder="Search company, contact, phone..."
                            value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1 }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment>,
                                sx: { borderRadius: '10px' } }} />
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Status</InputLabel>
                            <Select value={statusFilter} label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: '10px' }}>
                                <MenuItem value="">All Status</MenuItem>
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Source</InputLabel>
                            <Select value={sourceFilter} label="Source"
                                onChange={(e) => setSourceFilter(e.target.value)} sx={{ borderRadius: '10px' }}>
                                <MenuItem value="">All Sources</MenuItem>
                                {SOURCE_OPTIONS.map((s) => (
                                    <MenuItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Owner</InputLabel>
                            <Select value={ownerFilter} label="Owner"
                                onChange={(e) => setOwnerFilter(e.target.value)} sx={{ borderRadius: '10px' }}>
                                <MenuItem value="">All Owners</MenuItem>
                                <MenuItem value="unassigned">Unassigned</MenuItem>
                                {assignableUsers.map((entry) => {
                                    const assignableUser = getAssignableUser(entry);
                                    const assignableUserId = getAssignableUserId(entry);
                                    const assignableUserLabel = getUserLabel(assignableUser);
                                    if (!assignableUserId || !assignableUserLabel) return null;
                                    return (
                                        <MenuItem key={assignableUserId} value={String(assignableUserId)}>
                                            {assignableUserLabel}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Priority</InputLabel>
                            <Select value={priorityFilter} label="Priority"
                                onChange={(e) => setPriorityFilter(e.target.value)} sx={{ borderRadius: '10px' }}>
                                <MenuItem value="">All Priority</MenuItem>
                                <MenuItem value="hot">Hot</MenuItem>
                                <MenuItem value="warm">Warm</MenuItem>
                                <MenuItem value="normal">Normal</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField size="small" label="From Date" type="date" value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <TextField size="small" label="To Date" type="date" value={toDate}
                            onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <FormControl size="small" sx={{ minWidth: 170 }}>
                            <InputLabel>Activity</InputLabel>
                            <Select value={activityFilter} label="Activity"
                                onChange={(e) => setActivityFilter(e.target.value)} sx={{ borderRadius: '10px' }}>
                                <MenuItem value="">All Activity</MenuItem>
                                <MenuItem value="due_today">Due Today</MenuItem>
                                <MenuItem value="overdue_followup">Overdue Follow-up</MenuItem>
                                <MenuItem value="meeting">Meeting</MenuItem>
                                <MenuItem value="no_activity">No Activity</MenuItem>
                                <MenuItem value="no_next_action">No Next Action</MenuItem>
                            </Select>
                        </FormControl>

                        {customFields.length > 0 && (
                            <>
                                <FormControl size="small" sx={{ minWidth: 170 }}>
                                    <InputLabel>Custom Field</InputLabel>
                                    <Select value={cfFilterKey} label="Custom Field"
                                        onChange={(e) => { setCfFilterKey(e.target.value); setCfFilterValue(''); }}
                                        sx={{ borderRadius: '10px' }}>
                                        <MenuItem value="">None</MenuItem>
                                        {customFields.map((f) => (
                                            <MenuItem key={f.id} value={f.field_key}>{f.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {cfFilterKey && (() => {
                                    const activeField = customFields.find((f) => f.field_key === cfFilterKey);
                                    if (activeField?.field_type === 'select') {
                                        return (
                                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                                <InputLabel>Value</InputLabel>
                                                <Select value={cfFilterValue} label="Value"
                                                    onChange={(e) => setCfFilterValue(e.target.value)}
                                                    sx={{ borderRadius: '10px' }}>
                                                    <MenuItem value="">Any (set)</MenuItem>
                                                    {(activeField.options || []).map((opt) => (
                                                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        );
                                    }
                                    return (
                                        <TextField size="small" label="Value" placeholder="Any (set)"
                                            value={cfFilterValue} onChange={(e) => setCfFilterValue(e.target.value)}
                                            sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                                    );
                                })()}
                            </>
                        )}

                        {can('leads.edit') && insights.unassigned > 0 && (
                            <Button variant="outlined" startIcon={<AssignIcon />} onClick={handleAutoAssignUnassigned}
                                sx={{ borderRadius: '10px', textTransform: 'none', color: '#b45309', borderColor: '#fcd34d' }}>
                                Auto-Assign ({insights.unassigned})
                            </Button>
                        )}
                        {can('leads.edit') && (
                            <Button variant="outlined" startIcon={<CustomFieldsIcon />}
                                onClick={() => { handleOpenCustomFieldCreate(); setCustomFieldsDialog(true); }}
                                sx={{ borderRadius: '10px', textTransform: 'none' }}>
                                Manage Custom Fields
                            </Button>
                        )}
                        {can('leads.create') && (
                            <GradientButton startIcon={<AddIcon />} onClick={handleOpenCreate}>
                                Add Lead
                            </GradientButton>
                        )}
                    </Stack>
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap
                        sx={{
                            justifyContent: { xs: 'stretch', sm: 'flex-end' },
                            alignItems: 'flex-start',
                            mt: 2
                        }}
                    >
                        <Button component="label" variant="outlined" startIcon={<ImportIcon />}
                            sx={{ borderRadius: '10px', textTransform: 'none' }}>
                            Import
                            <input hidden type="file" accept=".csv,.xlsx,.xls" onChange={handleImportFile} />
                        </Button>
                        <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExportCsv}
                            sx={{ borderRadius: '10px', textTransform: 'none' }}>
                            CSV
                        </Button>
                        <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExportExcel}
                            sx={{ borderRadius: '10px', textTransform: 'none' }}>
                            Excel
                        </Button>
                    </Stack>
                </CardContent>
            </GlassCard>

            {selectedIds.length > 0 && (
                <GlassCard sx={{ mb: 2, border: '1px solid #c7d2fe', bgcolor: '#eef2ff' }}>
                    <CardContent sx={{ py: 1.5 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
                            <Typography fontWeight={800} color="#3730a3">
                                {selectedIds.length} selected
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Button size="small" variant="outlined" startIcon={<AssignIcon />} onClick={() => setBulkDialog('assign')}
                                    sx={{ borderRadius: '10px', textTransform: 'none', bgcolor: '#fff' }}>
                                    Assign Owner
                                </Button>
                                <Button size="small" variant="outlined" onClick={() => setBulkDialog('status')}
                                    sx={{ borderRadius: '10px', textTransform: 'none', bgcolor: '#fff' }}>
                                    Update Status
                                </Button>
                                <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setBulkDialog('delete')}
                                    sx={{ borderRadius: '10px', textTransform: 'none', bgcolor: '#fff' }}>
                                    Delete
                                </Button>
                                <Button size="small" onClick={() => setSelectedIds([])} sx={{ borderRadius: '10px', textTransform: 'none' }}>
                                    Clear
                                </Button>
                            </Stack>
                        </Stack>
                    </CardContent>
                </GlassCard>
            )}

            {/* Table */}
            <GlassCard>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}
                    sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e5e7eb' }}>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>Lead Records</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Showing {filtered.length} of {leads?.length || 0} leads
                        </Typography>
                    </Box>
                    <Chip label={`${insights.hotLeads} hot | ${insights.overdueLeads} overdue`} size="small"
                        sx={{ bgcolor: '#fff7ed', color: '#c2410c', fontWeight: 700, alignSelf: { xs: 'flex-start', sm: 'center' } }} />
                </Stack>
                <TableContainer sx={{ maxHeight: 620, overflowX: 'auto' }}>
                    <Table stickyHeader sx={{ minWidth: 1380 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#ffffff' }}>
                                {['Select', '#', 'Company', 'Contact', 'Assigned To', 'Value', 'Source', 'Status', 'Health', 'Last Activity', 'Next Action', ...(customFields.length > 0 ? ['Custom Fields'] : []), 'Actions'].map((h) => (
                                    <TableCell key={h} sx={{ fontWeight: 800, color: '#374151', bgcolor: '#ffffff', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', fontSize: 12 }}>
                                        {h === 'Select' ? (
                                            <Checkbox
                                                size="small"
                                                checked={filtered.length > 0 && filtered.every((lead) => selectedIds.includes(lead.id))}
                                                indeterminate={filtered.some((lead) => selectedIds.includes(lead.id)) && !filtered.every((lead) => selectedIds.includes(lead.id))}
                                                onChange={toggleAllFiltered}
                                            />
                                        ) : h}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={customFields.length > 0 ? 13 : 12} align="center" sx={{ py: 4 }}>
                                    <CircularProgress size={28} />
                                </TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={customFields.length > 0 ? 13 : 12} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                    <BusinessIcon sx={{ fontSize: 40, color: '#d1d5db', display: 'block', mx: 'auto', mb: 1 }} />
                                    No leads found
                                </TableCell></TableRow>
                            ) : paginatedLeads.map((lead, i) => {
                                const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                                const signal = leadSignals[lead.id] || getLeadSignals(lead, scoreRules);
                                const duplicateCount = duplicateGroups.filter((group) => group.leads.some((item) => item.id === lead.id)).length;
                                const activitySignal = activitySignals[lead.id] || getLeadActivitySignals(lead);
                                const nextTone = getActivityTone(activitySignal.nextAction);
                                return (
                                    <TableRow key={lead.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' }, '& td': { borderBottomColor: '#eef2f7' } }}
                                        onClick={() => navigate(`/crm/leads/${lead.id}`)}>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Checkbox size="small" checked={selectedIds.includes(lead.id)} onChange={() => toggleSelected(lead.id)} />
                                        </TableCell>
                                        <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Avatar sx={{ bgcolor: sc.color, width: 34, height: 34, fontSize: 13 }}>
                                                    {lead.company_name?.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                                                        <Typography fontWeight={600} variant="body2">{lead.company_name}</Typography>
                                                        {duplicateCount > 0 && (
                                                            <Chip label="Duplicate" size="small" sx={{ height: 18, bgcolor: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 800 }} />
                                                        )}
                                                    </Stack>
                                                    <Typography variant="caption" color="text.secondary">{lead.country || '—'}</Typography>
                                                </Box>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>{lead.contact_person || '—'}</Typography>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                {lead.phone && <Typography variant="caption" color="text.secondary">📞 {lead.phone}</Typography>}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#e0e7ff', color: '#4338ca' }}>
                                                    {getLeadOwnerLabel(lead).charAt(0)}
                                                </Avatar>
                                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                    {getLeadOwnerLabel(lead)}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={700}>
                                                {formatMoney(signal.value, lead.currency)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Weighted {formatMoney(signal.value * ((SALES_STAGE_WEIGHT[lead.status] ?? 10) / 100), lead.currency)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={lead.source?.replace('_', ' ').toUpperCase()} size="small"
                                                sx={{ bgcolor: '#f3f4f6', color: '#374151', fontSize: 10, fontWeight: 600 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={sc.label} size="small"
                                                sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600, fontSize: 11 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Stack spacing={0.5}>
                                                <Chip label={`${signal.score}% ${signal.priority.label}`} size="small"
                                                    sx={{ bgcolor: signal.priority.bg, color: signal.priority.color, fontWeight: 700, fontSize: 11 }} />
                                                {(signal.overdueFollowUps > 0 || signal.isStale) && (
                                                    <Typography variant="caption" color="error.main" fontWeight={600}>
                                                        {signal.overdueFollowUps > 0 ? `${signal.overdueFollowUps} overdue follow-up` : 'No next action'}
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <LastActivityCell lead={lead} activitySignal={activitySignal} />
                                        </TableCell>
                                        <TableCell>
                                            <Stack spacing={0.5}>
                                                {activitySignal.nextFollowUp ? (
                                                    <>
                                                        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                                                            <Chip label={`Next: ${nextTone.label}`} size="small"
                                                                sx={{ bgcolor: nextTone.bg, color: nextTone.color, fontWeight: 700, fontSize: 10, height: 20, textTransform: 'capitalize' }} />
                                                            {activitySignal.dueTodayCount > 0 && (
                                                                <Chip label="Due Today" size="small" sx={{ bgcolor: '#fffbeb', color: '#b45309', fontWeight: 800, fontSize: 10, height: 20 }} />
                                                            )}
                                                            {activitySignal.overdueCount > 0 && (
                                                                <Chip label="Overdue" size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 800, fontSize: 10, height: 20 }} />
                                                            )}
                                                        </Stack>
                                                        <Typography variant="body2" fontWeight={700} color={activitySignal.overdueCount > 0 ? 'error.main' : 'text.primary'}>
                                                            {formatActivityDate(activitySignal.nextFollowUp.due_date)}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                                                            {activitySignal.nextFollowUp.note || 'Follow-up scheduled'}
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <Chip label="No Next Action" size="small" sx={{ bgcolor: '#fff7ed', color: '#c2410c', fontWeight: 800, fontSize: 10 }} />
                                                )}
                                                {activitySignal.hasMeeting && (
                                                    <Chip label="Meeting" size="small" sx={{ alignSelf: 'flex-start', bgcolor: '#f3e8ff', color: '#7c3aed', fontWeight: 700, fontSize: 10, height: 20 }} />
                                                )}
                                                <Typography variant="caption" color="text.secondary">
                                                    Close: {lead.expected_close_date || 'Not planned'}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        {customFields.length > 0 && (
                                            <TableCell>
                                                <Stack spacing={0.5}>
                                                    {customFields
                                                        .filter((f) => lead.custom_fields?.[f.field_key] !== undefined && lead.custom_fields?.[f.field_key] !== null && lead.custom_fields?.[f.field_key] !== '')
                                                        .map((f) => (
                                                            <Chip key={f.id} size="small"
                                                                label={`${f.label}: ${lead.custom_fields[f.field_key]}`}
                                                                sx={{ bgcolor: '#f3f4f6', color: '#374151', fontSize: 10, fontWeight: 600, height: 20, alignSelf: 'flex-start' }} />
                                                        ))}
                                                    {customFields.every((f) => !lead.custom_fields?.[f.field_key]) && (
                                                        <Typography variant="caption" color="text.secondary">—</Typography>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5}>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/crm/leads/${lead.id}`); }}
                                                        sx={{ color: '#6366f1' }}>
                                                        <ViewIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                {can('leads.edit') && (
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEdit(lead); }}
                                                            sx={{ color: '#f59e0b' }}>
                                                            <EditIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {can('leads.delete') && (
                                                    <Tooltip title="Delete">
                                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteDialog(lead.id); }}
                                                            sx={{ color: '#ef4444' }}>
                                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={filtered.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                />
            </GlassCard>

            {/* Add/Edit Dialog */}
            <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    <Typography fontWeight={700}>{editMode ? 'Edit Lead' : 'Add New Lead'}</Typography>
                    <IconButton size="small" onClick={() => setDialog(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <Box component="form" onSubmit={handleSubmit}>
                    <DialogContent sx={{ pt: 3 }}>
                        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Company Name *" name="company_name"
                                    value={formData.company_name} onChange={handleChange} required
                                    InputProps={{ startAdornment: <InputAdornment position="start"><BusinessIcon sx={{ fontSize: 16 }} /></InputAdornment> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Contact Person" name="contact_person"
                                    value={formData.contact_person} onChange={handleChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Phone" name="phone"
                                    value={formData.phone} onChange={handleChange}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 16 }} /></InputAdornment> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Email" name="email" type="email"
                                    value={formData.email} onChange={handleChange}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ fontSize: 16 }} /></InputAdornment> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Country" name="country"
                                    value={formData.country} onChange={handleChange}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><PublicIcon sx={{ fontSize: 16 }} /></InputAdornment> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="City" name="city"
                                    value={formData.city} onChange={handleChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Source</InputLabel>
                                    <Select name="source" value={formData.source} label="Source"
                                        onChange={handleChange} sx={{ borderRadius: '10px' }}>
                                        {SOURCE_OPTIONS.map((s) => (
                                            <MenuItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Product Interest" name="product_interest"
                                    value={formData.product_interest} onChange={handleChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth size="small" label="Budget" name="budget" type="number"
                                    value={formData.budget} onChange={handleChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Currency</InputLabel>
                                    <Select name="currency" value={formData.currency} label="Currency"
                                        onChange={handleChange} sx={{ borderRadius: '10px' }}>
                                        {['INR', 'USD', 'EUR', 'GBP', 'AED'].map((c) => (
                                            <MenuItem key={c} value={c}>{c}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth size="small" label="Expected Close Date" name="expected_close_date"
                                    type="date" value={formData.expected_close_date} onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Assign To (Owner)</InputLabel>
                                    <Select name="owner_id" value={formData.owner_id || ''} label="Assign To (Owner)"
                                        onChange={(e) => setFormData(p => ({ ...p, owner_id: e.target.value === 'auto' ? 'auto' : (e.target.value ? parseInt(e.target.value) : '') }))}
                                        sx={{ borderRadius: '10px' }}>
                                        <MenuItem value="">
                                            {getUserLabel(currentUser) || 'Self'}
                                        </MenuItem>
                                        <MenuItem value="auto">
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <AssignIcon sx={{ fontSize: 16, color: '#b45309' }} />
                                                <span>Auto-Assign (Round Robin)</span>
                                            </Stack>
                                        </MenuItem>
                                        {assignableUsers.map((entry) => {
                                            const assignableUser = getAssignableUser(entry);
                                            const assignableUserId = getAssignableUserId(entry);
                                            const assignableUserLabel = getUserLabel(assignableUser);
                                            const roleLabel = getAssignableUserRoleLabel(entry);

                                            if (!assignableUserId || !assignableUserLabel) return null;

                                            return (
                                                <MenuItem key={assignableUserId} value={assignableUserId}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Avatar sx={{ width: 20, height: 20, fontSize: 11, bgcolor: '#6366f1' }}>
                                                            {assignableUserLabel.charAt(0)}
                                                        </Avatar>
                                                        <span>{assignableUserLabel}</span>
                                                        {roleLabel && <Typography variant="caption" color="text.secondary">({roleLabel})</Typography>}
                                                    </Stack>
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select name="status" value={formData.status} label="Status"
                                        onChange={handleChange} sx={{ borderRadius: '10px' }}>
                                        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                                            <MenuItem key={key} value={key}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: val.color }} />
                                                    <span>{val.label}</span>
                                                </Stack>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            {formData.status === 'closed_lost' && (
                                <Grid item xs={12}>
                                    <TextField fullWidth size="small" label="Lost Reason *" name="lost_reason"
                                        value={formData.lost_reason} onChange={handleChange} required
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                <TextField fullWidth size="small" label="Notes" name="notes" multiline rows={3}
                                    value={formData.notes} onChange={handleChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            {customFields.length > 0 && (
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
                                        Custom Fields
                                    </Typography>
                                </Grid>
                            )}
                            {customFields.map((f) => {
                                const val = formData.custom_fields?.[f.field_key] ?? '';
                                if (f.field_type === 'select') {
                                    return (
                                        <Grid item xs={12} sm={6} key={f.id}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>{f.label}{f.is_required ? ' *' : ''}</InputLabel>
                                                <Select value={val} label={`${f.label}${f.is_required ? ' *' : ''}`}
                                                    required={f.is_required}
                                                    onChange={(e) => handleLeadCustomFieldChange(f.field_key, e.target.value)}
                                                    sx={{ borderRadius: '10px' }}>
                                                    <MenuItem value="">—</MenuItem>
                                                    {(f.options || []).map((opt) => (
                                                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    );
                                }
                                return (
                                    <Grid item xs={12} sm={6} key={f.id}>
                                        <TextField fullWidth size="small"
                                            label={`${f.label}${f.is_required ? ' *' : ''}`}
                                            required={f.is_required}
                                            type={f.field_type === 'number' ? 'number' : f.field_type === 'date' ? 'date' : 'text'}
                                            InputLabelProps={f.field_type === 'date' ? { shrink: true } : undefined}
                                            value={val}
                                            onChange={(e) => handleLeadCustomFieldChange(f.field_key, e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button variant="outlined" onClick={() => setDialog(false)}
                            startIcon={<CloseIcon />} sx={{ borderRadius: '10px' }}>Cancel</Button>
                        <GradientButton type="submit" disabled={actionLoading} startIcon={<SaveIcon />}>
                            {actionLoading ? 'Saving...' : editMode ? 'Update Lead' : 'Create Lead'}
                        </GradientButton>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog open={!!bulkDialog} onClose={closeBulkDialog} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>
                    {bulkDialog === 'assign' ? 'Bulk Assign Owner' : bulkDialog === 'status' ? 'Bulk Status Update' : 'Bulk Delete Leads'}
                </DialogTitle>
                <DialogContent>
                    {bulkError && <Alert severity="error" sx={{ mb: 2 }}>{bulkError}</Alert>}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {selectedIds.length} selected lead(s) par action apply hoga.
                    </Typography>
                    {bulkDialog === 'assign' && (
                        <FormControl fullWidth size="small">
                            <InputLabel>Owner</InputLabel>
                            <Select value={bulkOwnerId} label="Owner" onChange={(e) => setBulkOwnerId(e.target.value)} sx={{ borderRadius: '10px' }}>
                                {assignableUsers.map((entry) => {
                                    const assignableUser = getAssignableUser(entry);
                                    const assignableUserId = getAssignableUserId(entry);
                                    const assignableUserLabel = getUserLabel(assignableUser);
                                    if (!assignableUserId || !assignableUserLabel) return null;
                                    return <MenuItem key={assignableUserId} value={assignableUserId}>{assignableUserLabel}</MenuItem>;
                                })}
                            </Select>
                        </FormControl>
                    )}
                    {bulkDialog === 'status' && (
                        <Stack spacing={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select value={bulkStatus} label="Status" onChange={(e) => setBulkStatus(e.target.value)} sx={{ borderRadius: '10px' }}>
                                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                                        <MenuItem key={key} value={key}>{val.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {bulkStatus === 'closed_lost' && (
                                <TextField fullWidth size="small" label="Lost Reason *" value={bulkLostReason}
                                    onChange={(e) => setBulkLostReason(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            )}
                        </Stack>
                    )}
                    {bulkDialog === 'delete' && (
                        <Alert severity="warning">Selected leads aur unki activities delete ho jaayengi.</Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeBulkDialog} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    {bulkDialog === 'assign' && <GradientButton onClick={handleBulkAssign} disabled={actionLoading}>Assign</GradientButton>}
                    {bulkDialog === 'status' && <GradientButton onClick={handleBulkStatusUpdate} disabled={actionLoading}>Update</GradientButton>}
                    {bulkDialog === 'delete' && <Button onClick={handleBulkDelete} variant="contained" color="error" disabled={actionLoading} sx={{ borderRadius: '10px' }}>Delete</Button>}
                </DialogActions>
            </Dialog>

            <Dialog open={scoreDialog} onClose={() => setScoreDialog(false)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Lead Score & Priority Rules</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                            <Grid item xs={12} sm={6} md={4} key={status}>
                                <TextField fullWidth size="small" type="number" label={`${config.label} weight`}
                                    value={scoreForm.stageWeights?.[status] ?? 0}
                                    onChange={(e) => handleStageWeight(status, e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                        ))}
                        {[
                            ['highValueBudget', 'High Value Budget'],
                            ['highValueBonus', 'High Value Bonus'],
                            ['contactBonus', 'Contact Bonus'],
                            ['ownerBonus', 'Owner Bonus'],
                            ['productBonus', 'Product Interest Bonus'],
                            ['closingSoonBonus', 'Closing Soon Bonus'],
                            ['overduePenalty', 'Overdue Penalty'],
                            ['stalePenalty', 'No Next Action Penalty'],
                            ['hotScore', 'Hot Priority Score'],
                            ['warmScore', 'Warm Priority Score'],
                            ['staleDays', 'Stale After Days'],
                        ].map(([key, label]) => (
                            <Grid item xs={12} sm={6} md={4} key={key}>
                                <TextField fullWidth size="small" type="number" label={label}
                                    value={scoreForm[key]} onChange={(e) => handleScoreField(key, e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleResetScoreRules} disabled={scoreSaving} sx={{ borderRadius: '10px' }}>Reset</Button>
                    <Button onClick={() => setScoreDialog(false)} disabled={scoreSaving} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <GradientButton onClick={handleSaveScoreRules} disabled={scoreSaving}
                        startIcon={scoreSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}>
                        {scoreSaving ? 'Saving...' : 'Save Rules'}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Manage Custom Fields Dialog */}
            <Dialog open={customFieldsDialog} onClose={() => setCustomFieldsDialog(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    <Typography fontWeight={700}>Manage Custom Fields</Typography>
                    <IconButton size="small" onClick={() => setCustomFieldsDialog(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <List dense sx={{ mb: 2 }}>
                        {customFields.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
                                Abhi tak koi custom field nahi banaya gaya.
                            </Typography>
                        )}
                        {customFields.map((f) => (
                            <ListItem key={f.id}
                                sx={{ border: '1px solid #e5e7eb', borderRadius: '10px', mb: 1, bgcolor: cfEditId === f.id ? '#eef2ff' : '#fff' }}>
                                <ListItemText
                                    primary={`${f.label}${f.is_required ? ' *' : ''}`}
                                    secondary={`${f.field_type}${f.field_type === 'select' ? ` — ${optionsArrayToString(f.options)}` : ''} · key: ${f.field_key}`}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton size="small" onClick={() => handleOpenCustomFieldEdit(f)} sx={{ color: '#f59e0b' }}>
                                        <EditIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => setCfDeleteId(f.id)} sx={{ color: '#ef4444' }}>
                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>

                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                        {cfEditId ? 'Edit Field' : 'Add New Field'}
                    </Typography>
                    {cfError && <Alert severity="error" sx={{ mb: 2 }}>{cfError}</Alert>}
                    <Box component="form" onSubmit={handleSubmitCustomField}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={7}>
                                <TextField fullWidth size="small" label="Label *" name="label"
                                    value={cfForm.label} onChange={handleCustomFieldFormChange} required
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={5}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Field Type</InputLabel>
                                    <Select name="field_type" value={cfForm.field_type} label="Field Type"
                                        onChange={handleCustomFieldFormChange} sx={{ borderRadius: '10px' }}>
                                        {CUSTOM_FIELD_TYPES.map((t) => (
                                            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            {cfForm.field_type === 'select' && (
                                <Grid item xs={12}>
                                    <TextField fullWidth size="small" label="Options (comma separated) *" name="options"
                                        placeholder="e.g. 1-10, 11-50, 50+"
                                        value={cfForm.options} onChange={handleCustomFieldFormChange}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                                </Grid>
                            )}
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Sort Order" name="sort_order" type="number"
                                    value={cfForm.sort_order} onChange={handleCustomFieldFormChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                                <FormControlLabel
                                    control={<Checkbox checked={cfForm.is_required}
                                        onChange={(e) => setCfForm((p) => ({ ...p, is_required: e.target.checked }))} />}
                                    label="Required" />
                            </Grid>
                        </Grid>
                        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
                            {cfEditId && (
                                <Button onClick={handleOpenCustomFieldCreate} disabled={cfSaving} sx={{ borderRadius: '10px' }}>
                                    Cancel Edit
                                </Button>
                            )}
                            <GradientButton type="submit" disabled={cfSaving}
                                startIcon={cfSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}>
                                {cfSaving ? 'Saving...' : cfEditId ? 'Update Field' : 'Add Field'}
                            </GradientButton>
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setCustomFieldsDialog(false)} sx={{ borderRadius: '10px' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Custom Field Confirm Dialog */}
            <Dialog open={!!cfDeleteId} onClose={() => setCfDeleteId(null)}
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Delete Custom Field?</DialogTitle>
                <DialogContent>
                    <Alert severity="warning">
                        Is field ki definition delete ho jaayegi. Leads par pehle se saved values database mein reh jaayengi lekin form/table mein nahi dikhengi.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setCfDeleteId(null)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <Button onClick={handleDeleteCustomField} variant="contained" color="error" sx={{ borderRadius: '10px' }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Delete Lead?</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary">Yeh lead aur uski sari activities delete ho jaayengi.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialog(null)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: '10px' }}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!mergeGroup} onClose={closeMergeDialog} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Review Duplicate Leads</DialogTitle>
                <DialogContent>
                    {mergeError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setMergeError('')}>{mergeError}</Alert>}
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Jisko "Keep" select karoge, wahi lead bachega. Baaki leads se sirf khaali fields fill honge
                        (jaise phone/email missing ho), phir wo delete ho jaayenge. Un duplicate leads ki apni activities/follow-ups
                        transfer nahi hoti (backend me abhi yeh support nahi hai) — is action ka summary primary lead pe ek note ke roop me save ho jaayega.
                    </Alert>
                    {mergeGroup && (
                        <RadioGroup value={mergePrimaryId || ''} onChange={(e) => setMergePrimaryId(parseInt(e.target.value))}>
                            <Stack spacing={1.5}>
                                {mergeGroup.leads.map((lead) => (
                                    <Box key={lead.id} sx={{
                                        border: '1px solid', borderColor: lead.id === mergePrimaryId ? '#6366f1' : '#e5e7eb',
                                        borderRadius: '10px', p: 1.5,
                                        bgcolor: lead.id === mergePrimaryId ? '#eef2ff' : 'transparent',
                                    }}>
                                        <FormControlLabel
                                            value={lead.id}
                                            control={<Radio size="small" />}
                                            label={
                                                <Box>
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {lead.company_name || `Lead #${lead.id}`}
                                                        {lead.id === mergePrimaryId && (
                                                            <Chip label="Keep" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: 10 }} />
                                                        )}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {lead.contact_person || '-'} · {lead.phone || 'No phone'} · {lead.email || 'No email'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Status: {STATUS_CONFIG[lead.status]?.label || lead.status} · Owner: {getUserLabel(lead.owner) || '-'}
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{ alignItems: 'flex-start', m: 0 }}
                                        />
                                    </Box>
                                ))}
                            </Stack>
                        </RadioGroup>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeMergeDialog} sx={{ borderRadius: '10px' }} disabled={mergeLoading}>Cancel</Button>
                    <Button onClick={handleMergeConfirm} variant="contained" sx={{ borderRadius: '10px' }} disabled={mergeLoading}
                        startIcon={mergeLoading ? <CircularProgress size={16} color="inherit" /> : <MergeIcon />}>
                        {mergeLoading ? 'Merging...' : 'Merge & Delete Duplicates'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// Export with Error Boundary
export default function LeadList() {
    return (
        <ErrorBoundary>
            <LeadListComponent />
        </ErrorBoundary>
    );
}