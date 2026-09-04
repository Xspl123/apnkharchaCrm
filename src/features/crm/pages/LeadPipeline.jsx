import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getLeads, updateLeadStatus } from '../state/leadSlice';
import { Box, Typography, Button, Chip, Stack, Avatar, Paper, Grid, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import { ArrowBack as BackIcon, Business as BusinessIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';

const PIPELINE_STAGES = [
    { key: 'new',                    label: 'New',                    color: '#6366f1', bg: '#eef2ff' },
    { key: 'contact_attempted',      label: 'Contact Attempted',      color: '#f59e0b', bg: '#fffbeb' },
    { key: 'connected',              label: 'Connected',              color: '#0891b2', bg: '#ecfeff' },
    { key: 'requirement_discussion', label: 'Requirement Discussion', color: '#8b5cf6', bg: '#f5f3ff' },
    { key: 'quotation_sent',         label: 'Quotation Sent',         color: '#ec4899', bg: '#fdf2f8' },
    { key: 'negotiation',            label: 'Negotiation',            color: '#f97316', bg: '#fff7ed' },
    { key: 'positive_response',      label: 'Positive Response',      color: '#10b981', bg: '#ecfdf5' },
    { key: 'po_received',            label: 'PO Received',            color: '#0284c7', bg: '#eff6ff' },
    { key: 'closed_won',             label: 'Closed Won',             color: '#16a34a', bg: '#dcfce7' },
    { key: 'closed_lost',            label: 'Closed Lost',             color: '#dc2626', bg: '#fee2e2' },
];

const Column = styled(Paper)(({ stagecolor }) => ({
    minWidth: 260,
    maxWidth: 280,
    minHeight: 560,
    background: '#f8fafc',
    border: `1px solid ${stagecolor}28`,
    borderRadius: '12px',
    padding: '12px',
    flex: '0 0 auto',
}));

const LeadCard = styled(motion.div)(({ stagecolor }) => ({
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderTop: `3px solid ${stagecolor}`,
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '10px',
    cursor: 'grab',
    boxShadow: '0 6px 18px rgba(15,23,42,0.04)',
    '&:hover': { boxShadow: `0 10px 24px ${stagecolor}18`, transform: 'translateY(-1px)' },
    transition: 'all 0.2s',
}));

const DroppableColumn = ({ stage, children }) => {
    const { isOver, setNodeRef } = useDroppable({ id: stage.key });

    return (
        <Column
            ref={setNodeRef}
            stagecolor={stage.color}
            elevation={0}
            sx={{
                bgcolor: isOver ? stage.bg : '#f8fafc',
                boxShadow: isOver ? `0 0 0 2px ${stage.color}55 inset` : 'none',
                transition: 'background 0.15s, box-shadow 0.15s',
            }}
        >
            {children}
        </Column>
    );
};

const DraggableLeadCard = ({ lead, stage, children, onOpen }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `lead-${lead.id}`,
        data: { lead, fromStatus: stage.key },
    });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.55 : 1,
        zIndex: isDragging ? 20 : 'auto',
        position: 'relative',
    };

    return (
        <LeadCard
            ref={setNodeRef}
            stagecolor={stage.color}
            style={style}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onOpen}
            {...attributes}
            {...listeners}
        >
            {children}
        </LeadCard>
    );
};

