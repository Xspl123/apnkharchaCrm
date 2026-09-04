import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAllOrgs, fetchAllUsers, fetchOrgUsers,
    toggleOrgStatus, changeOrgPlan, clearOrgUsers,
} from '../../redux/features/superAdminSlice';
import {
    Box, Card, CardContent, Typography, Grid, Stack, Avatar,
    Chip, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, CircularProgress, Alert, IconButton, Tooltip,
    TextField, InputAdornment, Select, MenuItem, FormControl,
    InputLabel, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, Tabs, Tab,
} from '@mui/material';
import {
    Business as OrgIcon, People as PeopleIcon,
    TrendingUp as TrendingIcon, Search as SearchIcon,
    Refresh as RefreshIcon, ToggleOn as ActivateIcon,
    ToggleOff as DeactivateIcon, Visibility as ViewIcon,
    AdminPanelSettings as AdminIcon,
    Close as CloseIcon, Paid as PaidIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const GlassCard = styled(Card)(() => ({
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    border: '1px solid rgba(255,255,255,0.3)',
}));

const StatCard = styled(Card)(({ color }) => ({
    borderRadius: '16px',
    background: `linear-gradient(135deg, ${color}15, ${color}08)`,
    border: `1px solid ${color}25`,
    boxShadow: 'none',
}));

const PLAN_CONFIG = {
    free:    { label: 'Free',       color: '#94a3b8', bg: '#f1f5f9' },
    basic:   { label: 'Starter',    color: '#f59e0b', bg: '#fef3c7' },
    premium: { label: 'Enterprise', color: '#10b981', bg: '#d1fae5' },
};

export default function SuperAdminDashboard() {
    const dispatch = useDispatch();
    const { user } = useSelector((s) => s.auth);
    const { orgs , users, orgUsers, isLoading, orgUsersLoading, error } = useSelector((s) => s.superAdmin);

    const [tab,         setTab]         = useState(0);
    const [search,      setSearch]      = useState('');
    const [planFilter,  setPlanFilter]  = useState('');
    const [orgDialog,   setOrgDialog]   = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [localError,  setLocalError]  = useState('');

    const loadData = useCallback(() => {
        dispatch(fetchAllOrgs());
        dispatch(fetchAllUsers());
    }, [dispatch]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleToggle = (orgId) => {
        dispatch(toggleOrgStatus(orgId))
            .unwrap()
            .catch(() => setLocalError('Toggle failed'));
    };

    const handlePlanChange = (orgId, plan) => {
        dispatch(changeOrgPlan({ orgId, plan }))
            .unwrap()
            .catch(() => setLocalError('Plan change failed'));
    };

    const handleViewOrg = (org) => {
        setSelectedOrg(org);
        setOrgDialog(true);
        dispatch(clearOrgUsers());
        dispatch(fetchOrgUsers(org.id));
    };

    // ── Filtered ──────────────────────────────────────────
    const filteredOrgs = orgs.filter((o) => {
        const matchSearch = !search ||
            o.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.owner?.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.owner?.email?.toLowerCase().includes(search.toLowerCase());
        const matchPlan = !planFilter || o.plan === planFilter;
        return matchSearch && matchPlan;
    });

    const filteredUsers = users.filter((u) =>
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    // ── Stats ─────────────────────────────────────────────
    const statCards = [
        { label: 'Total Orgs',     value: orgs.length,                                              color: '#6366f1', icon: <OrgIcon /> },
        { label: 'Active Orgs',    value: orgs.filter((o) => o.is_active).length,                   color: '#16a34a', icon: <ActivateIcon /> },
        { label: 'Paid Customers', value: orgs.filter((o) => ['basic','premium'].includes(o.plan)).length, color: '#f59e0b', icon: <PaidIcon /> },
        { label: 'Total Users',    value: users.length,                                              color: '#0891b2', icon: <PeopleIcon /> },
        { label: 'Org Users',      value: users.filter((u) => u.org_id).length,                     color: '#7c3aed', icon: <AdminIcon /> },
        { label: 'Personal Users', value: users.filter((u) => !u.org_id).length,                    color: '#dc2626', icon: <TrendingIcon /> },
    ];

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard sx={{ mb: 3, background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', color: '#fff' }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h5" fontWeight={700} display="flex" alignItems="center" gap={1}>
                                <AdminIcon /> Super Admin Dashboard
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                                Welcome, {user?.name} · Platform Overview
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label="Super Admin" sx={{ bgcolor: '#7c3aed', color: '#fff', fontWeight: 700 }} />
                            <Tooltip title="Refresh">
                                <IconButton onClick={loadData} sx={{ color: '#fff' }}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </CardContent>
                </GlassCard>
            </motion.div>

            {(error || localError) && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError('')}>
                    {error || localError}
                </Alert>
            )}

            {/* Stat Cards */}
            <Grid container spacing={2} mb={3}>
                {statCards.map((s, i) => (
                    <Grid item xs={6} sm={4} md={2} key={s.label}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <StatCard color={s.color}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>
                                                {isLoading ? '—' : s.value}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                {s.label}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ color: s.color, opacity: 0.7 }}>{s.icon}</Box>
                                    </Stack>
                                </CardContent>
                            </StatCard>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {/* Search + Filter */}
            <GlassCard sx={{ mb: 2 }}>
                <CardContent sx={{ py: 1.5 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        <TextField size="small" placeholder="Search name, email, org..."
                            value={search} onChange={(e) => { setSearch(e.target.value); }}
                            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }} />
                        {tab === 0 && (
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Plan Filter</InputLabel>
                                <Select value={planFilter} label="Plan Filter"
                                    onChange={(e) => setPlanFilter(e.target.value)}
                                    sx={{ borderRadius: '10px' }}>
                                    <MenuItem value="">All Plans</MenuItem>
                                    <MenuItem value="free">Free</MenuItem>
                                    <MenuItem value="basic">Starter ₹299</MenuItem>
                                    <MenuItem value="premium">Enterprise ₹499</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                    </Stack>
                </CardContent>
            </GlassCard>

            {/* Tabs */}
            <GlassCard sx={{ mb: 2 }}>
                <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch(''); }} sx={{ px: 2 }}>
                    <Tab label={`🏢 Organisations (${filteredOrgs.length})`} />
                    <Tab label={`👥 All Users (${filteredUsers.length})`} />
                </Tabs>
            </GlassCard>

            {isLoading ? (
                <Box textAlign="center" py={6}><CircularProgress /></Box>
            ) : (
                <>
                    {/* Organisations Tab */}
                    {tab === 0 && (
                        <GlassCard>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'rgba(99,102,241,0.04)' }}>
                                            {['#','Organisation','Owner','Plan','Members','Status','Actions'].map((h) => (
                                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredOrgs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 5, color: '#94a3b8' }}>
                                                    <OrgIcon sx={{ fontSize: 40, mb: 1, display: 'block', mx: 'auto', opacity: 0.3 }} />
                                                    No organisations found
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredOrgs.map((org, i) => {
                                            const plan = PLAN_CONFIG[org.plan] || PLAN_CONFIG.free;
                                            return (
                                                <TableRow key={org.id} hover>
                                                    <TableCell sx={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                                            {org.logo ? (
                                                                <Box component="img" src={org.logo}
                                                                    sx={{ width: 36, height: 36, borderRadius: '8px', objectFit: 'cover' }} />
                                                            ) : (
                                                                <Avatar sx={{ bgcolor: '#6366f1', width: 36, height: 36, fontSize: 14, borderRadius: '8px' }}>
                                                                    {org.name?.charAt(0)}
                                                                </Avatar>
                                                            )}
                                                            <Box>
                                                                <Typography fontWeight={600} variant="body2">{org.name}</Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {[org.city, org.country].filter(Boolean).join(', ') || '—'}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>{org.owner?.name || '—'}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{org.owner?.email}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {/* Inline plan change */}
                                                        <FormControl size="small">
                                                            <Select value={org.plan || 'free'}
                                                                onChange={(e) => handlePlanChange(org.id, e.target.value)}
                                                                sx={{ borderRadius: '8px', fontSize: 12, fontWeight: 700,
                                                                    color: plan.color,
                                                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: plan.color + '40' } }}>
                                                                <MenuItem value="free">Free</MenuItem>
                                                                <MenuItem value="basic">Starter ₹299</MenuItem>
                                                                <MenuItem value="premium">Enterprise ₹499</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={org.members_count ?? 0} size="small"
                                                            sx={{ bgcolor: '#eef2ff', color: '#6366f1', fontWeight: 700 }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={org.is_active ? 'Active' : 'Inactive'} size="small"
                                                            sx={{ bgcolor: org.is_active ? '#dcfce7' : '#fee2e2',
                                                                color: org.is_active ? '#16a34a' : '#dc2626', fontWeight: 600 }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={0.5}>
                                                            <Tooltip title="View Members">
                                                                <IconButton size="small" onClick={() => handleViewOrg(org)} sx={{ color: '#6366f1' }}>
                                                                    <ViewIcon sx={{ fontSize: 18 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title={org.is_active ? 'Deactivate' : 'Activate'}>
                                                                <IconButton size="small"
                                                                    onClick={() => handleToggle(org.id)}
                                                                    sx={{ color: org.is_active ? '#f59e0b' : '#16a34a' }}>
                                                                    {org.is_active
                                                                        ? <DeactivateIcon sx={{ fontSize: 18 }} />
                                                                        : <ActivateIcon   sx={{ fontSize: 18 }} />}
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </GlassCard>
                    )}

                    {/* All Users Tab */}
                    {tab === 1 && (
                        <GlassCard>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'rgba(99,102,241,0.04)' }}>
                                            {['#','User','Email','Type','Organisation','Role','Status'].map((h) => (
                                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 5, color: '#94a3b8' }}>No users found</TableCell>
                                            </TableRow>
                                        ) : filteredUsers.map((u, i) => (
                                            <TableRow key={u.id} hover>
                                                <TableCell sx={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Avatar sx={{ width: 30, height: 30, fontSize: 12,
                                                            bgcolor: u.role?.color || '#6366f1' }}>
                                                            {u.name?.charAt(0)}
                                                        </Avatar>
                                                        <Typography fontWeight={600} variant="body2">{u.name}</Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip size="small" fontWeight={600}
                                                        label={u.user_type === 'org_owner'   ? 'Org Owner'
                                                             : u.user_type === 'org_member'  ? 'Member'
                                                             : 'Personal'}
                                                        sx={{
                                                            bgcolor: u.user_type === 'org_owner'  ? '#f5f3ff'
                                                                   : u.user_type === 'org_member' ? '#ecfeff'
                                                                   : '#f1f5f9',
                                                            color:   u.user_type === 'org_owner'  ? '#7c3aed'
                                                                   : u.user_type === 'org_member' ? '#0891b2'
                                                                   : '#64748b',
                                                            fontWeight: 600, fontSize: 11,
                                                        }} />
                                                </TableCell>
                                                <TableCell>
                                                    {u.organisation
                                                        ? <Typography variant="body2" fontWeight={600}>{u.organisation.name}</Typography>
                                                        : <Typography variant="caption" color="text.secondary">—</Typography>}
                                                </TableCell>
                                                <TableCell>
                                                    {u.role
                                                        ? <Chip label={u.role.label} size="small"
                                                            sx={{ bgcolor: u.role.color + '20', color: u.role.color, fontWeight: 600, fontSize: 11 }} />
                                                        : <Chip label="No Role" size="small" sx={{ bgcolor: '#f1f5f9', color: '#94a3b8', fontSize: 11 }} />}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={u.is_active ? 'Active' : 'Inactive'} size="small"
                                                        sx={{ bgcolor: u.is_active ? '#dcfce7' : '#fee2e2',
                                                            color: u.is_active ? '#16a34a' : '#dc2626', fontWeight: 600 }} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </GlassCard>
                    )}
                </>
            )}

            {/* Org Detail Dialog */}
            <Dialog open={orgDialog} onClose={() => { setOrgDialog(false); dispatch(clearOrgUsers()); }}
                maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <OrgIcon sx={{ color: '#6366f1' }} />
                        <Typography fontWeight={700}>{selectedOrg?.name}</Typography>
                        <Chip size="small" label={PLAN_CONFIG[selectedOrg?.plan]?.label || 'Free'}
                            sx={{ bgcolor: (PLAN_CONFIG[selectedOrg?.plan] || PLAN_CONFIG.free).bg,
                                color:   (PLAN_CONFIG[selectedOrg?.plan] || PLAN_CONFIG.free).color, fontWeight: 700 }} />
                        <Chip size="small" label={selectedOrg?.is_active ? 'Active' : 'Inactive'}
                            sx={{ bgcolor: selectedOrg?.is_active ? '#dcfce7' : '#fee2e2',
                                color: selectedOrg?.is_active ? '#16a34a' : '#dc2626', fontWeight: 600 }} />
                    </Stack>
                    <IconButton size="small" onClick={() => { setOrgDialog(false); dispatch(clearOrgUsers()); }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5 }}>
                    {/* Org Info */}
                    <Grid container spacing={2} mb={2.5}>
                        {[
                            { label: 'Email',      value: selectedOrg?.email      || '—' },
                            { label: 'Phone',      value: selectedOrg?.phone      || '—' },
                            { label: 'City',       value: selectedOrg?.city       || '—' },
                            { label: 'GST Number', value: selectedOrg?.gst_number || '—' },
                            { label: 'Owner',      value: selectedOrg?.owner?.name || '—' },
                            { label: 'Members',    value: selectedOrg?.members_count ?? '—' },
                        ].map((f) => (
                            <Grid item xs={6} sm={4} key={f.label}>
                                <Typography variant="caption" color="text.secondary" display="block">{f.label}</Typography>
                                <Typography fontWeight={600} variant="body2">{f.value}</Typography>
                            </Grid>
                        ))}
                    </Grid>

                    <Typography fontWeight={700} mb={1.5}>
                        Members {orgUsersLoading && <CircularProgress size={14} sx={{ ml: 1 }} />}
                    </Typography>
                    <TableContainer sx={{ borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    {['Name','Email','Role','Status'].map((h) => (
                                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orgUsers.map((m) => (
                                    <TableRow key={m.id} hover>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: '#6366f1' }}>
                                                    {m.name?.charAt(0)}
                                                </Avatar>
                                                <Typography variant="body2">{m.name}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell><Typography variant="caption" color="text.secondary">{m.email}</Typography></TableCell>
                                        <TableCell>
                                            {m.user_type === 'org_owner'
                                                ? <Chip label="Owner" size="small" sx={{ bgcolor: '#f5f3ff', color: '#7c3aed', fontWeight: 700, fontSize: 10 }} />
                                                : m.role
                                                    ? <Chip label={m.role.label} size="small" sx={{ bgcolor: m.role.color + '20', color: m.role.color, fontWeight: 600, fontSize: 10 }} />
                                                    : <Chip label="No Role" size="small" sx={{ fontSize: 10 }} />}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={m.is_active ? 'Active' : 'Inactive'} size="small"
                                                sx={{ bgcolor: m.is_active ? '#dcfce7' : '#fee2e2',
                                                    color: m.is_active ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: 10 }} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!orgUsersLoading && orgUsers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 2, color: '#94a3b8' }}>No members</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => { setOrgDialog(false); dispatch(clearOrgUsers()); }}
                        sx={{ borderRadius: '10px', textTransform: 'none' }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
