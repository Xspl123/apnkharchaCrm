import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getUsers, createUser, updateUser,
    toggleUserActive, deleteUser,
} from '../state/userSlice';
import { getRoles } from '../state/roleSlice';
import usePermission from '../../../hooks/usePermission';
import {
    Box, Card, CardContent, Typography, Button, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TablePagination, IconButton, Chip, Avatar, Stack,
    Select, MenuItem, FormControl, InputLabel, Switch,
    FormControlLabel, Tooltip, InputAdornment, Alert,
    CircularProgress,
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Search as SearchIcon, People as PeopleIcon,
    Close as CloseIcon,
    Save as SaveIcon, PersonOff as PersonOffIcon,
    PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

// ── Styled ────────────────────────────────────────────────
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
    '&:hover': { opacity: 0.9, transform: 'translateY(-1px)' },
    '&:disabled': { background: '#ccc', color: '#fff' },
    transition: 'all 0.2s',
}));

// ── Role color helper ─────────────────────────────────────
const getRoleChip = (role) => {
    if (!role) return <Chip label="No Role" size="small" sx={{ bgcolor: '#e5e7eb', color: '#6b7280' }} />;
    return (
        <Chip
            label={role.label}
            size="small"
            sx={{ bgcolor: role.color + '20', color: role.color, fontWeight: 600, border: `1px solid ${role.color}40` }}
        />
    );
};

const emptyForm = {
    name: '', email: '', phone: '', password: '',
    password_confirmation: '', role_id: '', is_active: true, invoice_prefix: 'INV',
};

const getLastLogin = (user) =>
    user.last_login_history?.logged_in_at ||
    user.last_login_at ||
    user.last_login ||
    null;

const formatLastLogin = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

