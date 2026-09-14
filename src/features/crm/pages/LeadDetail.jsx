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
    getQuotations, createQuotationFromLead, updateQuotation,
    updateQuotationStatus, deleteQuotation, getQuotationById, sendQuotationEmail,
} from '../state/quotationSlice';
import { getProducts } from '../../inventory/state/inventorySlice';
import {
    Box, Card, CardContent, Typography, Button, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, Stack, Avatar, IconButton, Select,
    MenuItem, FormControl, InputLabel, Tab, Tabs,
    CircularProgress, Alert, Tooltip, Grid, Checkbox, ListItemText,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Autocomplete, Divider,
} from '@mui/material';
import {
    ArrowBack as BackIcon, Phone as PhoneIcon,
    Email as EmailIcon, WhatsApp as WhatsAppIcon,
    Note as NoteIcon, Event as EventIcon,
    CheckCircle as CheckIcon,
    Save as SaveIcon, Add as AddIcon,
    Edit as EditIcon,
    Close as CloseIcon,
    Business as BusinessIcon,
    TrendingUp as TrendingUpIcon,
    WarningAmber as WarningAmberIcon,
    AccessTime as AccessTimeIcon,
    AccountTree as AccountTreeIcon,
    Description as DescriptionIcon,
    ReceiptLong as ReceiptLongIcon,
    Groups as GroupsIcon,
    Insights as InsightsIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Download as DownloadIcon,
    Send as SendIcon,
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

// ── Quotations (built directly from a lead) ────────────────────────
const QUOTATION_STATUS_CONFIG = {
    draft:    { color: '#64748b', bg: '#f1f5f9', label: 'Draft' },
    sent:     { color: '#0284c7', bg: '#eff6ff', label: 'Sent' },
    approved: { color: '#16a34a', bg: '#dcfce7', label: 'Approved' },
    rejected: { color: '#dc2626', bg: '#fee2e2', label: 'Rejected' },
    expired:  { color: '#b45309', bg: '#fffbeb', label: 'Expired' },
};

const emptyQuotationItem = () => ({
    product_id: null, item_name: '', description: '', hsn_code: '',
    qty: 1, unit: 'pcs', rate: '', tax_rate: 0,
});

const emptyQuotationForm = () => ({
    quotation_date: new Date().toISOString().slice(0, 10),
    expiry_date: '',
    notes: '',
    terms_conditions: '',
    items: [emptyQuotationItem()],
});

const calcItemAmount = (item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    return qty * rate;
};

const calcItemTax = (item) => {
    const amount = calcItemAmount(item);
    const taxRate = Number(item.tax_rate) || 0;
    return (amount * taxRate) / 100;
};

const calcQuotationTotals = (items) => {
    const subTotal = items.reduce((sum, item) => sum + calcItemAmount(item), 0);
    const taxTotal = items.reduce((sum, item) => sum + calcItemTax(item), 0);
    return { subTotal, taxTotal, grandTotal: subTotal + taxTotal };
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

export default function LeadDetail() {
    const { id }     = useParams();
    const dispatch   = useDispatch();
    const navigate   = useNavigate();
    const { selectedLead: lead, isLoading, actionLoading } = useSelector((s) => s.leads);
    const { campaigns } = useSelector((s) => s.campaigns);
    const { quotations = [], actionLoading: quotationSaving } = useSelector((s) => s.quotations || {});
    const { products = [] } = useSelector((s) => s.inventory || {});

    const [tab,           setTab]           = useState(0);
    const [statusDialog,  setStatusDialog]  = useState(false);
    const [activityDialog,setActivityDialog]= useState(false);
    const [followUpDialog,setFollowUpDialog]= useState(false);
    const [campaignDialog,setCampaignDialog]= useState(false);
    const [emailDialog, setEmailDialog] = useState(false);
    const [emailForm, setEmailForm] = useState({ to: '', cc: '', subject: '', body: '' });
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
    const [quotationDialog, setQuotationDialog] = useState(false);
    const [quotationEditId, setQuotationEditId] = useState(null);
    const [quotationForm, setQuotationForm] = useState(emptyQuotationForm());
    const [quotationError, setQuotationError] = useState('');
    const [quotationDeleteId, setQuotationDeleteId] = useState(null);
    const [pdfLoadingId, setPdfLoadingId] = useState(null);
    const [sendQuotationDialog, setSendQuotationDialog] = useState(null); // holds the quotation being sent
    const [sendQuotationForm, setSendQuotationForm] = useState({ to: '', cc: '', subject: '', body: '' });
    const [sendQuotationSaving, setSendQuotationSaving] = useState(false);
    const [sendQuotationError, setSendQuotationError] = useState('');

    useEffect(() => {
        dispatch(getLeadById(id));
        dispatch(getCampaigns());
    }, [dispatch, id]);

    useEffect(() => {
        if (lead?.id) dispatch(getQuotations({ lead_id: lead.id }));
    }, [dispatch, lead?.id]);

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
        { label: 'Invoice', path: `/invoices?${conversionQuery}`, icon: <ReceiptLongIcon fontSize="small" /> },
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
        setEmailForm({ to: lead.email || '', cc: '', subject: '', body: '' });
        setEmailError('');
        setEmailDialog(true);
    };

    const handleSendEmail = async () => {
        setEmailError('');
        if (!emailForm.to.trim()) {
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
                    to: emailForm.to.trim(),
                    cc: emailForm.cc.trim() || undefined,
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

    // ── Quotations ────────────────────────────────────────
    const handleOpenQuotationCreate = () => {
        setQuotationForm(emptyQuotationForm());
        setQuotationEditId(null);
        setQuotationError('');
        dispatch(getProducts()); // lazy-load the product picker only when the builder actually opens
        setQuotationDialog(true);
    };

    const handleOpenQuotationEdit = (q) => {
        setQuotationForm({
            quotation_date: q.quotation_date || new Date().toISOString().slice(0, 10),
            expiry_date: q.expiry_date || '',
            notes: q.notes || '',
            terms_conditions: q.terms_conditions || '',
            items: (q.items || []).map((item) => ({
                product_id: item.product_id || null,
                item_name: item.item_name || '',
                description: item.description || '',
                hsn_code: item.hsn_code || '',
                qty: item.qty ?? 1,
                unit: item.unit || 'pcs',
                rate: item.rate ?? '',
                tax_rate: item.tax_rate ?? 0,
            })),
        });
        setQuotationEditId(q.id);
        setQuotationError('');
        dispatch(getProducts());
        setQuotationDialog(true);
    };

    const handleQuotationFieldChange = (field, value) => {
        setQuotationForm((p) => ({ ...p, [field]: value }));
    };

    const handleQuotationItemChange = (index, field, value) => {
        setQuotationForm((p) => {
            const items = [...p.items];
            items[index] = { ...items[index], [field]: value };
            return { ...p, items };
        });
    };

    // When a product is picked from the autocomplete, auto-fill the row
    // from that product's catalog data — user can still override anything.
    const handleQuotationItemProductSelect = (index, product) => {
        setQuotationForm((p) => {
            const items = [...p.items];
            items[index] = product
                ? {
                    ...items[index],
                    product_id: product.id,
                    item_name: product.name,
                    hsn_code: product.hsn_code || '',
                    unit: product.unit || 'pcs',
                    rate: product.selling_price ?? items[index].rate,
                    tax_rate: product.tax_rate ?? items[index].tax_rate,
                }
                : { ...items[index], product_id: null };
            return { ...p, items };
        });
    };

    const handleAddQuotationItem = () => {
        setQuotationForm((p) => ({ ...p, items: [...p.items, emptyQuotationItem()] }));
    };

    const handleRemoveQuotationItem = (index) => {
        setQuotationForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) }));
    };

    const handleSubmitQuotation = async () => {
        setQuotationError('');
        if (!quotationForm.quotation_date) {
            setQuotationError('Quotation date zaroori hai');
            return;
        }
        const validItems = quotationForm.items.filter((item) => item.item_name.trim());
        if (validItems.length === 0) {
            setQuotationError('Kam se kam ek item (naam ke saath) zaroori hai');
            return;
        }
        for (const item of validItems) {
            if (!item.qty || Number(item.qty) <= 0 || item.rate === '' || Number(item.rate) < 0) {
                setQuotationError(`"${item.item_name}" ke liye valid qty aur rate daalein`);
                return;
            }
        }

        const payload = {
            quotation_date: quotationForm.quotation_date,
            expiry_date: quotationForm.expiry_date || null,
            notes: quotationForm.notes || null,
            terms_conditions: quotationForm.terms_conditions || null,
            items: validItems.map((item) => ({
                product_id: item.product_id || null,
                item_name: item.item_name.trim(),
                description: item.description || null,
                hsn_code: item.hsn_code || null,
                qty: Number(item.qty),
                unit: item.unit || 'pcs',
                rate: Number(item.rate),
                tax_rate: Number(item.tax_rate) || 0,
            })),
        };

        try {
            if (quotationEditId) {
                await dispatch(updateQuotation({ id: quotationEditId, data: payload })).unwrap();
                setMsg('Quotation update ho gayi!');
            } else {
                await dispatch(createQuotationFromLead({ leadId: lead.id, data: payload })).unwrap();
                dispatch(getLeadById(lead.id)); // status may have auto-advanced to "quotation_sent"
                setMsg('Quotation ban gayi!');
            }
            setTimeout(() => setMsg(''), 3000);
            setQuotationDialog(false);
        } catch (err) {
            setQuotationError(err || 'Quotation save nahi ho payi');
        }
    };

    const handleQuotationStatusChange = (id, status) => {
        dispatch(updateQuotationStatus({ id, status }));
    };

    const handleDeleteQuotation = async () => {
        if (!quotationDeleteId) return;
        await dispatch(deleteQuotation(quotationDeleteId));
        setQuotationDeleteId(null);
    };

    // Small shim so QuotationPrintPDF.handleExportPDF (which takes a
    // (message, severity) callback, matching the existing Invoice PDF
    // feature's showSnackbar prop) can report back through the same
    // success/error banner already used elsewhere on this page.
    const quotationPdfSnackbar = (message, severity) => {
        if (severity === 'error') setSendQuotationError(message);
        else { setMsg(message); setTimeout(() => setMsg(''), 3000); }
    };

    const handleDownloadQuotationPdf = async (quotation) => {
        setPdfLoadingId(quotation.id);
        try {
            const full = await dispatch(getQuotationById(quotation.id)).unwrap();
            const [{ default: QuotationPrintPDF }, { default: html2pdf }] = await Promise.all([
                import('../../../components/QuotationPrintPDF/QuotationPrintPDF'),
                import('html2pdf.js'),
            ]);
            await QuotationPrintPDF.handleExportPDF(full, () => {}, quotationPdfSnackbar, html2pdf);
        } catch (err) {
            quotationPdfSnackbar(err || 'PDF download nahi ho paya', 'error');
        } finally {
            setPdfLoadingId(null);
        }
    };

    const handleOpenSendQuotationEmail = (quotation) => {
        setSendQuotationForm({
            to: quotation.lead?.email || quotation.client?.email || '',
            cc: '',
            subject: `Quotation ${quotation.quotation_no} from ${quotation.company?.company_name || ''}`.trim(),
            body: `Please find attached our quotation ${quotation.quotation_no} as discussed.`,
        });
        setSendQuotationError('');
        setSendQuotationDialog(quotation);
    };

    const handleSendQuotationEmail = async () => {
        if (!sendQuotationDialog) return;
        setSendQuotationError('');
        if (!sendQuotationForm.to.trim()) {
            setSendQuotationError('To address zaroori hai');
            return;
        }
        if (!sendQuotationForm.subject.trim() || !sendQuotationForm.body.trim()) {
            setSendQuotationError('Subject aur message dono zaroori hain');
            return;
        }
        setSendQuotationSaving(true);
        try {
            const full = await dispatch(getQuotationById(sendQuotationDialog.id)).unwrap();
            const [{ default: QuotationPrintPDF }, { default: html2pdf }] = await Promise.all([
                import('../../../components/QuotationPrintPDF/QuotationPrintPDF'),
                import('html2pdf.js'),
            ]);
            const pdfBase64 = await QuotationPrintPDF.getPdfBase64(full, html2pdf);
            await dispatch(sendQuotationEmail({
                id: sendQuotationDialog.id,
                data: {
                    to: sendQuotationForm.to.trim(),
                    cc: sendQuotationForm.cc.trim() || undefined,
                    subject: sendQuotationForm.subject.trim(),
                    body: sendQuotationForm.body,
                    pdf_base64: pdfBase64,
                },
            })).unwrap();
            setSendQuotationDialog(null);
            dispatch(getQuotations({ lead_id: lead.id })); // reflect the auto Draft→Sent status change
            dispatch(getLeadById(lead.id)); // reflect the new activity-log entry
            setMsg('Quotation email bhej di gayi!');
            setTimeout(() => setMsg(''), 3000);
        } catch (err) {
            setSendQuotationError(err || 'Email bhejne mein dikkat hui');
        } finally {
            setSendQuotationSaving(false);
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
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={1.5} mb={2}>
                                <Box sx={{ minWidth: 0 }}>
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
                                    sx={{ borderRadius: '10px', textTransform: 'none', whiteSpace: 'nowrap', flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'flex-start' } }}
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

                            <Grid item xs={12}>
                                <MetricCard>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.5} mb={2}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <ReceiptLongIcon sx={{ color: '#1d4ed8' }} />
                                            <Typography fontWeight={700}>Quotations</Typography>
                                        </Stack>
                                        <Button size="small" variant="outlined" startIcon={<AddIcon />}
                                            onClick={handleOpenQuotationCreate}
                                            sx={{ borderRadius: '10px', textTransform: 'none', whiteSpace: 'nowrap', flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                                            Create Quotation
                                        </Button>
                                    </Stack>

                                    {quotations.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Abhi tak is lead ke liye koi quotation nahi banayi gayi.
                                        </Typography>
                                    ) : (
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 700 }}>Quotation #</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }} align="right">Total</TableCell>
                                                        <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {quotations.map((q) => {
                                                        const qsc = QUOTATION_STATUS_CONFIG[q.status] || QUOTATION_STATUS_CONFIG.draft;
                                                        return (
                                                            <TableRow key={q.id} hover>
                                                                <TableCell>
                                                                    <Typography variant="body2" fontWeight={600}>{q.quotation_no}</Typography>
                                                                </TableCell>
                                                                <TableCell>{q.quotation_date}</TableCell>
                                                                <TableCell>
                                                                    <FormControl size="small" variant="standard">
                                                                        <Select value={q.status} disableUnderline
                                                                            onChange={(e) => handleQuotationStatusChange(q.id, e.target.value)}
                                                                            renderValue={() => (
                                                                                <Chip label={qsc.label} size="small"
                                                                                    sx={{ bgcolor: qsc.bg, color: qsc.color, fontWeight: 700, fontSize: 11 }} />
                                                                            )}>
                                                                            {Object.entries(QUOTATION_STATUS_CONFIG).map(([key, val]) => (
                                                                                <MenuItem key={key} value={key}>{val.label}</MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Typography variant="body2" fontWeight={700}>
                                                                        ₹{Number(q.total_amount).toLocaleString()}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Tooltip title="Download PDF">
                                                                        <IconButton size="small" onClick={() => handleDownloadQuotationPdf(q)}
                                                                            disabled={pdfLoadingId === q.id} sx={{ color: '#0284c7' }}>
                                                                            {pdfLoadingId === q.id ? <CircularProgress size={16} /> : <DownloadIcon sx={{ fontSize: 18 }} />}
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Send Email">
                                                                        <IconButton size="small" onClick={() => handleOpenSendQuotationEmail(q)} sx={{ color: '#16a34a' }}>
                                                                            <SendIcon sx={{ fontSize: 18 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Edit">
                                                                        <IconButton size="small" onClick={() => handleOpenQuotationEdit(q)} sx={{ color: '#f59e0b' }}>
                                                                            <EditIcon sx={{ fontSize: 18 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Delete">
                                                                        <IconButton size="small" onClick={() => setQuotationDeleteId(q.id)} sx={{ color: '#ef4444' }}>
                                                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
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

            {/* Send Email Dialog */}
            <Dialog open={emailDialog} onClose={() => setEmailDialog(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Send Email</DialogTitle>
                <DialogContent>
                    {emailError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{emailError}</Alert>}
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField fullWidth size="small" label="To *" type="email"
                            value={emailForm.to} onChange={(e) => setEmailForm((p) => ({ ...p, to: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <TextField fullWidth size="small" label="CC (optional)" type="email"
                            value={emailForm.cc} onChange={(e) => setEmailForm((p) => ({ ...p, cc: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <TextField fullWidth size="small" label="Subject *"
                            value={emailForm.subject} onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <TextField fullWidth size="small" label="Message *" multiline rows={6}
                            value={emailForm.body} onChange={(e) => setEmailForm((p) => ({ ...p, body: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <Typography variant="caption" color="text.secondary">
                            Reply seedha aapke apne email pe aayegi (Reply-To set hota hai automatically).
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setEmailDialog(false)} disabled={emailSending} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <GradientButton onClick={handleSendEmail} disabled={emailSending}
                        startIcon={emailSending ? <CircularProgress size={16} color="inherit" /> : <EmailIcon />}>
                        {emailSending ? 'Sending...' : 'Send'}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Quotation Builder Dialog */}
            <Dialog open={quotationDialog} onClose={() => setQuotationDialog(false)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    <Typography fontWeight={700}>{quotationEditId ? 'Edit Quotation' : 'Create Quotation'}</Typography>
                    <IconButton size="small" onClick={() => setQuotationDialog(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 4 }}>
                    {quotationError && <Alert severity="error" sx={{ mb: 2 }}>{quotationError}</Alert>}
                    <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Quotation Date *" type="date"
                                value={quotationForm.quotation_date}
                                onChange={(e) => handleQuotationFieldChange('quotation_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Expiry Date" type="date"
                                value={quotationForm.expiry_date}
                                onChange={(e) => handleQuotationFieldChange('expiry_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Items</Typography>
                    <Stack spacing={1.5} sx={{ mb: 1 }}>
                        {quotationForm.items.map((item, index) => {
                            const amount = calcItemAmount(item);
                            const selectedProduct = products.find((p) => p.id === item.product_id) || null;
                            return (
                                <Box key={index} sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: '10px' }}>
                                    <Grid container spacing={1.5} alignItems="center">
                                        <Grid item xs={12} sm={4}>
                                            <Autocomplete
                                                size="small"
                                                options={products}
                                                value={selectedProduct}
                                                getOptionLabel={(p) => p.name || ''}
                                                isOptionEqualToValue={(a, b) => a.id === b.id}
                                                onChange={(_, val) => handleQuotationItemProductSelect(index, val)}
                                                renderInput={(params) => <TextField {...params} label="Product (optional)" />}
                                            />
                                            <TextField fullWidth size="small" label="Item Name *" sx={{ mt: 1 }}
                                                value={item.item_name}
                                                onChange={(e) => handleQuotationItemChange(index, 'item_name', e.target.value)} />
                                        </Grid>
                                        <Grid item xs={4} sm={1.5}>
                                            <TextField fullWidth size="small" label="Qty" type="number"
                                                value={item.qty}
                                                onChange={(e) => handleQuotationItemChange(index, 'qty', e.target.value)} />
                                        </Grid>
                                        <Grid item xs={4} sm={1.5}>
                                            <TextField fullWidth size="small" label="Unit"
                                                value={item.unit}
                                                onChange={(e) => handleQuotationItemChange(index, 'unit', e.target.value)} />
                                        </Grid>
                                        <Grid item xs={4} sm={2}>
                                            <TextField fullWidth size="small" label="Rate" type="number"
                                                value={item.rate}
                                                onChange={(e) => handleQuotationItemChange(index, 'rate', e.target.value)} />
                                        </Grid>
                                        <Grid item xs={6} sm={1.5}>
                                            <TextField fullWidth size="small" label="Tax %" type="number"
                                                value={item.tax_rate}
                                                onChange={(e) => handleQuotationItemChange(index, 'tax_rate', e.target.value)} />
                                        </Grid>
                                        <Grid item xs={5} sm={1}>
                                            <Typography variant="body2" fontWeight={700} noWrap>
                                                ₹{amount.toLocaleString()}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={1} sm={0.5}>
                                            <IconButton size="small" onClick={() => handleRemoveQuotationItem(index)}
                                                disabled={quotationForm.items.length === 1} sx={{ color: '#ef4444' }}>
                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </Box>
                            );
                        })}
                    </Stack>
                    <Button size="small" startIcon={<AddIcon />} onClick={handleAddQuotationItem}
                        sx={{ textTransform: 'none', mb: 2 }}>
                        Add Item
                    </Button>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Notes" multiline rows={2}
                                value={quotationForm.notes}
                                onChange={(e) => handleQuotationFieldChange('notes', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Terms & Conditions" multiline rows={2}
                                value={quotationForm.terms_conditions}
                                onChange={(e) => handleQuotationFieldChange('terms_conditions', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        </Grid>
                    </Grid>

                    <Divider sx={{ mb: 2 }} />
                    {(() => {
                        const { subTotal, taxTotal, grandTotal } = calcQuotationTotals(quotationForm.items);
                        return (
                            <Stack alignItems="flex-end" spacing={0.5}>
                                <Typography variant="body2" color="text.secondary">Sub Total: ₹{subTotal.toLocaleString()}</Typography>
                                <Typography variant="body2" color="text.secondary">Tax: ₹{taxTotal.toLocaleString()}</Typography>
                                <Typography variant="h6" fontWeight={800}>Total: ₹{grandTotal.toLocaleString()}</Typography>
                            </Stack>
                        );
                    })()}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setQuotationDialog(false)} disabled={quotationSaving} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <GradientButton onClick={handleSubmitQuotation} disabled={quotationSaving}
                        startIcon={quotationSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}>
                        {quotationSaving ? 'Saving...' : quotationEditId ? 'Update Quotation' : 'Create Quotation'}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Delete Quotation Confirm Dialog */}
            <Dialog open={!!quotationDeleteId} onClose={() => setQuotationDeleteId(null)}
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Delete Quotation?</DialogTitle>
                <DialogContent>
                    <Alert severity="warning">Yeh quotation permanently delete ho jaayegi.</Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setQuotationDeleteId(null)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <Button onClick={handleDeleteQuotation} variant="contained" color="error" sx={{ borderRadius: '10px' }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Send Quotation Email Dialog */}
            <Dialog open={!!sendQuotationDialog} onClose={() => setSendQuotationDialog(null)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>
                    Send Quotation {sendQuotationDialog?.quotation_no}
                </DialogTitle>
                <DialogContent>
                    {sendQuotationError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{sendQuotationError}</Alert>}
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField fullWidth size="small" label="To *" type="email"
                            value={sendQuotationForm.to} onChange={(e) => setSendQuotationForm((p) => ({ ...p, to: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <TextField fullWidth size="small" label="CC (optional)" type="email"
                            value={sendQuotationForm.cc} onChange={(e) => setSendQuotationForm((p) => ({ ...p, cc: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <TextField fullWidth size="small" label="Subject *"
                            value={sendQuotationForm.subject} onChange={(e) => setSendQuotationForm((p) => ({ ...p, subject: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <TextField fullWidth size="small" label="Message *" multiline rows={5}
                            value={sendQuotationForm.body} onChange={(e) => setSendQuotationForm((p) => ({ ...p, body: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <Typography variant="caption" color="text.secondary">
                            Quotation PDF automatically attach ho jaayegi. Reply seedha aapke email pe aayegi.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setSendQuotationDialog(null)} disabled={sendQuotationSaving} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <GradientButton onClick={handleSendQuotationEmail} disabled={sendQuotationSaving}
                        startIcon={sendQuotationSaving ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}>
                        {sendQuotationSaving ? 'Sending...' : 'Send'}
                    </GradientButton>
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