const LeadDragPreview = ({ lead, stage }) => (
    <Paper
        elevation={8}
        sx={{
            width: 252,
            p: 1.5,
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            borderTop: `3px solid ${stage?.color || '#6366f1'}`,
            bgcolor: '#fff',
            cursor: 'grabbing',
        }}
    >
        <Stack direction="row" spacing={1} alignItems="flex-start">
            <Avatar sx={{ bgcolor: stage?.color || '#6366f1', width: 28, height: 28, fontSize: 12, flexShrink: 0 }}>
                {lead?.company_name?.charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={700} variant="body2" noWrap>{lead?.company_name || 'Lead'}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{lead?.contact_person || 'Move lead'}</Typography>
                {!!lead?.budget && (
                    <Typography variant="caption" display="block" sx={{ color: stage?.color || '#6366f1', fontWeight: 700 }}>
                        {lead.currency} {Number(lead.budget).toLocaleString()}
                    </Typography>
                )}
            </Box>
        </Stack>
    </Paper>
);

const formatMoney = (amount, currency = 'INR') => {
    if (!amount) return '-';
    return `${currency || 'INR'} ${Number(amount).toLocaleString()}`;
};

export default function LeadPipeline() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { leads, actionLoading } = useSelector((s) => s.leads);
    const [dropTarget, setDropTarget] = useState(null);
    const [lostReason, setLostReason] = useState('');
    const [statusError, setStatusError] = useState('');
    const [msg, setMsg] = useState('');
    const [pageError, setPageError] = useState('');
    const [activeDragLead, setActiveDragLead] = useState(null);
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
    );

    useEffect(() => { dispatch(getLeads()); }, [dispatch]);

    const leadSignals = useMemo(() => {
        const now = new Date();

        return Object.fromEntries(leads.map((lead) => {
            const createdDate = lead.created_at ? new Date(lead.created_at) : null;
            const stageAging = createdDate
                ? Math.max(0, Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)))
                : 0;
            const overdueCount = (lead.follow_ups || []).filter((item) => {
                if (item.is_done) return false;
                if (item.is_overdue) return true;
                if (!item.due_date) return false;
                return new Date(item.due_date) < now;
            }).length;
            const budgetValue = Number(lead.budget || 0);
            const priority =
                lead.status === 'positive_response' || lead.status === 'negotiation'
                    ? { label: 'High', color: '#dc2626', bg: '#fee2e2' }
                    : overdueCount > 0 || budgetValue > 100000
                        ? { label: 'Medium', color: '#d97706', bg: '#fef3c7' }
                        : { label: 'Normal', color: '#2563eb', bg: '#dbeafe' };

            return [lead.id, { stageAging, overdueCount, priority }];
        }));
    }, [leads]);

    const grouped = PIPELINE_STAGES.reduce((acc, stage) => {
        acc[stage.key] = leads.filter((l) => l.status === stage.key);
        return acc;
    }, {});

    const pipelineSummary = useMemo(() => {
        const activeLeads = leads.filter((lead) => !['closed_won', 'closed_lost'].includes(lead.status));
        const pipelineValue = activeLeads.reduce((sum, lead) => sum + Number(lead.budget || 0), 0);
        const wonValue = (grouped.closed_won || []).reduce((sum, lead) => sum + Number(lead.budget || 0), 0);
        const overdueLeads = leads.filter((lead) => (leadSignals[lead.id]?.overdueCount || 0) > 0).length;
        return { activeLeads: activeLeads.length, pipelineValue, wonValue, overdueLeads };
    }, [grouped.closed_won, leadSignals, leads]);

    const moveLeadToStage = async (lead, status, reason = '') => {
        if (!lead || lead.status === status) return false;
        setPageError('');
        try {
            await dispatch(updateLeadStatus({
                id: lead.id,
                status,
                lost_reason: status === 'closed_lost' ? reason : undefined,
            })).unwrap();
            setMsg(`${lead.company_name || 'Lead'} moved to ${PIPELINE_STAGES.find((stage) => stage.key === status)?.label || status}`);
            setTimeout(() => setMsg(''), 2500);
            return true;
        } catch (err) {
            setPageError(err || 'Lead status update nahi ho paya. Please try again.');
            return false;
        }
    };

    const requestMoveLead = async (lead, status) => {
        if (status === 'closed_lost') {
            setDropTarget({ lead, status });
            setLostReason('');
            setStatusError('');
            return;
        }
        await moveLeadToStage(lead, status);
    };

    const handleDragStart = ({ active }) => {
        setActiveDragLead(active?.data?.current?.lead || null);
    };

    const handleDragEnd = async ({ active, over }) => {
        setActiveDragLead(null);
        const lead = active?.data?.current?.lead;
        const nextStatus = over?.id;
        if (!lead || !nextStatus || lead.status === nextStatus) return;
        await requestMoveLead(lead, nextStatus);
    };

    const handleDragCancel = () => {
        setActiveDragLead(null);
    };

    const handleMoveNext = async (lead, currentStageIndex) => {
        if (currentStageIndex < PIPELINE_STAGES.length - 2) {
            await requestMoveLead(lead, PIPELINE_STAGES[currentStageIndex + 1].key);
        }
    };

    const handleConfirmLost = async () => {
        if (!lostReason.trim()) {
            setStatusError('Closed lost ke liye lost reason required hai');
            return;
        }
        const moved = await moveLeadToStage(dropTarget.lead, dropTarget.status, lostReason.trim());
        if (!moved) return;
        setDropTarget(null);
        setLostReason('');
        setStatusError('');
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {msg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMsg('')}>{msg}</Alert>}
            {pageError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError('')}>{pageError}</Alert>}
            <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: '14px', border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button startIcon={<BackIcon />} onClick={() => navigate('/crm/leads')}
                            sx={{ textTransform: 'none', color: '#475569' }}>Back</Button>
                        <Box>
                            <Typography variant="h5" fontWeight={800}>Lead Pipeline</Typography>
                            <Typography variant="body2" color="text.secondary">Drag leads between columns or use the next-stage button</Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip label={`${pipelineSummary.activeLeads} active`} sx={{ bgcolor: '#eef2ff', color: '#4338ca', fontWeight: 800 }} />
                        <Chip label={`${pipelineSummary.overdueLeads} overdue`} sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 800 }} />
                        <Chip label={`Won ${formatMoney(pipelineSummary.wonValue)}`} sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 800 }} />
                    </Stack>
                </Stack>
            </Paper>

            <Grid container spacing={2} sx={{ mb: 2.5 }}>
                {[
                    { label: 'Pipeline Value', value: formatMoney(pipelineSummary.pipelineValue), color: '#0f766e' },
                    { label: 'Total Leads', value: leads.length, color: '#4338ca' },
                    { label: 'Closed Won', value: grouped.closed_won?.length || 0, color: '#16a34a' },
                    { label: 'Closed Lost', value: grouped.closed_lost?.length || 0, color: '#dc2626' },
                ].map((item) => (
                    <Grid item xs={12} sm={6} md={3} key={item.label}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e5e7eb', bgcolor: '#fff' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>{item.label}</Typography>
                            <Typography variant="h6" fontWeight={800} sx={{ color: item.color }}>{item.value}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Kanban Board */}
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2,
                '&::-webkit-scrollbar': { height: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#d1d5db', borderRadius: 3 } }}>
                {PIPELINE_STAGES.map((stage, stageIndex) => {
                    const stageLeads = grouped[stage.key] || [];
                    return (
                        <DroppableColumn key={stage.key} stage={stage}>
                            {/* Column Header */}
                            <Stack spacing={1.25} mb={1.5}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: stage.color }} />
                                        <Typography fontWeight={800} variant="body2" sx={{ color: '#0f172a' }}>
                                            {stage.label}
                                        </Typography>
                                    </Stack>
                                    <Chip label={stageLeads.length} size="small"
                                        sx={{ bgcolor: stage.color + '20', color: stage.color, fontWeight: 800, height: 20, fontSize: 11 }} />
                                </Stack>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                    {formatMoney(stageLeads.reduce((sum, lead) => sum + Number(lead.budget || 0), 0))}
                                </Typography>
                                <Divider />
                            </Stack>

                            {/* Lead Cards */}
                            {stageLeads.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 3, opacity: 0.4 }}>
                                    <BusinessIcon sx={{ fontSize: 28, color: stage.color }} />
                                    <Typography variant="caption" display="block" color="text.secondary">
                                        No leads
                                    </Typography>
                                </Box>
                            ) : (
                                stageLeads.map((lead) => {
                                    const signal = leadSignals[lead.id] || {};
                                    return (
                                    <DraggableLeadCard key={lead.id} lead={lead} stage={stage}
                                        onOpen={() => navigate(`/crm/leads/${lead.id}`)}>
                                        <Stack direction="row" spacing={1} alignItems="flex-start">
                                            <Avatar sx={{ bgcolor: stage.color, width: 28, height: 28, fontSize: 12, flexShrink: 0 }}>
                                                {lead.company_name?.charAt(0)}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography fontWeight={600} variant="body2" noWrap>
                                                    {lead.company_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    {lead.contact_person || '—'}
                                                </Typography>
                                                {lead.budget && (
                                                    <Typography variant="caption" display="block"
                                                        sx={{ color: stage.color, fontWeight: 600 }}>
                                                        {lead.currency} {Number(lead.budget).toLocaleString()}
                                                    </Typography>
                                                )}
                                                {lead.product_interest && (
                                                    <Chip label={lead.product_interest} size="small"
                                                        sx={{ mt: 0.5, fontSize: 10, height: 18,
                                                            bgcolor: stage.color + '15', color: stage.color }} />
                                                )}
                                                <Stack direction="row" spacing={0.5} mt={0.75} flexWrap="wrap">
                                                    <Chip
                                                        label={`Aging ${signal.stageAging || 0}d`}
                                                        size="small"
                                                        sx={{ fontSize: 10, height: 18, bgcolor: '#f8fafc', color: '#475569' }}
                                                    />
                                                    <Chip
                                                        label={signal.priority?.label || 'Normal'}
                                                        size="small"
                                                        sx={{ fontSize: 10, height: 18, bgcolor: signal.priority?.bg || '#dbeafe', color: signal.priority?.color || '#2563eb', fontWeight: 700 }}
                                                    />
                                                    {!!signal.overdueCount && (
                                                        <Chip
                                                            label={`${signal.overdueCount} overdue`}
                                                            size="small"
                                                            sx={{ fontSize: 10, height: 18, bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 700 }}
                                                        />
                                                    )}
                                                </Stack>
                                            </Box>
                                        </Stack>

                                        {/* Move to Next Stage */}
                                        {stageIndex < PIPELINE_STAGES.length - 2 && (
                                            <Button fullWidth size="small" variant="outlined"
                                                disabled={actionLoading}
                                                onClick={(e) => { e.stopPropagation(); handleMoveNext(lead, stageIndex); }}
                                                sx={{ mt: 1, fontSize: 10, textTransform: 'none', borderRadius: '6px',
                                                    borderColor: stage.color + '40', color: stage.color,
                                                    '&:hover': { bgcolor: stage.color + '10' } }}>
                                                Move to {PIPELINE_STAGES[stageIndex + 1]?.label}
                                            </Button>
                                        )}
                                    </DraggableLeadCard>
                                );
                                })
                            )}
                        </DroppableColumn>
                    );
                })}
            </Box>
                <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
                    {activeDragLead ? (
                        <LeadDragPreview
                            lead={activeDragLead}
                            stage={PIPELINE_STAGES.find((stage) => stage.key === activeDragLead.status)}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <Dialog open={!!dropTarget} onClose={() => setDropTarget(null)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Lost Reason Required</DialogTitle>
                <DialogContent>
                    {statusError && <Alert severity="error" sx={{ mb: 2 }}>{statusError}</Alert>}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {dropTarget?.lead?.company_name || 'Lead'} ko Closed Lost me move karne ke liye reason add karo.
                    </Typography>
                    <TextField fullWidth size="small" label="Lost Reason *" value={lostReason}
                        onChange={(e) => setLostReason(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDropTarget(null)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleConfirmLost} disabled={actionLoading || !lostReason.trim()}
                        sx={{ borderRadius: '10px', textTransform: 'none' }}>
                        Move to Lost
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
