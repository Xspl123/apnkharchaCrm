import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Alert, Box, Card, CardContent, Typography, Button, Chip, Stack, Avatar,
    Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    Grid, LinearProgress, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Divider, CircularProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    Assessment as PipelineIcon,
    Business as BusinessIcon,
    Campaign as CampaignIcon,
    ContentCopy as CopyIcon,
    EventAvailable as EventIcon,
    Groups as GroupsIcon,
    LocalFireDepartment as HotIcon,
    TrendingUp as TrendingUpIcon,
    Rule as RuleIcon,
    Save as SaveIcon,
    WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
    Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer,
    Tooltip as ChartTooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
    getLeads, getLeadSummary,
    getScoreRules, saveScoreRules, getUpcomingFollowUps,
} from '../state/leadSlice';
import { getOrganisation } from '../../organisation/state/orgSlice';

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

const DEFAULT_SCORE_RULES = {
    stageWeights: {
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
    },
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

const STAGE_WEIGHT = {
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

const terminalStatuses = new Set(['closed_won', 'closed_lost']);

const mergeScoreRules = (rules) => ({
    ...DEFAULT_SCORE_RULES,
    ...(rules || {}),
    stageWeights: { ...DEFAULT_SCORE_RULES.stageWeights, ...(rules?.stageWeights || {}) },
});

const GlassCard = styled(Card)(() => ({
    background: 'rgba(255,255,255,0.94)',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
}));

const formatMoney = (amount, currency = 'INR') => {
    const value = Number(amount || 0);
    if (!value) return `${currency} 0`;
    return `${currency} ${value.toLocaleString('en-IN')}`;
};

const getDaysBetween = (dateValue, baseDate = new Date()) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    return Math.ceil((date.setHours(0, 0, 0, 0) - new Date(baseDate).setHours(0, 0, 0, 0)) / 86400000);
};

const getUserLabel = (user) => {
    if (!user) return '';
    return user.name || user.full_name || user.username || user.email || '';
};

const getOwnerLabel = (lead) =>
    lead?.owner?.name ||
    lead?.owner?.full_name ||
    lead?.assigned_to?.name ||
    lead?.assigned_user?.name ||
    lead?.owner_name ||
    lead?.assigned_to_name ||
    'Unassigned';

const getOpenFollowUps = (lead) => (lead.follow_ups || []).filter((item) => !item.is_done);

const getFollowUpCounts = (lead) => {
    const open = getOpenFollowUps(lead);
    const dueToday = open.filter((item) => getDaysBetween(item.due_date) === 0).length;
    const overdue = open.filter((item) => {
        if (item.is_overdue) return true;
        const days = getDaysBetween(item.due_date);
        return days !== null && days < 0;
    }).length;

    return { open: open.length, dueToday, overdue };
};

// Mirrors LeadList.jsx's `insights.overdueLeads` exactly: a lead counts as
// overdue if it has any overdue open follow-up OR its expected_close_date
// has passed while it's still in a non-terminal status. This is a distinct
// per-lead count (0 or 1 per lead), not a count of overdue follow-up items —
// keeping the two pages in sync so "Overdue" means the same thing everywhere.
const isLeadOverdue = (lead, followUpCounts) => {
    if (followUpCounts.overdue > 0) return true;
    const closeDays = getDaysBetween(lead.expected_close_date);
    return closeDays !== null && closeDays < 0 && !terminalStatuses.has(lead.status);
};

// Mirrors LeadList.jsx's getLeadSignals scoring model (same stage weights,
// same bonus/penalty rules) so a lead's Hot/Warm/Normal priority reads the
// same on both pages.
const getLeadScore = (lead, rules) => {
    const openFollowUps = getOpenFollowUps(lead);
    const overdueFollowUps = openFollowUps.filter((item) => {
        if (item.is_overdue) return true;
        const days = getDaysBetween(item.due_date);
        return days !== null && days < 0;
    });
    const createdDaysAgo = lead.created_at ? Math.abs(getDaysBetween(lead.created_at)) : 0;
    const value = Number(lead.budget || 0);
    const closeDays = getDaysBetween(lead.expected_close_date);
    const isClosingSoon = closeDays !== null && closeDays >= 0 && closeDays <= 7;
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

    const priority = overdueFollowUps.length || score >= Number(rules.hotScore || 80)
        ? { key: 'hot', label: 'Hot', color: '#dc2626', bg: '#fee2e2' }
        : isStale || score >= Number(rules.warmScore || 55)
            ? { key: 'warm', label: 'Warm', color: '#d97706', bg: '#fef3c7' }
            : { key: 'normal', label: 'Normal', color: '#2563eb', bg: '#dbeafe' };

    return { score, priority };
};

export default function LeadDashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { leads, summary, isLoading, scoreRules: remoteScoreRules, upcomingFollowUps: remoteUpcomingFollowUps } = useSelector((s) => s.leads);
    const organisation = useSelector((s) => s.orgs?.organisation);
    const [pageMsg, setPageMsg] = useState('');
    const scoreRules = useMemo(() => mergeScoreRules(remoteScoreRules), [remoteScoreRules]);
    const [scoreDialog, setScoreDialog] = useState(false);
    const [scoreForm, setScoreForm] = useState(scoreRules);
    const [scoreSaving, setScoreSaving] = useState(false);

    useEffect(() => {
        dispatch(getLeads());
        dispatch(getLeadSummary());
        dispatch(getOrganisation());
        dispatch(getScoreRules());
        dispatch(getUpcomingFollowUps(7));
    }, [dispatch]);

    const metrics = useMemo(() => {
        const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
        const sourceMap = new Map();
        const ownerMap = new Map();
        let pipelineValue = 0;
        let weightedPipeline = 0;
        let wonValue = 0;
        let dueToday = 0;
        let overdueFollowUps = 0;
        let overdueLeads = 0;
        let closeThisWeek = 0;
        let unassigned = 0;

        leads.forEach((lead) => {
            const status = lead.status || 'new';
            const value = Number(lead.budget || 0);
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            if (!terminalStatuses.has(status)) {
                pipelineValue += value;
                weightedPipeline += value * ((STAGE_WEIGHT[status] ?? 10) / 100);
            }
            if (status === 'closed_won') wonValue += value;

            const followUps = getFollowUpCounts(lead);
            dueToday += followUps.dueToday;
            overdueFollowUps += followUps.overdue;
            if (isLeadOverdue(lead, followUps)) overdueLeads += 1;

            const closeDays = getDaysBetween(lead.expected_close_date);
            if (closeDays !== null && closeDays >= 0 && closeDays <= 7 && !terminalStatuses.has(status)) {
                closeThisWeek += 1;
            }

            const source = lead.source || 'other';
            const sourceRow = sourceMap.get(source) || { name: source, leads: 0, won: 0, value: 0 };
            sourceRow.leads += 1;
            sourceRow.value += value;
            if (status === 'closed_won') sourceRow.won += 1;
            sourceMap.set(source, sourceRow);

            const owner = getOwnerLabel(lead);
            if (owner === 'Unassigned') unassigned += 1;
            const ownerRow = ownerMap.get(owner) || { name: owner, total: 0, open: 0, won: 0, overdue: 0 };
            ownerRow.total += 1;
            if (!terminalStatuses.has(status)) ownerRow.open += 1;
            if (status === 'closed_won') ownerRow.won += 1;
            ownerRow.overdue += followUps.overdue;
            ownerMap.set(owner, ownerRow);
        });

        const total = summary?.total ?? leads.length;
        const won = summary?.closed_won ?? statusCounts.closed_won ?? 0;
        const lost = summary?.closed_lost ?? statusCounts.closed_lost ?? 0;
        const open = Math.max(total - won - lost, 0);
        const conversionRate = total ? Math.round((won / total) * 100) : 0;

        const statusChart = Object.entries(STATUS_CONFIG)
            .map(([key, config]) => ({ key, name: config.label, value: statusCounts[key] || 0, color: config.color }))
            .filter((item) => item.value > 0);

        const sourceRows = [...sourceMap.values()]
            .sort((a, b) => b.leads - a.leads)
            .slice(0, 6);

        const ownerRows = [...ownerMap.values()]
            .sort((a, b) => b.open - a.open || b.total - a.total)
            .slice(0, 6);

        const recentLeads = [...leads]
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 5);

        return {
            total, open, won, lost, statusCounts,
            pipelineValue, weightedPipeline, wonValue,
            dueToday: summary?.due_today_followups ?? dueToday,
            // Client-computed to exactly match LeadList's "Overdue" chip
            // (leads.filter overdueFollowUps || isCloseOverdue), rather than
            // the backend's overdue-follow-up-item count, which counts a
            // different thing and was showing a different number here.
            overdueFollowUps: overdueLeads,
            closeThisWeek, unassigned, conversionRate,
            statusChart, sourceRows, ownerRows, recentLeads,
        };
    }, [leads, summary]);

    // Last 30 days, day-wise count of leads created — purely client-side,
    // computed from the same `leads` list already loaded for everything
    // else on this page. No new API call needed.
    const trendData = useMemo(() => {
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = 29; i >= 0; i -= 1) {
            const day = new Date(today);
            day.setDate(day.getDate() - i);
            days.push({
                date: day,
                label: day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                count: 0,
            });
        }
        const dayIndex = new Map(days.map((d, idx) => [d.date.toDateString(), idx]));
        leads.forEach((lead) => {
            if (!lead.created_at) return;
            const created = new Date(lead.created_at);
            created.setHours(0, 0, 0, 0);
            const idx = dayIndex.get(created.toDateString());
            if (idx !== undefined) days[idx].count += 1;
        });
        return days;
    }, [leads]);

    // Top leads by score (Hot first) — same scoring model as LeadList, so
    // the same lead shows the same score/priority on both pages.
    const hotLeads = useMemo(() => {
        return leads
            .filter((lead) => !terminalStatuses.has(lead.status))
            .map((lead) => ({ lead, ...getLeadScore(lead, scoreRules) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);
    }, [leads, scoreRules]);

    // Why leads were lost, grouped by the lost_reason text entered when the
    // lead was marked closed_lost.
    const lostReasons = useMemo(() => {
        const grouped = new Map();
        leads.forEach((lead) => {
            if (lead.status !== 'closed_lost') return;
            const reason = (lead.lost_reason || '').trim() || 'No reason specified';
            grouped.set(reason, (grouped.get(reason) || 0) + 1);
        });
        const rows = [...grouped.entries()]
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count);
        const total = rows.reduce((sum, row) => sum + row.count, 0);
        return { rows, total };
    }, [leads]);

    // Fetched from GET /leads/upcoming-followups?days=7 — scales better than
    // scanning every loaded lead's follow_ups client-side once lead counts
    // grow large. Shape it to match what the list below expects.
    const upcomingFollowUps = useMemo(() => {
        return (remoteUpcomingFollowUps || [])
            .map((item) => ({
                lead: { id: item.lead_id, company_name: item.company_name },
                followUp: { id: item.follow_up_id, note: item.note, due_date: item.due_date },
                days: getDaysBetween(item.due_date) ?? 0,
            }))
            .slice(0, 8);
    }, [remoteUpcomingFollowUps]);

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

    const handleCopyFormLink = async () => {
        if (!organisation?.slug) {
            setPageMsg('Organisation abhi load nahi hui, thodi der baad try karein');
            return;
        }
        const formUrl = `${window.location.origin}/lead-form/${organisation.slug}`;
        try {
            await navigator.clipboard.writeText(formUrl);
            setPageMsg(`Form link copy ho gaya: ${formUrl}`);
        } catch {
            setPageMsg(`Copy nahi ho paya. Manually copy karein: ${formUrl}`);
        }
    };

    const kpis = [
        { label: 'Total Leads', value: metrics.total, color: '#4f46e5', icon: <BusinessIcon /> },
        { label: 'Open Leads', value: metrics.open, color: '#0891b2', icon: <GroupsIcon /> },
        { label: 'Won Leads', value: metrics.won, color: '#16a34a', icon: <TrendingUpIcon /> },
        { label: 'Lost Leads', value: metrics.lost, color: '#dc2626', icon: <WarningIcon /> },
        { label: 'Due Today', value: metrics.dueToday, color: '#b45309', icon: <EventIcon /> },
        { label: 'Overdue', value: metrics.overdueFollowUps, color: '#b91c1c', icon: <WarningIcon /> },
    ];

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: '#f8fafc', minHeight: '100%' }}>
            <GlassCard sx={{ mb: 3, background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', color: '#fff' }}>
                <CardContent>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
                        <Box>
                            <Typography variant="h5" fontWeight={800}>CRM Dashboard</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Lead performance, follow-ups, ownership, and source overview
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Button variant="outlined" startIcon={<BusinessIcon />} onClick={() => navigate('/crm/leads')}
                                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.45)', borderRadius: '10px', textTransform: 'none' }}>
                                Leads List
                            </Button>
                            <Button variant="outlined" startIcon={<RuleIcon />} onClick={() => { setScoreForm(scoreRules); setScoreDialog(true); }}
                                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.45)', borderRadius: '10px', textTransform: 'none' }}>
                                Score Rules
                            </Button>
                            <Button variant="outlined" startIcon={<CopyIcon />} onClick={handleCopyFormLink}
                                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.45)', borderRadius: '10px', textTransform: 'none' }}>
                                Copy Form Link
                            </Button>
                            <Button variant="outlined" startIcon={<PipelineIcon />} onClick={() => navigate('/crm/pipeline')}
                                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.45)', borderRadius: '10px', textTransform: 'none' }}>
                                Pipeline
                            </Button>
                            <Button variant="outlined" startIcon={<CampaignIcon />} onClick={() => navigate('/crm/campaigns')}
                                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.45)', borderRadius: '10px', textTransform: 'none' }}>
                                Campaigns
                            </Button>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/crm/leads')}
                                sx={{ bgcolor: '#fff', color: '#1e3a8a', borderRadius: '10px', textTransform: 'none', fontWeight: 800, '&:hover': { bgcolor: '#f8fafc' } }}>
                                Add Lead
                            </Button>
                        </Stack>
                    </Stack>
                    {isLoading && <LinearProgress sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.18)', '& .MuiLinearProgress-bar': { bgcolor: '#fff' } }} />}
                </CardContent>
            </GlassCard>

            {pageMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPageMsg('')}>{pageMsg}</Alert>}

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {kpis.map((item) => (
                    <Grid item xs={6} sm={4} md={4} lg={2} key={item.label}>
                        <GlassCard sx={{ height: '100%' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Stack direction="row" spacing={1.25} alignItems="center">
                                    <Avatar sx={{ width: 40, height: 40, bgcolor: `${item.color}14`, color: item.color }}>
                                        {item.icon}
                                    </Avatar>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="h5" fontWeight={900} sx={{ color: item.color }} noWrap>
                                            {item.value}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap>{item.label}</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </GlassCard>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Pipeline Value', value: formatMoney(metrics.pipelineValue), hint: 'Open lead budget', color: '#0f766e' },
                    { label: 'Weighted Pipeline', value: formatMoney(metrics.weightedPipeline), hint: 'Stage adjusted value', color: '#4338ca' },
                    { label: 'Won Value', value: formatMoney(metrics.wonValue), hint: `${metrics.conversionRate}% conversion`, color: '#15803d' },
                    { label: 'Close This Week', value: metrics.closeThisWeek, hint: `${metrics.unassigned} unassigned`, color: '#0284c7' },
                ].map((item) => (
                    <Grid item xs={12} sm={6} md={3} key={item.label}>
                        <GlassCard sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                                <Typography variant="h5" fontWeight={900} sx={{ color: item.color, mt: 0.5 }}>
                                    {item.value}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">{item.hint}</Typography>
                            </CardContent>
                        </GlassCard>
                    </Grid>
                ))}
            </Grid>

            {/* Lead Trend — last 30 days */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                    <GlassCard>
                        <CardContent>
                            <Typography variant="h6" fontWeight={800}>Lead Trend</Typography>
                            <Typography variant="caption" color="text.secondary">New leads captured per day, last 30 days</Typography>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={trendData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={4} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                                    <ChartTooltip />
                                    <Line type="monotone" dataKey="count" name="Leads" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Hot / Priority Leads */}
                <Grid item xs={12} lg={6}>
                    <GlassCard sx={{ height: '100%' }}>
                        <CardContent>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <HotIcon sx={{ color: '#dc2626' }} />
                                <Typography variant="h6" fontWeight={800}>Hot / Priority Leads</Typography>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">Top open leads by score, needs attention first</Typography>
                            <Divider sx={{ my: 1.5 }} />
                            <Stack spacing={1.25}>
                                {hotLeads.length === 0 ? (
                                    <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No open leads</Typography>
                                ) : hotLeads.map(({ lead, score, priority }) => (
                                    <Stack key={lead.id} direction="row" spacing={1.25} alignItems="center"
                                        onClick={() => navigate(`/crm/leads/${lead.id}`)}
                                        sx={{ p: 1, borderRadius: '10px', cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}>
                                        <Avatar sx={{ bgcolor: priority.bg, color: priority.color, width: 34, height: 34, fontSize: 13, fontWeight: 800 }}>
                                            {lead.company_name?.charAt(0)}
                                        </Avatar>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="body2" fontWeight={800} noWrap>{lead.company_name || 'Lead'}</Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap>{getOwnerLabel(lead)}</Typography>
                                        </Box>
                                        <Chip label={`${score}% ${priority.label}`} size="small"
                                            sx={{ bgcolor: priority.bg, color: priority.color, fontWeight: 800 }} />
                                    </Stack>
                                ))}
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>

                {/* Lost Reasons */}
                <Grid item xs={12} lg={6}>
                    <GlassCard sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={800}>Lost Reasons</Typography>
                            <Typography variant="caption" color="text.secondary">Why closed-lost leads were lost</Typography>
                            <Divider sx={{ my: 1.5 }} />
                            <Stack spacing={1.5}>
                                {lostReasons.rows.length === 0 ? (
                                    <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No lost leads yet</Typography>
                                ) : lostReasons.rows.map((row) => {
                                    const pct = lostReasons.total > 0 ? Math.round((row.count / lostReasons.total) * 100) : 0;
                                    return (
                                        <Box key={row.reason}>
                                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                                <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: '70%' }}>{row.reason}</Typography>
                                                <Typography variant="body2" color="text.secondary">{row.count} ({pct}%)</Typography>
                                            </Stack>
                                            <Box sx={{ height: 8, borderRadius: 999, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                                                <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: '#dc2626', borderRadius: 999 }} />
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} lg={5}>
                    <GlassCard sx={{ height: { xs: 'auto', lg: 380 } }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                                <Box>
                                    <Typography variant="h6" fontWeight={800}>Status Split</Typography>
                                    <Typography variant="caption" color="text.secondary">Lead count by pipeline stage</Typography>
                                </Box>
                                <Chip label={`${metrics.conversionRate}% won`} sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800 }} />
                            </Stack>
                            {metrics.statusChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie data={metrics.statusChart} dataKey="value" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={2}>
                                            {metrics.statusChart.map((entry) => <Cell key={entry.key} fill={entry.color} />)}
                                        </Pie>
                                        <ChartTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Stack alignItems="center" justifyContent="center" sx={{ height: 260, color: 'text.secondary' }}>
                                    <BusinessIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
                                    <Typography>No lead data yet</Typography>
                                </Stack>
                            )}
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} lg={7}>
                    <GlassCard sx={{ height: { xs: 'auto', lg: 380 } }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={800}>Source Performance</Typography>
                            <Typography variant="caption" color="text.secondary">Top sources by lead count and value</Typography>
                        </CardContent>
                        <TableContainer sx={{ maxHeight: 295, overflowX: 'auto' }}>
                            <Table stickyHeader size="small" sx={{ minWidth: 420 }}>
                                <TableHead>
                                    <TableRow>
                                        {['Source', 'Leads', 'Won', 'Value'].map((head) => (
                                            <TableCell key={head} sx={{ fontWeight: 800, bgcolor: '#fff', whiteSpace: 'nowrap' }}>{head}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {metrics.sourceRows.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5, color: 'text.secondary' }}>No sources found</TableCell></TableRow>
                                    ) : metrics.sourceRows.map((row) => (
                                        <TableRow key={row.name}>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                <Chip label={row.name.replace('_', ' ').toUpperCase()} size="small"
                                                    sx={{ bgcolor: '#f1f5f9', color: '#334155', fontWeight: 800 }} />
                                            </TableCell>
                                            <TableCell>{row.leads}</TableCell>
                                            <TableCell>{row.won}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatMoney(row.value)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} lg={7}>
                    <GlassCard>
                        <CardContent>
                            <Typography variant="h6" fontWeight={800}>Owner Workload</Typography>
                            <Typography variant="caption" color="text.secondary">Open leads and overdue work by owner</Typography>
                        </CardContent>
                        <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 480 }}>
                                <TableHead>
                                    <TableRow>
                                        {['Owner', 'Total', 'Open', 'Won', 'Overdue'].map((head) => (
                                            <TableCell key={head} sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{head}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {metrics.ownerRows.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No owner data found</TableCell></TableRow>
                                    ) : metrics.ownerRows.map((row) => (
                                        <TableRow key={row.name}>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: row.name === 'Unassigned' ? '#fff7ed' : '#e0e7ff', color: row.name === 'Unassigned' ? '#b45309' : '#4338ca' }}>
                                                        {row.name.charAt(0)}
                                                    </Avatar>
                                                    <Typography variant="body2" fontWeight={700}>{row.name}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>{row.total}</TableCell>
                                            <TableCell>{row.open}</TableCell>
                                            <TableCell>{row.won}</TableCell>
                                            <TableCell>
                                                <Chip label={row.overdue} size="small"
                                                    sx={{ bgcolor: row.overdue ? '#fee2e2' : '#f1f5f9', color: row.overdue ? '#b91c1c' : '#64748b', fontWeight: 800 }} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} lg={5}>
                    <GlassCard>
                        <CardContent>
                            <Typography variant="h6" fontWeight={800}>Recent Leads</Typography>
                            <Typography variant="caption" color="text.secondary">Latest entries in the lead list</Typography>
                            <Divider sx={{ my: 1.5 }} />
                            <Stack spacing={1.25}>
                                {metrics.recentLeads.length === 0 ? (
                                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No recent leads</Typography>
                                ) : metrics.recentLeads.map((lead) => {
                                    const status = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                                    return (
                                        <Stack key={lead.id} direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap
                                            onClick={() => navigate(`/crm/leads/${lead.id}`)}
                                            sx={{ p: 1, borderRadius: '10px', cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <Avatar sx={{ bgcolor: status.color, width: 34, height: 34, fontSize: 13 }}>
                                                {lead.company_name?.charAt(0)}
                                            </Avatar>
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography variant="body2" fontWeight={800} noWrap>{lead.company_name || 'Lead'}</Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap>{lead.contact_person || lead.phone || lead.email || 'No contact added'}</Typography>
                                            </Box>
                                            <Chip label={status.label} size="small" sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700 }} />
                                        </Stack>
                                    );
                                })}
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>

                {/* Upcoming Follow-ups — this week */}
                <Grid item xs={12} lg={7}>
                    <GlassCard>
                        <CardContent>
                            <Typography variant="h6" fontWeight={800}>Upcoming Follow-ups</Typography>
                            <Typography variant="caption" color="text.secondary">Pending follow-ups due in the next 7 days</Typography>
                            <Divider sx={{ my: 1.5 }} />
                            <Stack spacing={1.25}>
                                {upcomingFollowUps.length === 0 ? (
                                    <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>Koi upcoming follow-up nahi hai</Typography>
                                ) : upcomingFollowUps.map(({ lead, followUp, days }) => (
                                    <Stack key={followUp.id} direction="row" spacing={1.25} alignItems="center"
                                        onClick={() => navigate(`/crm/leads/${lead.id}`)}
                                        sx={{ p: 1, borderRadius: '10px', cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}>
                                        <Chip label={days === 0 ? 'Today' : `+${days}d`} size="small"
                                            sx={{ bgcolor: days === 0 ? '#fffbeb' : '#eef2ff', color: days === 0 ? '#b45309' : '#4338ca', fontWeight: 800, minWidth: 56 }} />
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="body2" fontWeight={800} noWrap>{lead.company_name || 'Lead'}</Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap>{followUp.note || 'Follow-up scheduled'}</Typography>
                                        </Box>
                                    </Stack>
                                ))}
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            <Dialog open={scoreDialog} onClose={() => setScoreDialog(false)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Lead Score & Priority Rules</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                            <Grid item xs={12} sm={6} md={4} key={status}>
                                <TextField fullWidth size="small" type="number" label={`${config.label} weight`}
                                    value={scoreForm.stageWeights?.[status] ?? 0}
                                    onChange={(event) => handleStageWeight(status, event.target.value)}
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
                                    value={scoreForm[key]} onChange={(event) => handleScoreField(key, event.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleResetScoreRules} disabled={scoreSaving} sx={{ borderRadius: '10px' }}>Reset</Button>
                    <Button onClick={() => setScoreDialog(false)} disabled={scoreSaving} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveScoreRules} disabled={scoreSaving}
                        startIcon={scoreSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} sx={{ borderRadius: '10px' }}>
                        {scoreSaving ? 'Saving...' : 'Save Rules'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}