import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getCampaigns, createCampaign, updateCampaign, deleteCampaign,
    attachLeadsToCampaign, detachLeadFromCampaign, getCampaignById,
} from '../state/campaignSlice';
import { getLeads } from '../state/leadSlice';
import axiosClient from '../../../api/axiosClient';
import {
    Box, Card, CardContent, Typography, Button, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, IconButton, Chip, Stack, Tooltip, Select,
    MenuItem, FormControl, InputLabel, CircularProgress, Alert, Checkbox, ListItemText, Divider,
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Campaign as CampaignIcon, Close as CloseIcon, Save as SaveIcon,
    People as PeopleIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

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

const TYPE_CONFIG = {
    domestic:      { color: '#0891b2', bg: '#ecfeff', label: 'Domestic' },
    international: { color: '#7c3aed', bg: '#f5f3ff', label: 'International' },
    product:       { color: '#d97706', bg: '#fffbeb', label: 'Product' },
    region:        { color: '#16a34a', bg: '#f0fdf4', label: 'Region' },
};

const STATUS_CONFIG = {
    draft:     { color: '#6b7280', bg: '#f3f4f6', label: 'Draft' },
    active:    { color: '#16a34a', bg: '#dcfce7', label: 'Active' },
    paused:    { color: '#f59e0b', bg: '#fffbeb', label: 'Paused' },
    completed: { color: '#6366f1', bg: '#eef2ff', label: 'Completed' },
};

const emptyForm = {
    name: '', type: 'domestic', status: 'draft',
    description: '', start_date: '', end_date: '',
};

const getCampaignLeadItems = (campaign) => {
    const candidates = [
        campaign?.leads,
        campaign?.lead_list,
        campaign?.lead_items,
        campaign?.data?.leads,
        campaign?.data?.lead_list,
    ];
    return candidates.find(Array.isArray) || [];
};

// Mirrors LeadList.jsx's stage weighting so pipeline value is calculated
// the same way in both places.
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

const getLeadValue = (lead) => Number(lead.budget || 0);

const formatMoney = (amount) => {
    if (!amount) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
};

// Computes conversion/ROI metrics for one campaign from its attached leads.
// Pass in the full lead objects (from getCampaignById), not just IDs, since
// we need each lead's status and budget.
const getCampaignPerformance = (campaignLeads) => {
    const total = campaignLeads.length;
    if (total === 0) {
        return { total: 0, won: 0, lost: 0, open: 0, conversionRate: 0, revenue: 0, pipeline: 0 };
    }
    let won = 0, lost = 0, revenue = 0, pipeline = 0;
    campaignLeads.forEach((lead) => {
        const value = getLeadValue(lead);
        const weight = SALES_STAGE_WEIGHT[lead.status] ?? 10;
        pipeline += value * (weight / 100);
        if (lead.status === 'closed_won') {
            won += 1;
            revenue += value;
        } else if (lead.status === 'closed_lost') {
            lost += 1;
        }
    });
    return {
        total, won, lost, open: total - won - lost,
        conversionRate: total > 0 ? (won / total) * 100 : 0,
        revenue, pipeline,
    };
};

export default function CampaignList() {
    const dispatch = useDispatch();
    const { campaigns, selectedCampaign: campaignDetail, isLoading, actionLoading } = useSelector((s) => s.campaigns);
    const { leads } = useSelector((s) => s.leads);

    const [dialog,       setDialog]       = useState(false);
    const [editMode,     setEditMode]     = useState(false);
    const [editId,       setEditId]       = useState(null);
    const [formData,     setFormData]     = useState(emptyForm);
    const [deleteDialog, setDeleteDialog] = useState(null);
    const [formError,    setFormError]    = useState('');
    const [attachDialog, setAttachDialog] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedLeadIds, setSelectedLeadIds] = useState([]);
    const [attachError, setAttachError] = useState('');
    const [attachedLeadCache, setAttachedLeadCache] = useState({});
    const [performanceCache, setPerformanceCache] = useState({});
    const [loadingPerformance, setLoadingPerformance] = useState(false);

    useEffect(() => {
        dispatch(getCampaigns());
        dispatch(getLeads());
    }, [dispatch]);

    // Fetch full lead details per campaign (list endpoint only returns
    // leads_count) so we can compute conversion/revenue/pipeline. This runs
    // once per campaign id, caching results — re-fetches only when a new
    // campaign appears or after attach/detach invalidates its entry below.
    useEffect(() => {
        const missing = campaigns.filter((c) => !(c.id in performanceCache));
        if (missing.length === 0) return;
        setLoadingPerformance(true);
        Promise.all(
            missing.map((c) =>
                axiosClient.get(`/campaigns/${c.id}`)
                    .then(({ data }) => ({ id: c.id, leads: getCampaignLeadItems(data.data) }))
                    .catch(() => ({ id: c.id, leads: [] }))
            )
        ).then((results) => {
            setPerformanceCache((prev) => {
                const next = { ...prev };
                results.forEach(({ id, leads: campaignLeads }) => {
                    next[id] = getCampaignPerformance(campaignLeads);
                });
                return next;
            });
            setLoadingPerformance(false);
        });
    }, [campaigns, performanceCache]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
    };

    const handleOpenCreate = () => {
        setFormData(emptyForm); setEditMode(false); setEditId(null);
        setFormError(''); setDialog(true);
    };

    const handleOpenEdit = (campaign) => {
        setFormData({
            name: campaign.name, type: campaign.type,
            status: campaign.status, description: campaign.description || '',
            start_date: campaign.start_date || '', end_date: campaign.end_date || '',
        });
        setEditMode(true); setEditId(campaign.id); setFormError(''); setDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setFormError('');
        try {
            if (editMode) {
                await dispatch(updateCampaign({ id: editId, data: formData })).unwrap();
            } else {
                await dispatch(createCampaign(formData)).unwrap();
            }
            setDialog(false);
        } catch (err) { setFormError(err || 'Something went wrong'); }
    };

    const handleDelete = async () => {
        await dispatch(deleteCampaign(deleteDialog));
        setDeleteDialog(null);
    };

    const handleOpenAttach = (campaign) => {
        setSelectedCampaign(campaign);
        setSelectedLeadIds([]);
        setAttachError('');
        setAttachDialog(true);
        dispatch(getCampaignById(campaign.id));
    };

    const handleAttachLeads = async () => {
        if (!selectedCampaign || selectedLeadIds.length === 0) {
            setAttachError('At least one lead select karo');
            return;
        }

        try {
            const newlyAttachedLeads = leads.filter((lead) => selectedLeadIds.includes(lead.id));
            await dispatch(
                attachLeadsToCampaign({ id: selectedCampaign.id, lead_ids: selectedLeadIds })
            ).unwrap();
            setAttachedLeadCache((prev) => {
                const existing = prev[selectedCampaign.id] || getCampaignLeadItems(campaignDetail);
                const merged = [...existing];
                newlyAttachedLeads.forEach((lead) => {
                    if (!merged.some((item) => item.id === lead.id)) merged.push(lead);
                });
                return { ...prev, [selectedCampaign.id]: merged };
            });
            setSelectedLeadIds([]);
            setAttachError('');
            dispatch(getCampaignById(selectedCampaign.id));
            dispatch(getCampaigns());
            setPerformanceCache((prev) => {
                const next = { ...prev };
                delete next[selectedCampaign.id];
                return next;
            });
            setAttachDialog(false);
            setSelectedCampaign(null);
        } catch (err) {
            setAttachError(err || 'Lead attach nahi ho paye');
        }
    };

    const handleDetachLead = async (leadId) => {
        if (!selectedCampaign) return;
        try {
            await dispatch(detachLeadFromCampaign({ id: selectedCampaign.id, leadId })).unwrap();
            setAttachedLeadCache((prev) => ({
                ...prev,
                [selectedCampaign.id]: (prev[selectedCampaign.id] || getCampaignLeadItems(campaignDetail))
                    .filter((lead) => lead.id !== leadId),
            }));
            setAttachError('');
            dispatch(getCampaignById(selectedCampaign.id));
            dispatch(getCampaigns());
            setPerformanceCache((prev) => {
                const next = { ...prev };
                delete next[selectedCampaign.id];
                return next;
            });
        } catch (err) {
            setAttachError(err || 'Lead detach nahi ho paya');
        }
    };

    const attachedLeads = selectedCampaign
        ? (
            attachedLeadCache[selectedCampaign.id] ||
            (campaignDetail?.id === selectedCampaign.id ? getCampaignLeadItems(campaignDetail) : [])
        )
        : [];
    const attachedLeadIds = attachedLeads.map((lead) => lead.id);
    const availableLeads = leads.filter((lead) => !attachedLeadIds.includes(lead.id));

    return (
        <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard sx={{ mb: 3, border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Box>
                            <Typography variant="h5" fontWeight={800}>Campaign Management</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Build audience lists and track campaign-linked leads
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip label={`${campaigns.length} campaigns`}
                                sx={{ bgcolor: '#eef2ff', color: '#4338ca', fontWeight: 800 }} />
                            <GradientButton startIcon={<AddIcon />} onClick={handleOpenCreate}>
                                New Campaign
                            </GradientButton>
                        </Stack>
                    </CardContent>
                </GlassCard>
            </motion.div>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <Grid item xs={6} sm={3} key={k}>
                        <GlassCard>
                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="h4" fontWeight={800} sx={{ color: v.color }}>
                                    {campaigns.filter((c) => c.status === k).length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">{v.label}</Typography>
                            </CardContent>
                        </GlassCard>
                    </Grid>
                ))}
            </Grid>

            {/* Campaign Cards */}
            {isLoading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
            ) : campaigns.length === 0 ? (
                <GlassCard>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <CampaignIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
                        <Typography color="text.secondary">No campaigns yet</Typography>
                        <GradientButton startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ mt: 2 }}>
                            Create First Campaign
                        </GradientButton>
                    </CardContent>
                </GlassCard>
            ) : (
                <Grid container spacing={2}>
                    {campaigns.map((campaign) => {
                        const tc = TYPE_CONFIG[campaign.type]   || TYPE_CONFIG.domestic;
                        const sc = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
                        return (
                            <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <GlassCard sx={{ height: '100%', border: '1px solid #e5e7eb', transition: 'all 0.2s', '&:hover': { boxShadow: '0 12px 28px rgba(15,23,42,0.08)', transform: 'translateY(-1px)' } }}>
                                        <CardContent>
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography fontWeight={800} variant="h6" gutterBottom>
                                                        {campaign.name}
                                                    </Typography>
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                                                        <Chip label={tc.label} size="small"
                                                            sx={{ bgcolor: tc.bg, color: tc.color, fontWeight: 600, fontSize: 11 }} />
                                                        <Chip label={sc.label} size="small"
                                                            sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600, fontSize: 11 }} />
                                                    </Stack>
                                                </Box>
                                                <Stack direction="row">
                                                    <Tooltip title="Attach Leads">
                                                        <IconButton size="small" onClick={() => handleOpenAttach(campaign)}
                                                            sx={{ color: '#4f46e5' }}>
                                                            <PeopleIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={() => handleOpenEdit(campaign)}
                                                            sx={{ color: '#f59e0b' }}>
                                                            <EditIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton size="small" onClick={() => setDeleteDialog(campaign.id)}
                                                            sx={{ color: '#ef4444' }}>
                                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>

                                            {campaign.description && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }} noWrap>
                                                    {campaign.description}
                                                </Typography>
                                            )}

                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <PeopleIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                        {campaign.leads_count || 0} Leads
                                                    </Typography>
                                                </Stack>
                                                {(campaign.start_date || campaign.end_date) && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {campaign.start_date} {campaign.end_date ? `→ ${campaign.end_date}` : ''}
                                                    </Typography>
                                                )}
                                            </Stack>

                                            <Divider sx={{ my: 1.5 }} />
                                            {performanceCache[campaign.id] ? (
                                                (() => {
                                                    const perf = performanceCache[campaign.id];
                                                    return perf.total === 0 ? (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Koi lead attach nahi hai abhi
                                                        </Typography>
                                                    ) : (
                                                        <Grid container spacing={1}>
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" color="text.secondary">Conversion</Typography>
                                                                <Typography variant="body2" fontWeight={800} sx={{ color: perf.conversionRate >= 20 ? '#16a34a' : '#b45309' }}>
                                                                    {perf.conversionRate.toFixed(1)}% ({perf.won}/{perf.total})
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" color="text.secondary">Revenue Won</Typography>
                                                                <Typography variant="body2" fontWeight={800} sx={{ color: '#0f766e' }}>
                                                                    {formatMoney(perf.revenue)}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" color="text.secondary">Weighted Pipeline</Typography>
                                                                <Typography variant="body2" fontWeight={700}>
                                                                    {formatMoney(perf.pipeline)}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" color="text.secondary">Open / Lost</Typography>
                                                                <Typography variant="body2" fontWeight={700}>
                                                                    {perf.open} / {perf.lost}
                                                                </Typography>
                                                            </Grid>
                                                        </Grid>
                                                    );
                                                })()
                                            ) : (
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <CircularProgress size={14} />
                                                    <Typography variant="caption" color="text.secondary">Performance load ho raha hai...</Typography>
                                                </Stack>
                                            )}
                                        </CardContent>
                                    </GlassCard>
                                </motion.div>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    <Typography fontWeight={700}>{editMode ? 'Edit Campaign' : 'New Campaign'}</Typography>
                    <IconButton size="small" onClick={() => setDialog(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <Box component="form" onSubmit={handleSubmit}>
                    <DialogContent sx={{ pt: 3 }}>
                        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                        <Stack spacing={2}>
                            <TextField fullWidth size="small" label="Campaign Name *" name="name"
                                value={formData.name} onChange={handleChange} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <Stack direction="row" spacing={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Type</InputLabel>
                                    <Select name="type" value={formData.type} label="Type"
                                        onChange={handleChange} sx={{ borderRadius: '10px' }}>
                                        {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                                            <MenuItem key={k} value={k}>{v.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select name="status" value={formData.status} label="Status"
                                        onChange={handleChange} sx={{ borderRadius: '10px' }}>
                                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                            <MenuItem key={k} value={k}>{v.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                            <TextField fullWidth size="small" label="Description" name="description"
                                multiline rows={2} value={formData.description} onChange={handleChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <Stack direction="row" spacing={2}>
                                <TextField fullWidth size="small" label="Start Date" name="start_date"
                                    type="date" value={formData.start_date} onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                                <TextField fullWidth size="small" label="End Date" name="end_date"
                                    type="date" value={formData.end_date} onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Stack>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button variant="outlined" onClick={() => setDialog(false)}
                            startIcon={<CloseIcon />} sx={{ borderRadius: '10px' }}>Cancel</Button>
                        <GradientButton type="submit" disabled={actionLoading} startIcon={<SaveIcon />}
                            gradient="linear-gradient(135deg,#7c3aed,#4f46e5)">
                            {actionLoading ? 'Saving...' : editMode ? 'Update' : 'Create Campaign'}
                        </GradientButton>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog open={attachDialog} onClose={() => setAttachDialog(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    <Typography fontWeight={700}>Attach Leads</Typography>
                    <IconButton size="small" onClick={() => setAttachDialog(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {attachError && <Alert severity="error" sx={{ mb: 2 }}>{attachError}</Alert>}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {selectedCampaign ? `Campaign: ${selectedCampaign.name}` : 'Campaign select nahi hai'}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                            Attached Leads ({attachedLeads.length})
                        </Typography>
                        {attachedLeads.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                {selectedCampaign?.leads_count
                                    ? 'Leads attached hain, lekin detailed list response me nahi aa rahi.'
                                    : 'Abhi koi lead attached nahi hai.'}
                            </Typography>
                        ) : (
                            <Stack spacing={1}>
                                {attachedLeads.map((lead) => (
                                    <Stack
                                        key={lead.id}
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{ p: 1.25, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e5e7eb' }}
                                    >
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {lead.company_name || `Lead #${lead.id}`}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {lead.contact_person || lead.phone || lead.email || 'No secondary info'}
                                            </Typography>
                                        </Box>
                                        <Button
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            onClick={() => handleDetachLead(lead.id)}
                                            sx={{ borderRadius: '10px', textTransform: 'none' }}
                                        >
                                            Remove
                                        </Button>
                                    </Stack>
                                ))}
                            </Stack>
                        )}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <FormControl fullWidth size="small">
                        <InputLabel>Select Leads</InputLabel>
                        <Select
                            multiple
                            value={selectedLeadIds}
                            label="Select Leads"
                            onChange={(e) => setSelectedLeadIds(e.target.value)}
                            renderValue={(selected) => {
                                const selectedLabels = leads
                                    .filter((lead) => selected.includes(lead.id))
                                    .map((lead) => lead.company_name)
                                    .filter(Boolean);
                                return selectedLabels.join(', ');
                            }}
                            sx={{ borderRadius: '10px' }}
                        >
                            {availableLeads.map((lead) => (
                                <MenuItem key={lead.id} value={lead.id}>
                                    <Checkbox checked={selectedLeadIds.includes(lead.id)} size="small" />
                                    <ListItemText
                                        primary={lead.company_name || `Lead #${lead.id}`}
                                        secondary={lead.contact_person || lead.phone || lead.email || ''}
                                    />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button variant="outlined" onClick={() => setAttachDialog(false)}
                        startIcon={<CloseIcon />} sx={{ borderRadius: '10px' }}>
                        Cancel
                    </Button>
                    <GradientButton onClick={handleAttachLeads} disabled={actionLoading} startIcon={<SaveIcon />}>
                        {actionLoading ? 'Attaching...' : 'Attach Leads'}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Delete Campaign?</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary">Yeh campaign delete ho jaayegi. Leads affect nahi honge.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialog(null)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: '10px' }}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}