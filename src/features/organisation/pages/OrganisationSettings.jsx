import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getOrganisation, updateOrganisation, getOrgMembers,
    addOrgMember, toggleOrgMember, removeOrgMember, updateMemberRole,
} from '../state/orgSlice';
import { getRoles } from '../../admin/state/roleSlice';
import {
    Box, Card, CardContent, Typography, Button, TextField,
    Grid, Stack, Avatar, Chip, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Select, MenuItem,
    FormControl, InputLabel, Alert, CircularProgress, Tabs, Tab,
    Tooltip, Divider,
} from '@mui/material';
import {
    Edit as EditIcon, Delete as DeleteIcon,
    PersonOff as DeactivateIcon, PersonAdd as ActivateIcon,
    Add as AddIcon, Business as BusinessIcon,
    Save as SaveIcon, Close as CloseIcon,
    Image as ImageIcon,
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
    color: '#fff',
    borderRadius: '10px',
    textTransform: 'none',
    fontWeight: 600,
    '&:hover': { opacity: 0.9 },
    '&:disabled': { background: '#ccc' },
}));

const emptyMember = { name: '', email: '', phone: '', password: '', role_id: '' };

export default function OrganisationSettings() {
    const dispatch = useDispatch();
    const { organisation, members, isLoading, actionLoading } = useSelector((s) => s.orgs);
    const { roles } = useSelector((s) => s.roles);
    const { user }  = useSelector((s) => s.auth);

    const [tab,          setTab]          = useState(0);
    const [editOrg,      setEditOrg]      = useState(false);
    const [orgForm,      setOrgForm]      = useState({});
    const [memberDialog, setMemberDialog] = useState(false);
    const [memberForm,   setMemberForm]   = useState(emptyMember);
    const [deleteDialog, setDeleteDialog] = useState(null);
    const [formErr,      setFormErr]      = useState('');
    const [successMsg,   setSuccessMsg]   = useState('');
    const [logoPreview,  setLogoPreview]  = useState('');

    const isOwner = user?.user_type === 'org_owner';

    useEffect(() => {
        dispatch(getOrganisation());
        dispatch(getOrgMembers());
        dispatch(getRoles());
    }, [dispatch]);

    useEffect(() => {
        if (organisation) {
            setOrgForm({
                name:       organisation.name       || '',
                email:      organisation.email      || '',
                phone:      organisation.phone      || '',
                address:    organisation.address    || '',
                city:       organisation.city       || '',
                country:    organisation.country    || 'India',
                gst_number: organisation.gst_number || '',
                pan_number: organisation.pan_number || '',
                logo:       organisation.logo       || '',
            });
            setLogoPreview(organisation.logo || '');
        }
    }, [organisation]);

    const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

    const handleOrgUpdate = async () => {
        try {
            await dispatch(updateOrganisation(orgForm)).unwrap();
            setEditOrg(false);
            showSuccess('Organisation updated!');
        } catch (err) { setFormErr(err); }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        setFormErr('');
        try {
            await dispatch(addOrgMember(memberForm)).unwrap();
            await dispatch(getOrgMembers());
            setMemberDialog(false);
            setMemberForm(emptyMember);
            showSuccess('Member added successfully!');
        } catch (err) { setFormErr(err || 'Failed'); }
    };

    const handleToggle    = async (userId) => { await dispatch(toggleOrgMember(userId)); await dispatch(getOrgMembers()); };
    const handleRemove    = async () => { await dispatch(removeOrgMember(deleteDialog)); setDeleteDialog(null); showSuccess('Member removed!'); };
    const handleRoleChange = async (userId, roleId) => { await dispatch(updateMemberRole({ userId, role_id: roleId })); showSuccess('Role updated!'); };

    const infoFields = [
        { label: 'Organisation Name *', name: 'name',       required: true, xs: 6 },
        { label: 'Business Email',      name: 'email',      type: 'email', xs: 6 },
        { label: 'Phone',               name: 'phone',      xs: 6 },
        { label: 'City',                name: 'city',       xs: 6 },
        { label: 'Country',             name: 'country',    xs: 6 },
        { label: 'GST Number',          name: 'gst_number', xs: 6 },
        { label: 'PAN Number',          name: 'pan_number', xs: 6 },
    ];

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard sx={{ mb: 3, background: 'linear-gradient(135deg,#1e3a8a,#3730a3)', color: '#fff' }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            {/* Logo preview in header */}
                            {organisation?.logo ? (
                                <Box component="img" src={organisation.logo}
                                    sx={{ width: 52, height: 52, borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }}
                                    onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                                <Box sx={{ width: 52, height: 52, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BusinessIcon sx={{ fontSize: 28 }} />
                                </Box>
                            )}
                            <Box>
                                <Typography variant="h5" fontWeight={700}>
                                    {organisation?.name || 'Organisation Settings'}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    Plan: {organisation?.plan?.toUpperCase() || 'FREE'} &nbsp;|&nbsp;
                                    Members: {members?.length || 0}
                                </Typography>
                            </Box>
                        </Stack>
                        <Chip label={organisation?.is_active ? 'Active' : 'Inactive'}
                            sx={{ bgcolor: organisation?.is_active ? '#dcfce7' : '#fee2e2',
                                color: organisation?.is_active ? '#16a34a' : '#dc2626', fontWeight: 700 }} />
                    </CardContent>
                </GlassCard>
            </motion.div>

            {successMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
            {formErr    && <Alert severity="error"   sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setFormErr('')}>{formErr}</Alert>}

            {/* Tabs */}
            <GlassCard sx={{ mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
                    <Tab label="🏢 Organisation Info" />
                    <Tab label={`👥 Members (${members?.length || 0})`} />
                </Tabs>
            </GlassCard>

            {/* ── Tab 0 — Org Info ─────────────────────────── */}
            {tab === 0 && (
                <GlassCard>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                            <Typography fontWeight={700} variant="h6">Organisation Details</Typography>
                            {isOwner && (
                                <GradientButton
                                    startIcon={editOrg ? <CloseIcon /> : <EditIcon />}
                                    onClick={() => setEditOrg(!editOrg)}
                                    gradient={editOrg ? 'linear-gradient(135deg,#ef4444,#dc2626)' : undefined}>
                                    {editOrg ? 'Cancel' : 'Edit'}
                                </GradientButton>
                            )}
                        </Stack>

                        <Grid container spacing={2}>
                            {/* ── Logo URL ─────────────────────────── */}
                            <Grid item xs={12}>
                                <Divider sx={{ mb: 2 }}>
                                    <Chip label="Logo" size="small" icon={<ImageIcon />} />
                                </Divider>

                                {editOrg ? (
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                                        <TextField fullWidth size="small" label="Logo URL"
                                            name="logo" value={orgForm.logo || ''}
                                            placeholder="https://yoursite.com/logo.png"
                                            onChange={(e) => {
                                                setOrgForm((p) => ({ ...p, logo: e.target.value }));
                                                setLogoPreview(e.target.value);
                                            }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                                        {/* Live preview */}
                                        {logoPreview && (
                                            <Box component="img" src={logoPreview}
                                                sx={{ width: 80, height: 80, borderRadius: '12px', objectFit: 'cover', border: '2px solid #e5e7eb', flexShrink: 0 }}
                                                onError={(e) => { e.target.style.display = 'none'; }} />
                                        )}
                                    </Stack>
                                ) : (
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        {organisation?.logo ? (
                                            <Box component="img" src={organisation.logo}
                                                sx={{ width: 80, height: 80, borderRadius: '12px', objectFit: 'cover', border: '2px solid #e5e7eb' }}
                                                onError={(e) => e.target.style.display = 'none'} />
                                        ) : (
                                            <Box sx={{ width: 80, height: 80, borderRadius: '12px', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e2e8f0' }}>
                                                <Typography variant="caption" color="text.secondary" textAlign="center">No Logo</Typography>
                                            </Box>
                                        )}
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Logo URL</Typography>
                                            <Typography fontWeight={600} variant="body2" sx={{ wordBreak: 'break-all', maxWidth: 300 }}>
                                                {organisation?.logo || '—'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                )}
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ mb: 1 }}>
                                    <Chip label="Basic Info" size="small" />
                                </Divider>
                            </Grid>

                            {/* ── Basic Fields ─────────────────────── */}
                            {infoFields.map((field) => (
                                <Grid item xs={12} sm={field.xs} key={field.name}>
                                    {editOrg ? (
                                        <TextField fullWidth size="small" label={field.label}
                                            name={field.name} type={field.type || 'text'}
                                            required={field.required}
                                            value={orgForm[field.name] || ''}
                                            onChange={(e) => setOrgForm((p) => ({ ...p, [e.target.name]: e.target.value }))}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                                    ) : (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">{field.label.replace(' *','')}</Typography>
                                            <Typography fontWeight={600}>{orgForm[field.name] || '—'}</Typography>
                                        </Box>
                                    )}
                                </Grid>
                            ))}

                            {/* ── Address full width ───────────────── */}
                            <Grid item xs={12}>
                                {editOrg ? (
                                    <TextField fullWidth size="small" label="Address" name="address" multiline rows={2}
                                        value={orgForm.address || ''}
                                        onChange={(e) => setOrgForm((p) => ({ ...p, address: e.target.value }))}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                                ) : (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Address</Typography>
                                        <Typography fontWeight={600}>{orgForm.address || '—'}</Typography>
                                    </Box>
                                )}
                            </Grid>

                            {/* ── Plan — read only ─────────────────── */}
                            <Grid item xs={12}>
                                <Divider sx={{ mb: 1 }}>
                                    <Chip label="Plan" size="small" />
                                </Divider>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    {['free','basic','pro'].map((p) => (
                                        <Chip key={p} label={p.toUpperCase()}
                                            variant={organisation?.plan === p ? 'filled' : 'outlined'}
                                            sx={{
                                                fontWeight: 700,
                                                bgcolor: organisation?.plan === p
                                                    ? (p === 'pro' ? '#7c3aed' : p === 'basic' ? '#2563eb' : '#16a34a')
                                                    : 'transparent',
                                                color: organisation?.plan === p ? '#fff' : 'text.secondary',
                                                borderColor: p === 'pro' ? '#7c3aed' : p === 'basic' ? '#2563eb' : '#16a34a',
                                            }} />
                                    ))}
                                    <Typography variant="caption" color="text.secondary">
                                        (Plan change ke liye admin se contact karein)
                                    </Typography>
                                </Stack>
                            </Grid>
                        </Grid>

                        {editOrg && (
                            <Stack direction="row" justifyContent="flex-end" mt={3}>
                                <GradientButton onClick={handleOrgUpdate} startIcon={<SaveIcon />}>
                                    Save Changes
                                </GradientButton>
                            </Stack>
                        )}
                    </CardContent>
                </GlassCard>
            )}

            {/* ── Tab 1 — Members ──────────────────────────── */}
            {tab === 1 && (
                <GlassCard>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                            <Typography fontWeight={700} variant="h6">Team Members</Typography>
                            {isOwner && (
                                <GradientButton startIcon={<AddIcon />} onClick={() => { setMemberForm(emptyMember); setMemberDialog(true); }}>
                                    Add Member
                                </GradientButton>
                            )}
                        </Stack>

                        {isLoading ? (
                            <Box textAlign="center" py={4}><CircularProgress /></Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'rgba(99,102,241,0.04)' }}>
                                            {['Member','Email','Role','Status','Joined','Actions'].map((h) => (
                                                <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {members?.map((m) => (
                                            <TableRow key={m.user?.id || m.id} hover>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <Avatar sx={{ bgcolor: m.role?.color || '#6366f1', width: 34, height: 34, fontSize: 13 }}>
                                                            {m.user?.name?.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography fontWeight={600} variant="body2">{m.user?.name}</Typography>
                                                            {m.user?.id === user?.id && (
                                                                <Chip label="You" size="small" sx={{ height: 16, fontSize: 10, bgcolor: '#eef2ff', color: '#6366f1' }} />
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell><Typography variant="body2" color="text.secondary">{m.user?.email}</Typography></TableCell>
                                                <TableCell>
                                                    {isOwner && m.user?.id !== user?.id ? (
                                                        <FormControl size="small" sx={{ minWidth: 140 }}>
                                                            <Select value={m.role?.id || ''} onChange={(e) => handleRoleChange(m.user?.id, e.target.value)} sx={{ borderRadius: '8px', fontSize: 13 }}>
                                                                {roles.filter((r) => r.name !== 'super_admin').map((r) => (
                                                                    <MenuItem key={r.id} value={r.id}>
                                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: r.color }} />
                                                                            <span>{r.label}</span>
                                                                        </Stack>
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    ) : (
                                                        m.role
                                                            ? <Chip label={m.role.label} size="small" sx={{ bgcolor: m.role.color + '20', color: m.role.color, fontWeight: 600 }} />
                                                            : <Chip label="Owner" size="small" sx={{ bgcolor: '#7c3aed20', color: '#7c3aed', fontWeight: 700 }} />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={m.is_active ? 'Active' : 'Inactive'} size="small"
                                                        sx={{ bgcolor: m.is_active ? '#dcfce7' : '#fee2e2', color: m.is_active ? '#16a34a' : '#dc2626', fontWeight: 600 }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" color="text.secondary">{m.joined_at || '—'}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {isOwner && m.user?.id !== user?.id && (
                                                        <Stack direction="row" spacing={0.5}>
                                                            <Tooltip title={m.is_active ? 'Deactivate' : 'Activate'}>
                                                                <IconButton size="small" onClick={() => handleToggle(m.user?.id)} sx={{ color: m.is_active ? '#f59e0b' : '#16a34a' }}>
                                                                    {m.is_active ? <DeactivateIcon sx={{ fontSize: 18 }} /> : <ActivateIcon sx={{ fontSize: 18 }} />}
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Remove">
                                                                <IconButton size="small" onClick={() => setDeleteDialog(m.user?.id)} sx={{ color: '#ef4444' }}>
                                                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </GlassCard>
            )}

            {/* Add Member Dialog */}
            <Dialog open={memberDialog} onClose={() => setMemberDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    <Typography fontWeight={700}>👥 Add Team Member</Typography>
                    <IconButton size="small" onClick={() => setMemberDialog(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <Box component="form" onSubmit={handleAddMember}>
                    <DialogContent sx={{ pt: 3 }}>
                        {formErr && <Alert severity="error" sx={{ mb: 2 }}>{formErr}</Alert>}
                        <Stack spacing={2}>
                            {[
                                { label: 'Full Name *',  name: 'name',     required: true },
                                { label: 'Email *',      name: 'email',    type: 'email', required: true },
                                { label: 'Phone',        name: 'phone' },
                                { label: 'Password *',   name: 'password', type: 'password', required: true },
                            ].map((f) => (
                                <TextField key={f.name} fullWidth size="small" label={f.label}
                                    name={f.name} type={f.type || 'text'} required={f.required}
                                    value={memberForm[f.name]}
                                    onChange={(e) => setMemberForm((p) => ({ ...p, [f.name]: e.target.value }))}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            ))}
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Role *</InputLabel>
                                <Select value={memberForm.role_id} label="Role *"
                                    onChange={(e) => setMemberForm((p) => ({ ...p, role_id: e.target.value }))}
                                    sx={{ borderRadius: '10px' }}>
                                    {roles.filter((r) => r.name !== 'super_admin').map((r) => (
                                        <MenuItem key={r.id} value={r.id}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: r.color }} />
                                                <span>{r.label}</span>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button onClick={() => setMemberDialog(false)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                        <GradientButton type="submit" disabled={actionLoading} startIcon={<AddIcon />}>
                            {actionLoading ? 'Adding...' : 'Add Member'}
                        </GradientButton>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Remove Confirm */}
            <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Remove Member?</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary">Yeh member organisation se remove ho jaayega.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialog(null)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <Button onClick={handleRemove} variant="contained" color="error" sx={{ borderRadius: '10px' }}>Remove</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
