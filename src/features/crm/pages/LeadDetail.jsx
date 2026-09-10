import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getLeadById, updateLeadStatus, addLeadActivity,
    addLeadFollowUp, markFollowUpDone, sendLeadEmail,
} from '../state/leadSlice';
import {
    getCampaigns, attachLeadsToCampaign, detachLeadFromCampaign,
} from '../state/campaignSlice';
import {
    Box, Card, CardContent, Typography, Button, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, Stack, Avatar, IconButton, Select,
    MenuItem, FormControl, InputLabel, Tab, Tabs,
    CircularProgress, Alert, Tooltip, Grid, Checkbox, ListItemText,
    Divider, InputBase,
} from '@mui/material';
import {
    ArrowBack as BackIcon, Phone as PhoneIcon,
    Email as EmailIcon, WhatsApp as WhatsAppIcon,
    Note as NoteIcon, Event as EventIcon,
    CheckCircle as CheckIcon,
    Save as SaveIcon, Add as AddIcon,
    Edit as EditIcon,
    Close as CloseIcon,
    Send as SendIcon,
    Business as BusinessIcon,
    TrendingUp as TrendingUpIcon,
    WarningAmber as WarningAmberIcon,
    AccessTime as AccessTimeIcon,
    AccountTree as AccountTreeIcon,
    Description as DescriptionIcon,
    ReceiptLong as ReceiptLongIcon,
    Groups as GroupsIcon,
    Insights as InsightsIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const GlassCard = styled(Card)(() => ({
    background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
    borderRadius: '16px', border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
}));

const GradientButton = styled(Button)(({ gradient }) => ({
    background: gradient || 'linear-gradient(135deg,#667eea,#764ba2)',
    color: '#fff', borderRadius: '10px', textTransform: 'none', fontWeight: 600,
    '&:hover': { opacity: 0.9 }, '&:disabled': { background: '#ccc' },
}));

const STATUS_CONFIG = {
    new:                    { color: '#6366f1', bg: '#eef2ff', label: 'New' },
    contact_attempted:      { color: '#f59e0b', bg: '#fffbeb', label: 'Contact Attempted' },
    connected:              { color: '#0891b2', bg: '#ecfeff', label: 'Connected' },
    requirement_discussion: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Requirement Discussion' },
    quotation_sent:         { color: '#ec4899', bg: '#fdf2f8', label: 'Quotation Sent' },
    negotiation:            { color: '#f97316', bg: '#fff7ed', label: 'Negotiation' },
    positive_response:      { color: '#10b981', bg: '#ecfdf5', label: 'Positive Response' },
    po_received:            { color: '#0284c7', bg: '#eff6ff', label: 'PO Received' },
    invoice_generated:      { color: '#7c3aed', bg: '#f5f3ff', label: 'Invoice Generated' },
    closed_won:             { color: '#16a34a', bg: '#dcfce7', label: '🎉 Closed Won' },
    closed_lost:            { color: '#dc2626', bg: '#fee2e2', label: '❌ Closed Lost' },
};

const ACTIVITY_ICONS = {
    call:          <PhoneIcon sx={{ fontSize: 16 }} />,
    email:         <EmailIcon sx={{ fontSize: 16 }} />,
    whatsapp:      <WhatsAppIcon sx={{ fontSize: 16 }} />,
    meeting:       <EventIcon sx={{ fontSize: 16 }} />,
    note:          <NoteIcon sx={{ fontSize: 16 }} />,
    status_change: <EditIcon sx={{ fontSize: 16 }} />,
};

const ACTIVITY_COLORS = {
    call: '#16a34a', email: '#0284c7', whatsapp: '#25d366',
    meeting: '#7c3aed', note: '#6366f1', status_change: '#f59e0b',
};

const STAGE_ORDER = [
    'new',
    'contact_attempted',
    'connected',
    'requirement_discussion',
    'quotation_sent',
    'negotiation',
    'positive_response',
    'po_received',
    'invoice_generated',
    'closed_won',
    'closed_lost',
];

const EnterpriseCard = styled(Card)(() => ({
    background: '#fff',
    borderRadius: '18px',
    border: '1px solid rgba(148,163,184,0.18)',
    boxShadow: '0 12px 32px rgba(15,23,42,0.06)',
}));

const MetricCard = styled(Box)(() => ({
    padding: '16px',
    borderRadius: '14px',
    background: 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)',
    border: '1px solid rgba(148,163,184,0.14)',
    height: '100%',
}));

const ActionCard = styled(Box)(() => ({
    padding: '14px 16px',
    borderRadius: '14px',
    border: '1px solid rgba(148,163,184,0.16)',
    background: '#fff',
}));

const getUserLabel = (user) => {
    if (!user) return '';
    return user.name || user.full_name || user.username || user.email || '';
};

const getLeadOwnerLabel = (lead) => {
    return (
        getUserLabel(lead?.owner) ||
        getUserLabel(lead?.assigned_to) ||
        getUserLabel(lead?.assigned_user) ||
        lead?.owner_name ||
        lead?.assigned_to_name ||
        'Unassigned'
    );
};

