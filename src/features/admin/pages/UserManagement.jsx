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
    TableRow, IconButton, Chip, Avatar, Stack,
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

export default function UserManagement() {
    const dispatch = useDispatch();
    const { users, isLoading } = useSelector((s) => s.users);
    const { roles }                   = useSelector((s) => s.roles);
    const { can }                     = usePermission();

    const [search,    setSearch]    = useState('');
    const [roleFilter, setRoleFilter] = useState('');
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

    // ── Filter ────────────────────────────────────────────
    const filtered = users.filter((u) => {
        const matchSearch = !search ||
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());
        const matchRole = !roleFilter || u.role?.id === Number(roleFilter);
        return matchSearch && matchRole;
    });

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

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard sx={{ mb: 3, background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff' }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
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
            <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
                {roles.map((r) => (
                    <GlassCard key={r.id} sx={{ flex: '1 1 150px', minWidth: 140 }}>
                        <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                            <Typography variant="h4" fontWeight={800} sx={{ color: r.color }}>
                                {users.filter((u) => u.role?.id === r.id).length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{r.label}</Typography>
                        </CardContent>
                    </GlassCard>
                ))}
            </Stack>

            {/* Filters + Add */}
            <GlassCard sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        <TextField
                            size="small" placeholder="Search by name or email..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
                            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Filter by Role</InputLabel>
                            <Select value={roleFilter} label="Filter by Role"
                                onChange={(e) => setRoleFilter(e.target.value)}
                                sx={{ borderRadius: '10px' }}>
                                <MenuItem value="">All Roles</MenuItem>
                                {roles.map((r) => (
                                    <MenuItem key={r.id} value={r.id}>{r.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {can('users.create') && (
                            <GradientButton startIcon={<AddIcon />} onClick={handleOpenCreate}>
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
                                {['#', 'User', 'Email', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                                    <TableCell key={h} sx={{ fontWeight: 700, color: '#374151' }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((user, i) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>{i + 1}</TableCell>
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
                                                <span>{r.label}</span>
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
                        Yeh user permanently delete ho jaayega. Kya aap sure hain?
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
