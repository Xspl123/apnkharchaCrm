import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getRoles, getPermissions, updateRolePermissions } from '../state/roleSlice';
import usePermission from '../../../hooks/usePermission';
import {
    Box, Card, CardContent, Typography, Button, Chip, Stack,
    Accordion, AccordionSummary, AccordionDetails, Checkbox,
    FormControlLabel, Alert, CircularProgress, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Tooltip, LinearProgress,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    AdminPanelSettings as AdminIcon,
    Save as SaveIcon,
    Lock as LockIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const GlassCard = styled(Card)(() => ({
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
}));

const GradientButton = styled(Button)(({ gradient }) => ({
    background: gradient || 'linear-gradient(135deg,#667eea,#764ba2)',
    color: '#fff',
    borderRadius: '10px',
    textTransform: 'none',
    fontWeight: 600,
    '&:hover': { opacity: 0.9 },
    '&:disabled': { background: '#ccc', color: '#fff' },
}));

const MODULE_CONFIG = {
    dashboard:  { color: '#6366f1', label: 'Dashboard' },
    users:      { color: '#7c3aed', label: 'Users' },
    inventory:  { color: '#0891b2', label: 'Inventory' },
    purchase:   { color: '#d97706', label: 'Purchase Orders' },
    invoices:   { color: '#16a34a', label: 'Invoices' },
    returns:    { color: '#dc2626', label: 'Returns' },
    vendors:    { color: '#ea580c', label: 'Vendors' },
    clients:    { color: '#0284c7', label: 'Clients' },
    crm:        { color: '#7c3aed', label: 'CRM' },
    reports:    { color: '#059669', label: 'Reports' },
    gst:        { color: '#b45309', label: 'GST' },
};

export default function RoleManagement() {
    const dispatch = useDispatch();
    const { roles, permissions, isLoading } = useSelector((s) => s.roles);
    const { isSuperAdmin } = usePermission();

    const [selectedRole,  setSelectedRole]  = useState(null);
    const [checkedPerms,  setCheckedPerms]  = useState({});
    const [saving,        setSaving]        = useState(false);
    const [successMsg,    setSuccessMsg]    = useState('');
    const [errorMsg,      setErrorMsg]      = useState('');
    const [confirmDialog, setConfirmDialog] = useState(false);

    useEffect(() => {
        dispatch(getRoles());
        dispatch(getPermissions());
    }, [dispatch]);

    // ── Org Owner ko super_admin + org_admin hide karo ────
    // Super Admin ko sab roles dikhenge
    const visibleRoles = isSuperAdmin()
    ? roles
    : roles.filter((r) => r.name !== 'super_admin');

    // Max permissions for progress bar
    const maxPerms = roles.find((r) => r.name === 'super_admin')?.permissions?.length || 44;

    const handleSelectRole = (role) => {
        if (role.name === 'super_admin') return;
        setSelectedRole(role);
        setSuccessMsg('');
        setErrorMsg('');
        const checked = {};
        role.permissions?.forEach((p) => { checked[p.id] = true; });
        setCheckedPerms(checked);
    };

    const handleTogglePerm   = (permId) => setCheckedPerms((prev) => ({ ...prev, [permId]: !prev[permId] }));
    const handleToggleModule = (modulePerms) => {
        const allChecked = modulePerms.every((p) => checkedPerms[p.id]);
        const updated = { ...checkedPerms };
        modulePerms.forEach((p) => { updated[p.id] = !allChecked; });
        setCheckedPerms(updated);
    };

    const handleSave = async () => {
        setConfirmDialog(false);
        setSaving(true);
        setSuccessMsg('');
        setErrorMsg('');
        const permission_ids = Object.entries(checkedPerms).filter(([, v]) => v).map(([k]) => Number(k));
        try {
            await dispatch(updateRolePermissions({ id: selectedRole.id, permission_ids })).unwrap();
            setSuccessMsg(`${selectedRole.label} permissions updated!`);
            dispatch(getRoles());
        } catch (err) {
            setErrorMsg(err || 'Failed to update permissions');
        } finally {
            setSaving(false);
        }
    };

    const countSelected = (modulePerms) => modulePerms.filter((p) => checkedPerms[p.id]).length;

    return (
        <Box sx={{ p: 3 }}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard sx={{ mb: 3, background: 'linear-gradient(135deg,#1e3a8a,#3730a3)', color: '#fff' }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AdminIcon /> Role & Permission Management
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                Har role ke liye permissions configure karo
                            </Typography>
                        </Box>
                        <Chip label={`${visibleRoles.length} Roles`}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }} />
                    </CardContent>
                </GlassCard>
            </motion.div>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">

                {/* ── Left: Role List ───────────────────── */}
                <GlassCard sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
                    <CardContent>
                        <Typography fontWeight={700} mb={2} color="text.secondary" variant="caption"
                            sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                            Select Role
                        </Typography>
                        <Stack spacing={1}>
                            {isLoading ? <CircularProgress size={24} /> :
                                visibleRoles.map((role) => {
                                    const isSelected   = selectedRole?.id === role.id;
                                    const isLocked     = role.name === 'super_admin';
                                    return (
                                        <Box key={role.id}
                                            onClick={() => !isLocked && handleSelectRole(role)}
                                            sx={{
                                                p: 1.5, borderRadius: '10px',
                                                border: `2px solid ${isSelected ? role.color : 'transparent'}`,
                                                bgcolor: isSelected ? role.color + '12' : 'rgba(0,0,0,0.02)',
                                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                                opacity: isLocked ? 0.65 : 1,
                                                transition: 'all 0.2s',
                                                '&:hover': { bgcolor: isLocked ? undefined : role.color + '12' },
                                            }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: role.color }} />
                                                        <Typography fontWeight={600} variant="body2">{role.label}</Typography>
                                                    </Stack>
                                                    <Typography variant="caption" color="text.secondary" sx={{ pl: 2.5 }}>
                                                        {role.permissions?.length || 0} permissions
                                                    </Typography>
                                                </Box>
                                                {isLocked && (
                                                    <Tooltip title={
                                                        role.name === 'super_admin'
                                                            ? 'Super Admin permissions cannot be modified'
                                                            : 'Org Admin has full access — locked'
                                                    }>
                                                        <LockIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                            <LinearProgress variant="determinate"
                                                value={Math.round(((role.permissions?.length || 0) / maxPerms) * 100)}
                                                sx={{ mt: 1, borderRadius: 4, height: 4,
                                                    bgcolor: role.color + '20',
                                                    '& .MuiLinearProgress-bar': { bgcolor: role.color } }} />
                                        </Box>
                                    );
                                })
                            }
                        </Stack>
                    </CardContent>
                </GlassCard>

                {/* ── Right: Permissions ────────────────── */}
                <Box sx={{ flex: 1, width: '100%' }}>
                    {!selectedRole ? (
                        <GlassCard>
                            <CardContent sx={{ textAlign: 'center', py: 6 }}>
                                <AdminIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
                                <Typography color="text.secondary">Left side se koi role select karo</Typography>
                            </CardContent>
                        </GlassCard>
                    ) : (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <GlassCard>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: selectedRole.color }} />
                                            <Typography fontWeight={700} variant="h6">{selectedRole.label}</Typography>
                                            <Chip
                                                label={`${Object.values(checkedPerms).filter(Boolean).length} selected`}
                                                size="small"
                                                sx={{ bgcolor: selectedRole.color + '20', color: selectedRole.color, fontWeight: 600 }} />
                                        </Stack>
                                        <GradientButton
                                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                                            onClick={() => setConfirmDialog(true)} disabled={saving}
                                            gradient={`linear-gradient(135deg,${selectedRole.color},${selectedRole.color}99)`}>
                                            {saving ? 'Saving...' : 'Save Permissions'}
                                        </GradientButton>
                                    </Stack>

                                    {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
                                    {errorMsg   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

                                    <Divider sx={{ mb: 2 }} />

                                    {permissions.map((moduleGroup) => {
                                        const config     = MODULE_CONFIG[moduleGroup.module] || { color: '#6b7280', label: moduleGroup.module };
                                        const perms      = moduleGroup.permissions;
                                        const selected   = countSelected(perms);
                                        const allChecked = selected === perms.length;
                                        return (
                                            <Accordion key={moduleGroup.module} disableGutters
                                                sx={{ mb: 1, borderRadius: '10px !important',
                                                    border: `1px solid ${config.color}30`,
                                                    '&:before': { display: 'none' }, boxShadow: 'none' }}>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}
                                                    sx={{ bgcolor: config.color + '08', borderRadius: '10px' }}>
                                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, mr: 1 }}>
                                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: config.color, flexShrink: 0 }} />
                                                        <Typography fontWeight={600} variant="body2">{config.label}</Typography>
                                                        <Chip label={`${selected}/${perms.length}`} size="small"
                                                            sx={{ bgcolor: config.color + '20', color: config.color, fontWeight: 700, fontSize: 11 }} />
                                                        {allChecked && <CheckCircleIcon sx={{ fontSize: 16, color: config.color }} />}
                                                        <Box sx={{ flex: 1 }} />
                                                        <Button size="small" onClick={(e) => { e.stopPropagation(); handleToggleModule(perms); }}
                                                            sx={{ fontSize: 11, color: config.color, textTransform: 'none', minWidth: 'auto' }}>
                                                            {allChecked ? 'Deselect All' : 'Select All'}
                                                        </Button>
                                                    </Stack>
                                                </AccordionSummary>
                                                <AccordionDetails sx={{ pt: 0 }}>
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 0.5 }}>
                                                        {perms.map((perm) => (
                                                            <FormControlLabel key={perm.id}
                                                                control={
                                                                    <Checkbox checked={!!checkedPerms[perm.id]}
                                                                        onChange={() => handleTogglePerm(perm.id)}
                                                                        size="small"
                                                                        sx={{ color: config.color, '&.Mui-checked': { color: config.color } }} />
                                                                }
                                                                label={<Typography variant="body2" sx={{ fontSize: 13 }}>{perm.label}</Typography>}
                                                            />
                                                        ))}
                                                    </Box>
                                                </AccordionDetails>
                                            </Accordion>
                                        );
                                    })}
                                </CardContent>
                            </GlassCard>
                        </motion.div>
                    )}
                </Box>
            </Stack>

            <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Permissions Update Confirm</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary">
                        <strong>{selectedRole?.label}</strong> role ke permissions update ho jaayenge. Kya aap sure hain?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmDialog(false)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <GradientButton onClick={handleSave} startIcon={<SaveIcon />}>Confirm & Save</GradientButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