export default function UserManagement() {
    const dispatch = useDispatch();
    const { users, isLoading } = useSelector((s) => s.users);
    const { roles }                   = useSelector((s) => s.roles);
    const { can }                     = usePermission();

    const [search,    setSearch]    = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [dialog,    setDialog]    = useState(false);
    const [editMode,  setEditMode]  = useState(false);
    const [editId,    setEditId]    = useState(null);
    const [formData,  setFormData]  = useState(emptyForm);
    const [formError, setFormError] = useState('');
    const [deleteDialog, setDeleteDialog] = useState(null);
    const [saving,    setSaving]    = useState(false);

    useEffect(() => {
        dispatch(getUsers());
        dispatch(getRoles());
    }, [dispatch]);

    useEffect(() => {
        setPage(0);
    }, [search, roleFilter]);

    // ── Filter ────────────────────────────────────────────
    const filtered = users.filter((u) => {
        const matchSearch = !search ||
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());
        const matchRole = !roleFilter || u.role?.id === Number(roleFilter);
        return matchSearch && matchRole;
    });
    const paginatedUsers = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    useEffect(() => {
        const lastPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
        if (page > lastPage) setPage(lastPage);
    }, [filtered.length, page, rowsPerPage]);

    // ── Handlers ──────────────────────────────────────────
    const handleOpenCreate = () => {
        setFormData(emptyForm);
        setEditMode(false);
        setEditId(null);
        setFormError('');
        setDialog(true);
    };

    const handleOpenEdit = (user) => {
        setFormData({
            name:     user.name,
            email:    user.email,
            phone:    user.phone || '',
            password: '',
            password_confirmation: '',
            role_id:  user.role?.id || '',
            is_active: user.is_active,
            invoice_prefix: user.invoice_prefix || 'INV',
        });
        setEditMode(true);
        setEditId(user.id);
        setFormError('');
        setDialog(true);
    };

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!editMode && formData.password !== formData.password_confirmation) {
            setFormError('Passwords do not match!');
            return;
        }

        setSaving(true);
        try {
            if (editMode) {
                const payload = { ...formData };
                if (!payload.password) { delete payload.password; delete payload.password_confirmation; }
                await dispatch(updateUser({ id: editId, data: payload })).unwrap();
            } else {
                await dispatch(createUser(formData)).unwrap();
            }
            setDialog(false);
            dispatch(getUsers());
        } catch (err) {
            setFormError(err || 'Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id) => {
        await dispatch(toggleUserActive(id));
    };

    const handleDelete = async () => {
        await dispatch(deleteUser(deleteDialog));
        setDeleteDialog(null);
    };

         // ── Group roles by org (for grouped card view) ────────────
                const rolesByOrg = roles.reduce((acc, r) => {
                    const key = r.org_id ? `org-${r.org_id}` : 'platform';
                    const label = r.org_id ? r.org_name : 'Platform';
                    if (!acc[key]) acc[key] = { label, roles: [] };
                    acc[key].roles.push(r);
                    return acc;
                }, {});

                const isMultiOrgView = Object.keys(rolesByOrg).length > 1;

                console.log('DEBUG roles.length:', roles.length);
                console.log('DEBUG rolesByOrg keys:', Object.keys(rolesByOrg));
                console.log('DEBUG isMultiOrgView:', isMultiOrgView);
                console.log('DEBUG sample role:', roles[5]);

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 }, minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard sx={{ mb: 3, background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff' }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PeopleIcon /> User Management
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                Manage users, roles, and access control
                            </Typography>
                        </Box>
                        <Chip label={`${users.length} Users`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }} />
                    </CardContent>
                </GlassCard>
            </motion.div>

            {/* Stats */}
{isMultiOrgView ? (
            <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: { xs: 1.5, sm: 2.5 }, minWidth: 0, justifyItems: 'center' }}>
        {Object.entries(rolesByOrg).map(([key, group]) => {
            const totalUsers = group.roles.reduce(
                (sum, r) => sum + users.filter((u) => u.role?.id === r.id).length, 0
            );
            const isPlatform = key === 'platform';
            return (
                <GlassCard
                    key={key}
                    sx={{
                        width: '100%',
                        minWidth: 0,
                        maxWidth: 320,
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 28px rgba(0,0,0,0.12)' },
                    }}
                >
                    <Box
                        sx={{
                            px: { xs: 1.75, sm: 2.5 }, py: 1.75,
                            background: isPlatform
                                ? 'linear-gradient(135deg,#374151,#1f2937)'
                                : 'linear-gradient(135deg,#667eea,#764ba2)',
                            color: '#fff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <Typography fontWeight={700} variant="subtitle1" sx={{ minWidth: 0, flex: 1, overflowWrap: 'anywhere' }}>
                            {group.label}
                        </Typography>
                        <Chip
                            label={totalUsers}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.25)',
                                color: '#fff',
                                fontWeight: 700,
                                height: 22,
                            }}
                        />
                    </Box>
                    <CardContent sx={{ px: { xs: 1.75, sm: 2.5 }, py: 2, minWidth: 0 }}>
                        <Stack spacing={1.1} divider={<Box sx={{ borderBottom: '1px solid #f1f1f4' }} />}>
                            {group.roles.map((r) => {
                                const count = users.filter((u) => u.role?.id === r.id).length;
                                return (
                                    <Stack key={r.id} direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                                            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: r.color, flexShrink: 0 }} />
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>{r.label}</Typography>
                                        </Stack>
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                            sx={{
                                                color: count > 0 ? r.color : '#c1c5cd',
                                                minWidth: 20,
                                                textAlign: 'right',
                                            }}
                                        >
                                            {count}
                                        </Typography>
                                    </Stack>
                                );
                            })}
                        </Stack>
                    </CardContent>
                </GlassCard>
            );
        })}
    </Box>
) : (
    <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 2, minWidth: 0, justifyItems: 'center' }}>
        {roles.map((r) => (
            <GlassCard key={r.id} sx={{ width: '100%', minWidth: 0 }}>
                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                    <Typography variant="h4" fontWeight={800} sx={{ color: r.color }}>
                        {users.filter((u) => u.role?.id === r.id).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{r.label}</Typography>
                </CardContent>
            </GlassCard>
        ))}
    </Box>
)}

            {/* Filters + Add */}
            <GlassCard sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <TextField
                            fullWidth
                            size="small" placeholder="Search by name or email..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
                            sx={{ width: '100%', minWidth: 0, flex: { sm: 1 }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                        <FormControl fullWidth size="small" sx={{ minWidth: { sm: 160 }, width: { sm: 'auto' } }}>
                            <InputLabel>Filter by Role</InputLabel>
                            <Select value={roleFilter} label="Filter by Role"
                                onChange={(e) => setRoleFilter(e.target.value)}
                                sx={{ borderRadius: '10px' }}>
                                <MenuItem value="">All Roles</MenuItem>
                                {roles.map((r) => (
                                    <MenuItem key={r.id} value={r.id}>
                                        {r.label}{r.org_name ? ` — ${r.org_name}` : ''}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {can('users.create') && (
                            <GradientButton startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}>
                                Add User
                            </GradientButton>
                        )}
                    </Stack>
                </CardContent>
            </GlassCard>

            {/* Table */}
            <GlassCard>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(102,126,234,0.06)' }}>
                                {['#', 'User', 'Email', 'Role', 'Status', 'Created', 'Last Login', 'Actions'].map((h) => (
                                    <TableCell key={h} sx={{ fontWeight: 700, color: '#374151' }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : paginatedUsers.map((user, i) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Avatar sx={{ bgcolor: user.role?.color || '#6366f1', width: 36, height: 36, fontSize: 14 }}>
                                                {user.name?.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography fontWeight={600} variant="body2">{user.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{user.phone || '—'}</Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{user.email}</Typography>
                                    </TableCell>
                                    <TableCell>{getRoleChip(user.role)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.is_active ? 'Active' : 'Inactive'}
                                            size="small"
                                            sx={{
                                                bgcolor: user.is_active ? '#dcfce7' : '#fee2e2',
                                                color:   user.is_active ? '#16a34a' : '#dc2626',
                                                fontWeight: 600,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {user.created_at}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatLastLogin(getLastLogin(user))}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5}>
                                            {can('users.edit') && (
                                                <>
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={() => handleOpenEdit(user)}
                                                            sx={{ color: '#6366f1' }}>
                                                            <EditIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={user.is_active ? 'Deactivate' : 'Activate'}>
                                                        <IconButton size="small" onClick={() => handleToggle(user.id)}
                                                            sx={{ color: user.is_active ? '#f59e0b' : '#16a34a' }}>
                                                            {user.is_active
                                                                ? <PersonOffIcon sx={{ fontSize: 18 }} />
                                                                : <PersonAddIcon sx={{ fontSize: 18 }} />}
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                            {can('users.delete') && (
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" onClick={() => setDeleteDialog(user.id)}
                                                        sx={{ color: '#ef4444' }}>
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={filtered.length}
                    page={page}
                    onPageChange={(_, nextPage) => setPage(nextPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(Number(event.target.value));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    labelRowsPerPage="Per page:"
                    sx={{
                        borderTop: '1px solid rgba(0,0,0,0.08)',
                        '.MuiTablePagination-toolbar': { px: { xs: 1, sm: 2 }, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-end' } },
                    }}
                />
            </GlassCard>

            {/* Add/Edit Dialog */}
            <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid #e5e7eb', pb: 2 }}>
                    <Typography fontWeight={700}>{editMode ? 'Edit User' : 'Add New User'}</Typography>
                    <IconButton onClick={() => setDialog(false)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <Box component="form" onSubmit={handleSubmit}>
                    <DialogContent sx={{ pt: 3 }}>
                        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                        <Stack spacing={2}>
                            <TextField fullWidth size="small" label="Full Name *"
                                name="name" value={formData.name} onChange={handleChange} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <TextField fullWidth size="small" label="Email *"
                                name="email" type="email" value={formData.email} onChange={handleChange} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <TextField fullWidth size="small" label="Phone"
                                name="phone" value={formData.phone} onChange={handleChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <TextField fullWidth size="small"
                                label={editMode ? 'New Password (leave blank to keep)' : 'Password *'}
                                name="password" type="password" value={formData.password}
                                onChange={handleChange} required={!editMode}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <TextField fullWidth size="small" label="Confirm Password"
                                name="password_confirmation" type="password"
                                value={formData.password_confirmation} onChange={handleChange}
                                required={!editMode && !!formData.password}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Role *</InputLabel>
                                <Select name="role_id" value={formData.role_id} label="Role *"
                                    onChange={handleChange} sx={{ borderRadius: '10px' }}>
                                    {roles.map((r) => (
                                        <MenuItem key={r.id} value={r.id}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: r.color }} />
                                                <span>{r.label}{r.org_name ? ` — ${r.org_name}` : ''}</span>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField fullWidth size="small" label="Invoice Prefix"
                                name="invoice_prefix" value={formData.invoice_prefix} onChange={handleChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <FormControlLabel
                                control={<Switch checked={formData.is_active} onChange={handleChange} name="is_active" color="success" />}
                                label="Active User"
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button variant="outlined" onClick={() => setDialog(false)}
                            startIcon={<CloseIcon />} sx={{ borderRadius: '10px' }}>
                            Cancel
                        </Button>
                        <GradientButton type="submit" disabled={saving} startIcon={<SaveIcon />}>
                            {saving ? 'Saving...' : editMode ? 'Update User' : 'Create User'}
                        </GradientButton>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle fontWeight={700}>Delete User?</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary">
                        This user will be permanently deleted. Are you sure?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialog(null)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <Button onClick={handleDelete} variant="contained" color="error"
                        sx={{ borderRadius: '10px' }}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