const getLeadCampaignItems = (lead) => {
    const candidates = [
        lead?.campaigns,
        lead?.campaign_list,
        lead?.campaign_items,
        lead?.data?.campaigns,
        lead?.data?.campaign_list,
    ];
    return candidates.find(Array.isArray) || [];
};

/* ---------------------------------------------------------------- */
/* RecipientRow — chip-based multi-email input used in Email Dialog */
/* ---------------------------------------------------------------- */
function RecipientRow({ label, value, onChange, required, trailing, onRemoveRow }) {
    const [input, setInput] = useState('');

    const addEmail = (raw) => {
        const email = raw.trim().replace(/,$/, '');
        if (!email) return;
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (isValid && !value.includes(email)) {
            onChange([...value, email]);
        }
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
            e.preventDefault();
            addEmail(input);
        } else if (e.key === 'Backspace' && !input && value.length) {
            onChange(value.slice(0, -1));
        }
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 0.75, minHeight: 40 }}>
            <Typography sx={{ width: 56, fontSize: '0.8rem', color: 'text.secondary', pt: 0.75, flexShrink: 0 }}>
                {label}{required && ' *'}
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                {value.map((email) => (
                    <Chip
                        key={email}
                        label={email}
                        size="small"
                        onDelete={() => onChange(value.filter((v) => v !== email))}
                        sx={{
                            borderRadius: '8px', bgcolor: 'rgba(253,100,2,0.08)',
                            color: '#fd6402', fontWeight: 600, fontSize: '0.75rem',
                            '& .MuiChip-deleteIcon': { color: '#fd6402' },
                        }}
                    />
                ))}
                <InputBase
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => addEmail(input)}
                    placeholder={value.length ? '' : `Add ${label.toLowerCase()} recipient`}
                    sx={{ fontSize: '0.875rem', flex: 1, minWidth: 120 }}
                />
            </Box>
            <Box sx={{ pt: 0.25 }}>
                {trailing}
                {onRemoveRow && (
                    <IconButton size="small" onClick={onRemoveRow}>
                        <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
}

export default function LeadDetail() {
    const { id }     = useParams();
    const dispatch   = useDispatch();
    const navigate   = useNavigate();
    const { selectedLead: lead, isLoading, actionLoading } = useSelector((s) => s.leads);
    const { campaigns } = useSelector((s) => s.campaigns);

    const [tab,           setTab]           = useState(0);
    const [statusDialog,  setStatusDialog]  = useState(false);
    const [activityDialog,setActivityDialog]= useState(false);
    const [followUpDialog,setFollowUpDialog]= useState(false);
    const [campaignDialog,setCampaignDialog]= useState(false);

    // ---- Email dialog state (array-based To/Cc/Bcc) ----
    const [emailDialog, setEmailDialog] = useState(false);
    const [emailForm, setEmailForm] = useState({ to: [], cc: [], bcc: [], subject: '', body: '' });
    const [showCc, setShowCc] = useState(false);
    const [showBcc, setShowBcc] = useState(false);
    const [emailSending, setEmailSending] = useState(false);
    const [emailError, setEmailError] = useState('');

    const [newStatus,     setNewStatus]     = useState('');
    const [lostReason,    setLostReason]    = useState('');
    const [statusError,   setStatusError]   = useState('');
    const [activity,      setActivity]      = useState({ type: 'note', note: '', call_duration: '', outcome: '' });
    const [followUp,      setFollowUp]      = useState({ due_date: '', note: '', reminder_at: '', next_action: 'call' });
    const [selectedCampaignIds, setSelectedCampaignIds] = useState([]);
    const [msg,           setMsg]           = useState('');
    const [campaignError, setCampaignError] = useState('');

    useEffect(() => {
        dispatch(getLeadById(id));
        dispatch(getCampaigns());
    }, [dispatch, id]);

    if (isLoading || !lead) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
    }

    const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
    const createdDate = lead.created_at ? new Date(lead.created_at) : null;
    const now = new Date();
    const activities = lead.activities || [];
    const followUps = lead.follow_ups || [];
    const lastActivity = activities[0];
    const getFollowUpDueDays = (item) => {
        if (!item.due_date) return null;
        const due = new Date(item.due_date);
        if (Number.isNaN(due.getTime())) return null;
        return Math.ceil((due.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
    };
    const overdueFollowUps = followUps.filter((item) => !item.is_done && (item.is_overdue || (getFollowUpDueDays(item) ?? 0) < 0));
    const dueTodayFollowUps = followUps.filter((item) => !item.is_done && getFollowUpDueDays(item) === 0);
    const openFollowUps = followUps.filter((item) => !item.is_done);
    const nextFollowUp = [...openFollowUps].sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0))[0];
    const daysOpen = createdDate
        ? Math.max(0, Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)))
        : 0;
    const lastTouchDays = lastActivity?.created_at
        ? Math.max(0, Math.floor((now - new Date(lastActivity.created_at)) / (1000 * 60 * 60 * 24)))
        : null;
    const stageIndex = Math.max(0, STAGE_ORDER.indexOf(lead.status));
    const progressPercent = Math.min(100, Math.round((stageIndex / (STAGE_ORDER.length - 2)) * 100));
    const budgetValue = Number(lead.budget || 0);
    const healthScore = Math.max(
        15,
        Math.min(
            96,
            55 +
            (lead.status === 'closed_won' ? 30 : 0) +
            (lead.status === 'positive_response' ? 12 : 0) +
            (budgetValue > 0 ? 8 : 0) +
            (openFollowUps.length > 0 ? 6 : -8) -
            overdueFollowUps.length * 8 -
            ((lastTouchDays ?? 10) > 7 ? 10 : 0)
        )
    );
    const healthTone =
        healthScore >= 75 ? { label: 'Healthy', color: '#16a34a', bg: '#dcfce7' } :
        healthScore >= 50 ? { label: 'Watchlist', color: '#d97706', bg: '#fef3c7' } :
            { label: 'At Risk', color: '#dc2626', bg: '#fee2e2' };
    const metrics = [
        {
            label: 'Lead Health',
            value: `${healthScore}%`,
            hint: healthTone.label,
            icon: <InsightsIcon sx={{ color: healthTone.color }} />,
        },
        {
            label: 'Pipeline Progress',
            value: `${progressPercent}%`,
            hint: sc.label,
            icon: <TrendingUpIcon sx={{ color: sc.color }} />,
        },
        {
            label: 'Days Open',
            value: daysOpen,
            hint: createdDate ? `Created ${lead.created_at}` : 'Create date unavailable',
            icon: <AccessTimeIcon sx={{ color: '#475569' }} />,
        },
        {
            label: 'Open Follow-ups',
            value: openFollowUps.length,
            hint: overdueFollowUps.length ? `${overdueFollowUps.length} overdue` : dueTodayFollowUps.length ? `${dueTodayFollowUps.length} due today` : 'No overdue items',
            icon: <WarningAmberIcon sx={{ color: overdueFollowUps.length ? '#dc2626' : '#16a34a' }} />,
        },
    ];

    const recommendedActions = [
        overdueFollowUps.length
            ? 'Resolve overdue follow-ups first. Enterprise teams treat overdue follow-ups as the top response risk.'
            : 'Follow-up discipline is under control. Keep the next committed action visible on every update.',
        !lead.budget
            ? 'Budget is missing. Capture commercial intent before pushing the lead deeper into negotiation.'
            : `Commercial value is ${lead.currency} ${budgetValue.toLocaleString()}. Use this as the working deal benchmark.`,
        getLeadOwnerLabel(lead) === 'Unassigned'
            ? 'Assign a clear owner. Enterprise lead tracking fails quickly when accountability is shared informally.'
            : `Current owner is ${getLeadOwnerLabel(lead)}. Review workload and response SLA for this lead.`,
        lead.status === 'quotation_sent' || lead.status === 'negotiation'
            ? 'This lead is in a commercial stage. Attach quotation and discussion notes to avoid context loss.'
            : 'Push structured notes into each activity so future commercial stages have proper context.',
    ];

    const conversionQuery = new URLSearchParams({
        lead_id: String(lead.id),
        company_name: lead.company_name || '',
        contact_person: lead.contact_person || '',
        phone: lead.phone || '',
        email: lead.email || '',
    }).toString();
    const moduleLinks = [
        { label: 'Convert to Client', path: `/clients?${conversionQuery}`, icon: <GroupsIcon fontSize="small" /> },
        { label: 'Create Company', path: `/companies?${conversionQuery}`, icon: <BusinessIcon fontSize="small" /> },
        { label: 'Quotation / Invoice', path: `/invoices?${conversionQuery}`, icon: <ReceiptLongIcon fontSize="small" /> },
        { label: 'Campaigns', path: '/crm/campaigns', icon: <AccountTreeIcon fontSize="small" /> },
    ];
    const linkedCampaigns = getLeadCampaignItems(lead);
    const linkedCampaignIds = linkedCampaigns.map((campaign) => campaign.id);
    const availableCampaigns = campaigns.filter((campaign) => !linkedCampaignIds.includes(campaign.id));

    const handleStatusUpdate = async () => {
        if (newStatus === 'closed_lost' && !lostReason.trim()) {
            setStatusError('Closed lost ke liye lost reason required hai');
            return;
        }
        await dispatch(updateLeadStatus({ id: lead.id, status: newStatus, lost_reason: lostReason.trim() }));
        setStatusDialog(false); setStatusError(''); setMsg('Status updated!');
        setTimeout(() => setMsg(''), 3000);
    };

    const handleAddActivity = async () => {
        await dispatch(addLeadActivity({ id: lead.id, data: activity }));
        setActivityDialog(false);
        setActivity({ type: 'note', note: '', call_duration: '', outcome: '' });
        setMsg('Activity logged!'); setTimeout(() => setMsg(''), 3000);
    };

    const handleOpenEmailDialog = () => {
        setEmailForm({
            to: lead.email ? [lead.email] : [],
            cc: [],
            bcc: [],
            subject: '',
            body: '',
        });
        setShowCc(false);
        setShowBcc(false);
        setEmailError('');
        setEmailDialog(true);
    };

    const handleSendEmail = async () => {
        setEmailError('');
        if (!emailForm.to.length) {
            setEmailError('To address zaroori hai (lead ka email save nahi hai)');
            return;
        }
        if (!emailForm.subject.trim() || !emailForm.body.trim()) {
            setEmailError('Subject aur message dono zaroori hain');
            return;
        }
        setEmailSending(true);
        try {
            await dispatch(sendLeadEmail({
                id: lead.id,
                data: {
                    to: emailForm.to.join(','),
                    cc: emailForm.cc.length ? emailForm.cc.join(',') : undefined,
                    bcc: emailForm.bcc.length ? emailForm.bcc.join(',') : undefined,
                    subject: emailForm.subject.trim(),
                    body: emailForm.body,
                },
            })).unwrap();
            setEmailDialog(false);
            dispatch(getLeadById(lead.id)); // refresh activity timeline so the sent email shows up
            setMsg('Email bhej diya gaya!'); setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setEmailError(err || 'Email bhejne mein dikkat hui');
        } finally {
            setEmailSending(false);
        }
    };

    const handleAddFollowUp = async () => {
        await dispatch(addLeadFollowUp({ id: lead.id, data: followUp }));
        setFollowUpDialog(false);
        setFollowUp({ due_date: '', note: '' });
        setMsg('Follow-up scheduled!'); setTimeout(() => setMsg(''), 3000);
    };

    const handleMarkDone = async (followUpId) => {
        await dispatch(markFollowUpDone({ followUpId, leadId: lead.id }));
    };

    const handleOpenCampaignDialog = () => {
        setSelectedCampaignIds([]);
        setCampaignError('');
        setCampaignDialog(true);
    };

    const handleAttachCampaigns = async () => {
        if (selectedCampaignIds.length === 0) {
            setCampaignError('At least one campaign select karo');
            return;
        }

        try {
            await Promise.all(
                selectedCampaignIds.map((campaignId) =>
                    dispatch(attachLeadsToCampaign({ id: campaignId, lead_ids: [lead.id] })).unwrap()
                )
            );
            setCampaignDialog(false);
            setSelectedCampaignIds([]);
            setCampaignError('');
            dispatch(getLeadById(id));
            dispatch(getCampaigns());
            setMsg('Campaign linked!');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setCampaignError(err || 'Campaign attach nahi ho paya');
        }
    };

    const handleDetachCampaign = async (campaignId) => {
        try {
            await dispatch(detachLeadFromCampaign({ id: campaignId, leadId: lead.id })).unwrap();
            dispatch(getLeadById(id));
            dispatch(getCampaigns());
            setMsg('Campaign removed!');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setCampaignError(err || 'Campaign detach nahi ho paya');
        }
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {msg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}

            {/* Header Card */}
            <GlassCard sx={{ mb: 3, border: '1px solid #e5e7eb', boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}>
                <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
                        <Button startIcon={<BackIcon />} onClick={() => navigate('/crm/leads')}
                            sx={{ textTransform: 'none', color: '#475569' }}>
                            Back to Leads
                        </Button>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                            <Button size="small" variant="outlined" startIcon={<NoteIcon />} onClick={() => setActivityDialog(true)}
                                sx={{ borderRadius: '10px', textTransform: 'none' }}>
                                Log Activity
                            </Button>
                            <Button size="small" variant="outlined" startIcon={<EmailIcon />} onClick={handleOpenEmailDialog}
                                sx={{ borderRadius: '10px', textTransform: 'none' }}>
                                Send Email
                            </Button>
                            <Button size="small" variant="outlined" startIcon={<EventIcon />} onClick={() => setFollowUpDialog(true)}
                                sx={{ borderRadius: '10px', textTransform: 'none' }}>
                                Follow-up
                            </Button>
                            <GradientButton size="small" onClick={() => { setNewStatus(lead.status); setLostReason(lead.lost_reason || ''); setStatusError(''); setStatusDialog(true); }}>
                                Change Status
                            </GradientButton>
                        </Stack>
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: sc.color, width: 56, height: 56, fontSize: 22, fontWeight: 700 }}>
                                {lead.company_name?.charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight={700}>{lead.company_name}</Typography>
                                <Typography color="text.secondary">{lead.contact_person}</Typography>
                                <Stack direction="row" spacing={1} mt={0.5}>
                                    {lead.phone && <Chip icon={<PhoneIcon sx={{ fontSize: 14 }} />} label={lead.phone} size="small" variant="outlined" />}
                                    {lead.email && <Chip icon={<EmailIcon sx={{ fontSize: 14 }} />} label={lead.email} size="small" variant="outlined" />}
                                    {lead.country && <Chip label={lead.country} size="small" variant="outlined" />}
                                </Stack>
                            </Box>
                        </Stack>
                        <Stack spacing={1} alignItems={{ sm: 'flex-end' }}>
                            <Chip label={sc.label} sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 800, fontSize: 13 }} />
                            <Typography variant="caption" color="text.secondary">
                                Owner: {getLeadOwnerLabel(lead)}
                            </Typography>
                        </Stack>
                    </Stack>
                </CardContent>
            </GlassCard>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {metrics.map((item) => (
                    <Grid item xs={12} sm={6} lg={3} key={item.label}>
                        <MetricCard>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                                    <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>{item.value}</Typography>
                                    <Typography variant="body2" color="text.secondary">{item.hint}</Typography>
                                </Box>
                                {item.icon}
                            </Stack>
                        </MetricCard>
                    </Grid>
                ))}
            </Grid>

            {/* Info Grid */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Source',           value: lead.source?.replace('_',' ').toUpperCase() },
                    { label: 'Product Interest', value: lead.product_interest || '—' },
                    { label: 'Budget',           value: lead.budget ? `${lead.currency} ${Number(lead.budget).toLocaleString()}` : '—' },
                    { label: 'Expected Close',   value: lead.expected_close_date || '—' },
                    { label: 'Assigned To',      value: getLeadOwnerLabel(lead) },
                    { label: 'Created',          value: lead.created_at },
                ].map((item) => (
                    <Grid item xs={12} sm={6} md={2} key={item.label}>
                        <GlassCard sx={{ height: '100%', border: '1px solid #e5e7eb' }}>
                            <CardContent sx={{ py: 1.5, px: 2 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>{item.label}</Typography>
                                <Typography fontWeight={700} variant="body2" sx={{ mt: 0.25 }} noWrap>{item.value}</Typography>
                            </CardContent>
                        </GlassCard>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} lg={7}>
                    <EnterpriseCard>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box>
                                    <Typography variant="h6" fontWeight={700}>Action Center</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Recommended next moves for structured lead progression.
                                    </Typography>
                                </Box>
                                <Chip label={healthTone.label} sx={{ bgcolor: healthTone.bg, color: healthTone.color, fontWeight: 700 }} />
                            </Stack>
                            <Stack spacing={1.25}>
                                {recommendedActions.map((item) => (
                                    <ActionCard key={item}>
                                        <Typography variant="body2" color="text.secondary">{item}</Typography>
                                    </ActionCard>
                                ))}
                            </Stack>
                        </CardContent>
                    </EnterpriseCard>
                </Grid>
                <Grid item xs={12} lg={5}>
                    <EnterpriseCard>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                <Box>
                                    <Typography variant="h6" fontWeight={700} mb={0.5}>Connected Modules</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Lead ko business flow ke saath connect karo, isolated record mat rakho.
                                    </Typography>
                                </Box>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenCampaignDialog}
                                    sx={{ borderRadius: '10px', textTransform: 'none' }}
                                >
                                    Link Campaign
                                </Button>
                            </Stack>
                            <Stack spacing={1.25}>
                                {moduleLinks.map((item) => (
                                    <Button
                                        key={item.label}
                                        fullWidth
                                        variant="outlined"
                                        startIcon={item.icon}
                                        onClick={() => navigate(item.path)}
                                        sx={{ justifyContent: 'flex-start', textTransform: 'none', borderRadius: '12px' }}
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                            </Stack>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="text.secondary">Linked Campaigns</Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                                    {linkedCampaigns.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Koi campaign linked nahi hai.
                                        </Typography>
                                    ) : linkedCampaigns.map((campaign) => (
                                        <Chip
                                            key={campaign.id}
                                            label={campaign.name}
                                            onDelete={() => handleDetachCampaign(campaign.id)}
                                            deleteIcon={<CloseIcon />}
                                            sx={{ bgcolor: '#eef2ff', color: '#4338ca', fontWeight: 600 }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                            <Box sx={{ mt: 2, p: 1.5, borderRadius: '12px', bgcolor: '#f8fafc' }}>
                                <Typography variant="caption" color="text.secondary">Last touch</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {lastTouchDays === null ? 'No activity logged yet' : `${lastTouchDays} day(s) ago`}
                                </Typography>
                            </Box>
                        </CardContent>
                    </EnterpriseCard>
                </Grid>
            </Grid>

            {/* Tabs */}
            <GlassCard sx={{ border: '1px solid #e5e7eb' }}>
                <Box sx={{ borderBottom: '1px solid #e5e7eb', bgcolor: '#fff', position: 'sticky', top: 0, zIndex: 1 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 2, minHeight: 48 }}>
                        <Tab label={`Activities (${lead.activities?.length || 0})`} />
                        <Tab label={`Follow-ups (${lead.follow_ups?.length || 0})`} />
                        <Tab label="Commercial" />
                        {lead.notes && <Tab label="Notes" />}
                    </Tabs>
                </Box>

                <CardContent>
                    {/* Tab 0 — Activities */}
                    {tab === 0 && (
                        <Box>
                            <Stack direction="row" justifyContent="flex-end" mb={2}>
                                <GradientButton startIcon={<AddIcon />} size="small"
                                    onClick={() => setActivityDialog(true)}>
                                    Log Activity
                                </GradientButton>
                            </Stack>
                            {lead.activities?.length === 0 ? (
                                <Typography color="text.secondary" textAlign="center" py={3}>
                                    No activities yet — log a call, email, or note!
                                </Typography>
                            ) : (
                                <Stack spacing={0}>
                                    {lead.activities?.map((act, i) => (
                                        <Stack key={act.id} direction="row" spacing={2} sx={{ pb: 2 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <Avatar sx={{ bgcolor: ACTIVITY_COLORS[act.type] + '20',
                                                    color: ACTIVITY_COLORS[act.type], width: 32, height: 32 }}>
                                                    {ACTIVITY_ICONS[act.type]}
                                                </Avatar>
                                                {i < lead.activities.length - 1 && (
                                                    <Box sx={{ width: 2, flex: 1, bgcolor: '#e5e7eb', my: 0.5 }} />
                                                )}
                                            </Box>
                                            <Box sx={{ flex: 1, pb: 1 }}>
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography fontWeight={600} variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                        {act.type.replace('_', ' ')}
                                                        {act.call_duration_formatted && ` (${act.call_duration_formatted})`}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">{act.created_at}</Typography>
                                                </Stack>
                                                <Typography variant="body2" color="text.secondary">{act.note}</Typography>
                                                {act.outcome && (
                                                    <Chip label={`Outcome: ${act.outcome}`} size="small"
                                                        sx={{ mt: 0.5, bgcolor: '#f3f4f6', fontSize: 11 }} />
                                                )}
                                                <Typography variant="caption" color="text.disabled">by {act.user?.name}</Typography>
                                            </Box>
                                        </Stack>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    )}

                    {/* Tab 1 — Follow-ups */}
                    {tab === 1 && (
                        <Box>
                            <Stack direction="row" justifyContent="flex-end" mb={2}>
                                <GradientButton startIcon={<AddIcon />} size="small"
                                    gradient="linear-gradient(135deg,#0891b2,#0e7490)"
                                    onClick={() => setFollowUpDialog(true)}>
                                    Schedule Follow-up
                                </GradientButton>
                            </Stack>
                            {lead.follow_ups?.length === 0 ? (
                                <Typography color="text.secondary" textAlign="center" py={3}>
                                    No follow-ups scheduled
                                </Typography>
                            ) : (
                                <Stack spacing={1.5}>
                                    {lead.follow_ups?.map((f) => (
                                        <Box key={f.id} sx={{
                                            p: 2, borderRadius: '10px',
                                            border: `1px solid ${f.is_done ? '#d1fae5' : f.is_overdue ? '#fee2e2' : '#e5e7eb'}`,
                                            bgcolor: f.is_done ? '#f0fdf4' : f.is_overdue ? '#fff5f5' : '#fafafa',
                                        }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <EventIcon sx={{ fontSize: 16, color: f.is_done ? '#16a34a' : f.is_overdue ? '#dc2626' : '#6b7280' }} />
                                                        <Typography fontWeight={600} variant="body2">{f.due_date}</Typography>
                                                        {(f.is_overdue || (getFollowUpDueDays(f) ?? 0) < 0) && !f.is_done && (
                                                            <Chip label="Overdue" size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontSize: 10 }} />
                                                        )}
                                                        {getFollowUpDueDays(f) === 0 && !f.is_done && (
                                                            <Chip label="Due Today" size="small" sx={{ bgcolor: '#fffbeb', color: '#d97706', fontSize: 10 }} />
                                                        )}
                                                        {f.is_done && (
                                                            <Chip label="Done" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontSize: 10 }} />
                                                        )}
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary" mt={0.5}>{f.note}</Typography>
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                                                        {(f.next_action || f.action_type) && <Chip label={`Next: ${f.next_action || f.action_type}`} size="small" sx={{ fontSize: 10, bgcolor: '#eef2ff', color: '#4338ca' }} />}
                                                        {(f.reminder_at || f.reminder_time) && <Chip label={`Reminder: ${f.reminder_at || f.reminder_time}`} size="small" sx={{ fontSize: 10, bgcolor: '#ecfeff', color: '#0e7490' }} />}
                                                    </Stack>
                                                </Box>
                                                {!f.is_done && (
                                                    <Tooltip title="Mark as Done">
                                                        <IconButton size="small" onClick={() => handleMarkDone(f.id)}
                                                            sx={{ color: '#16a34a' }}>
                                                            <CheckIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    )}

                    {/* Tab 2 — Notes */}
                    {tab === 2 && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <MetricCard>
                                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                        <DescriptionIcon sx={{ color: '#7c3aed' }} />
                                        <Typography fontWeight={700}>Commercial Snapshot</Typography>
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">Product Interest</Typography>
                                    <Typography fontWeight={600} mb={1.5}>{lead.product_interest || 'Not captured yet'}</Typography>
                                    <Typography variant="body2" color="text.secondary">Budget</Typography>
                                    <Typography fontWeight={600} mb={1.5}>
                                        {lead.budget ? `${lead.currency} ${Number(lead.budget).toLocaleString()}` : 'Not captured yet'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Expected Close</Typography>
                                    <Typography fontWeight={600}>{lead.expected_close_date || 'No target date'}</Typography>
                                </MetricCard>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <MetricCard>
                                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                        <ReceiptLongIcon sx={{ color: '#0284c7' }} />
                                        <Typography fontWeight={700}>Commercial Readiness</Typography>
                                    </Stack>
                                    <Stack spacing={1}>
                                        <Chip label={lead.status === 'quotation_sent' || lead.status === 'negotiation' || lead.status === 'po_received' || lead.status === 'invoice_generated' ? 'Quotation stage reached' : 'Quotation not linked yet'} sx={{ justifyContent: 'flex-start', bgcolor: '#eff6ff', color: '#1d4ed8' }} />
                                        <Chip label={lead.status === 'po_received' || lead.status === 'invoice_generated' || lead.status === 'closed_won' ? 'PO / commitment stage reached' : 'PO not confirmed yet'} sx={{ justifyContent: 'flex-start', bgcolor: '#f5f3ff', color: '#7c3aed' }} />
                                        <Chip label={lead.status === 'invoice_generated' || lead.status === 'closed_won' ? 'Invoice workflow reached' : 'Invoice not linked yet'} sx={{ justifyContent: 'flex-start', bgcolor: '#ecfeff', color: '#0f766e' }} />
                                    </Stack>
                                </MetricCard>
                            </Grid>
                        </Grid>
                    )}

                    {tab === 3 && (
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                            {lead.notes}
                        </Typography>
                    )}
                </CardContent>
            </GlassCard>

            {/* Status Dialog */}
            <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Change Lead Status</DialogTitle>
                <DialogContent>
                    {statusError && <Alert severity="error" sx={{ mb: 2 }}>{statusError}</Alert>}
                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                        <InputLabel>New Status</InputLabel>
                        <Select value={newStatus} label="New Status"
                            onChange={(e) => setNewStatus(e.target.value)} sx={{ borderRadius: '10px' }}>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                <MenuItem key={k} value={k}>
                                    <Chip label={v.label} size="small"
                                        sx={{ bgcolor: v.bg, color: v.color, fontWeight: 600 }} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {newStatus === 'closed_lost' && (
                        <TextField fullWidth size="small" label="Lost Reason *" value={lostReason}
                            onChange={(e) => setLostReason(e.target.value)} sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setStatusDialog(false)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <GradientButton onClick={handleStatusUpdate} disabled={actionLoading || (newStatus === 'closed_lost' && !lostReason.trim())}>
                        Update Status
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Activity Dialog */}
            <Dialog open={activityDialog} onClose={() => setActivityDialog(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Log Activity</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Activity Type</InputLabel>
                            <Select value={activity.type} label="Activity Type"
                                onChange={(e) => setActivity((p) => ({ ...p, type: e.target.value }))}
                                sx={{ borderRadius: '10px' }}>
                                {Object.entries(ACTIVITY_ICONS).map(([k, icon]) => (
                                    <MenuItem key={k} value={k}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            {icon} <span style={{ textTransform: 'capitalize' }}>{k.replace('_', ' ')}</span>
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField fullWidth size="small" label="Note" multiline rows={3}
                            value={activity.note} onChange={(e) => setActivity((p) => ({ ...p, note: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        {activity.type === 'call' && (
                            <TextField fullWidth size="small" label="Call Duration (seconds)" type="number"
                                value={activity.call_duration} onChange={(e) => setActivity((p) => ({ ...p, call_duration: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        )}
                        <TextField fullWidth size="small" label="Outcome" placeholder="e.g. Interested, Call back, No response"
                            value={activity.outcome} onChange={(e) => setActivity((p) => ({ ...p, outcome: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setActivityDialog(false)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <GradientButton onClick={handleAddActivity} disabled={actionLoading} startIcon={<SaveIcon />}>
                        Log Activity
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Email Dialog — Zoho/Gmail style compose */}
            <Dialog
                open={emailDialog}
                onClose={() => !emailSending && setEmailDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '18px', overflow: 'hidden' } }}
            >
                {/* Header */}
                <Box
                    sx={{
                        px: 3, py: 2.25,
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        background: 'linear-gradient(135deg, #fd6402 0%, #ff8a3d 100%)',
                    }}
                >
                    <Box sx={{
                        width: 38, height: 38, borderRadius: '12px',
                        bgcolor: 'rgba(255,255,255,0.22)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <EmailIcon sx={{ color: '#fff', fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
                            Compose Email
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem' }}>
                            Reply directly to your inbox — Reply-To set automatically
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => setEmailDialog(false)}
                        disabled={emailSending}
                        sx={{ color: '#fff' }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                <DialogContent sx={{ p: 0 }}>
                    {emailError && (
                        <Alert severity="error" sx={{ borderRadius: 0 }}>{emailError}</Alert>
                    )}

                    {/* Recipients block */}
                    <Box sx={{ px: 3, pt: 2.5 }}>
                        <RecipientRow
                            label="To"
                            required
                            value={emailForm.to}
                            onChange={(val) => setEmailForm((p) => ({ ...p, to: val }))}
                            trailing={
                                <Stack direction="row" spacing={0.5}>
                                    {!showCc && (
                                        <Button size="small" onClick={() => setShowCc(true)} sx={{ minWidth: 0, fontSize: '0.72rem', color: 'text.secondary' }}>
                                            Cc
                                        </Button>
                                    )}
                                    {!showBcc && (
                                        <Button size="small" onClick={() => setShowBcc(true)} sx={{ minWidth: 0, fontSize: '0.72rem', color: 'text.secondary' }}>
                                            Bcc
                                        </Button>
                                    )}
                                </Stack>
                            }
                        />
                        {showCc && (
                            <RecipientRow
                                label="Cc"
                                value={emailForm.cc}
                                onChange={(val) => setEmailForm((p) => ({ ...p, cc: val }))}
                                onRemoveRow={() => { setShowCc(false); setEmailForm((p) => ({ ...p, cc: [] })); }}
                            />
                        )}
                        {showBcc && (
                            <RecipientRow
                                label="Bcc"
                                value={emailForm.bcc}
                                onChange={(val) => setEmailForm((p) => ({ ...p, bcc: val }))}
                                onRemoveRow={() => { setShowBcc(false); setEmailForm((p) => ({ ...p, bcc: [] })); }}
                            />
                        )}
                    </Box>

                    <Divider sx={{ mx: 3, my: 1 }} />

                    {/* Subject */}
                    <Box sx={{ px: 3, display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ width: 56, fontSize: '0.8rem', color: 'text.secondary', flexShrink: 0 }}>
                            Subject
                        </Typography>
                        <TextField
                            fullWidth
                            variant="standard"
                            placeholder="Enter subject *"
                            value={emailForm.subject}
                            onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))}
                            InputProps={{ disableUnderline: true }}
                            inputProps={{ maxLength: 150 }}
                            sx={{ '& input': { fontSize: '0.9rem', fontWeight: 600, py: 1 } }}
                        />
                    </Box>

                    <Divider sx={{ mx: 3 }} />

                    {/* Body */}
                    <Box sx={{ px: 3, py: 2 }}>
                        <TextField
                            fullWidth
                            variant="standard"
                            placeholder="Write your message..."
                            multiline
                            rows={8}
                            value={emailForm.body}
                            onChange={(e) => setEmailForm((p) => ({ ...p, body: e.target.value }))}
                            InputProps={{ disableUnderline: true }}
                            sx={{ '& textarea': { fontSize: '0.875rem', lineHeight: 1.6 } }}
                        />
                    </Box>
                </DialogContent>

                <Divider />

                {/* Footer */}
                <DialogActions sx={{ px: 3, py: 1.75, justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                        {emailForm.body?.length || 0} characters
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Button
                            onClick={() => setEmailDialog(false)}
                            disabled={emailSending}
                            sx={{ borderRadius: '10px', color: 'text.secondary' }}
                        >
                            Cancel
                        </Button>
                        <GradientButton
                            onClick={handleSendEmail}
                            disabled={emailSending || !emailForm.to?.length || !emailForm.subject}
                            startIcon={emailSending ? <CircularProgress size={16} color="inherit" /> : <SendIcon fontSize="small" />}
                            sx={{ borderRadius: '10px', px: 3 }}
                        >
                            {emailSending ? 'Sending...' : 'Send'}
                        </GradientButton>
                    </Stack>
                </DialogActions>
            </Dialog>

            {/* Follow-up Dialog */}
            <Dialog open={followUpDialog} onClose={() => setFollowUpDialog(false)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Schedule Follow-up</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField fullWidth size="small" label="Date & Time *" type="datetime-local"
                            value={followUp.due_date} onChange={(e) => setFollowUp((p) => ({ ...p, due_date: e.target.value }))}
                            InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <FormControl fullWidth size="small">
                            <InputLabel>Next Action</InputLabel>
                            <Select value={followUp.next_action} label="Next Action"
                                onChange={(e) => setFollowUp((p) => ({ ...p, next_action: e.target.value }))}
                                sx={{ borderRadius: '10px' }}>
                                {['call', 'whatsapp', 'email', 'meeting', 'quotation', 'invoice'].map((item) => (
                                    <MenuItem key={item} value={item}>{item.replace('_', ' ').toUpperCase()}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField fullWidth size="small" label="Reminder" type="datetime-local"
                            value={followUp.reminder_at} onChange={(e) => setFollowUp((p) => ({ ...p, reminder_at: e.target.value }))}
                            InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <TextField fullWidth size="small" label="Note" multiline rows={2}
                            value={followUp.note} onChange={(e) => setFollowUp((p) => ({ ...p, note: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setFollowUpDialog(false)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <GradientButton gradient="linear-gradient(135deg,#0891b2,#0e7490)"
                        onClick={handleAddFollowUp} disabled={actionLoading} startIcon={<SaveIcon />}>
                        Schedule
                    </GradientButton>
                </DialogActions>
            </Dialog>

            <Dialog open={campaignDialog} onClose={() => setCampaignDialog(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Link Campaigns</DialogTitle>
                <DialogContent>
                    {campaignError && <Alert severity="error" sx={{ mb: 2 }}>{campaignError}</Alert>}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {lead.company_name} ko campaign ke saath attach karo.
                    </Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Select Campaigns</InputLabel>
                        <Select
                            multiple
                            value={selectedCampaignIds}
                            label="Select Campaigns"
                            onChange={(e) => setSelectedCampaignIds(e.target.value)}
                            renderValue={(selected) =>
                                campaigns
                                    .filter((campaign) => selected.includes(campaign.id))
                                    .map((campaign) => campaign.name)
                                    .join(', ')
                            }
                            sx={{ borderRadius: '10px' }}
                        >
                            {availableCampaigns.map((campaign) => (
                                <MenuItem key={campaign.id} value={campaign.id}>
                                    <Checkbox checked={selectedCampaignIds.includes(campaign.id)} size="small" />
                                    <ListItemText
                                        primary={campaign.name}
                                        secondary={campaign.status || campaign.type || ''}
                                    />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setCampaignDialog(false)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <GradientButton onClick={handleAttachCampaigns} disabled={actionLoading} startIcon={<SaveIcon />}>
                        Link Campaigns
                    </GradientButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
}