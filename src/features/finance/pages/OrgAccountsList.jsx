import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    getOrgAccounts,
    getOrgAccountSummary,
    createOrgAccount,
    updateOrgAccount,
    deleteOrgAccount,
    resetFinance,
} from '../state/orgFinanceSlice';
import {
    Box, Container, Grid, Card, CardContent, Typography, Paper, Stack,
    Button, IconButton, Avatar, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
    InputAdornment, Tooltip, Snackbar, Alert, CircularProgress,
    Divider, FormControlLabel, Switch,
} from '@mui/material';
import {
    AccountBalance as BankIcon,
    Payments as CashIcon,
    QrCode2 as UpiIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    AccountBalanceWallet as WalletIcon,
    ReceiptLong as StatementIcon,
    Star as DefaultIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled, useTheme } from '@mui/material/styles';

const GlassCard = styled(Card)(({ theme }) => ({
    background: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.06)',
    border: `1px solid ${theme.palette.divider}`,
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.palette.mode === 'dark' ? '0 12px 40px rgba(0,0,0,0.4)' : '0 12px 40px rgba(0,0,0,0.1)',
    },
}));

const GradientButton = styled(Button)(({ gradient }) => ({
    background: gradient || 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    color: 'white',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(17,153,142,0.25)',
    '&:hover': { transform: 'scale(1.02)', opacity: 0.95 },
}));

const fmt = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const emptyForm = {
    account_name:    '',
    account_type:    'bank',
    bank_name:       '',
    account_number:  '',
    ifsc_code:       '',
    branch:          '',
    upi_id:          '',
    opening_balance: '',
    is_default:      false,
    notes:           '',
};

const OrgAccountsList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const { accounts = [], accountSummary, isLoading, actionLoading } = useSelector((s) => s.orgFinance || {});

    const [formDialog, setFormDialog]       = useState(false);
    const [editMode, setEditMode]           = useState(false);
    const [selectedAccount, setSelected]    = useState(null);
    const [formData, setFormData]           = useState(emptyForm);
    const [deleteDialog, setDeleteDialog]   = useState(false);
    const [accountToDelete, setToDelete]    = useState(null);
    const [snackbar, setSnackbar]           = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        dispatch(getOrgAccounts());
        dispatch(getOrgAccountSummary());
        return () => { dispatch(resetFinance()); };
    }, [dispatch]);

    const showSnackbar = (message, severity = 'success') =>
        setSnackbar({ open: true, message, severity });

    const handleOpenCreate = () => {
        setFormData(emptyForm);
        setEditMode(false);
        setSelected(null);
        setFormDialog(true);
    };

    const handleOpenEdit = (acc) => {
        setSelected(acc);
        setFormData({
            account_name:    acc.account_name || acc.name || '',
            account_type:    acc.account_type || 'bank',
            bank_name:       acc.bank_name || '',
            account_number:  acc.account_number || '',
            ifsc_code:       acc.ifsc_code || '',
            branch:          acc.branch || '',
            upi_id:          acc.upi_id || '',
            opening_balance: acc.opening_balance ?? '',
            is_default:      Boolean(acc.is_default),
            notes:           acc.notes || '',
        });
        setEditMode(true);
        setFormDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.account_name.trim()) {
            showSnackbar('Account name is required', 'error');
            return;
        }

        try {
            const payload = { ...formData, name: formData.account_name };
            if (editMode && selectedAccount) {
                await dispatch(updateOrgAccount({ id: selectedAccount.id, data: payload })).unwrap();
                showSnackbar('Account updated successfully!');
            } else {
                await dispatch(createOrgAccount(payload)).unwrap();
                showSnackbar('Account created successfully!');
            }
            setFormDialog(false);
            dispatch(getOrgAccounts());
            dispatch(getOrgAccountSummary());
        } catch (err) {
            showSnackbar(typeof err === 'string' ? err : 'Operation failed!', 'error');
        }
    };

    const handleDelete = async () => {
        if (!accountToDelete) return;
        try {
            await dispatch(deleteOrgAccount(accountToDelete.id)).unwrap();
            showSnackbar('Account deleted successfully!');
            setDeleteDialog(false);
            dispatch(getOrgAccounts());
            dispatch(getOrgAccountSummary());
        } catch (err) {
            showSnackbar(typeof err === 'string' ? err : 'Delete failed!', 'error');
        }
    };

    const getAccountIcon = (type) => {
        if (type === 'cash') return <CashIcon sx={{ fontSize: 24, color: '#16a34a' }} />;
        if (type === 'upi') return <UpiIcon sx={{ fontSize: 24, color: '#7c3aed' }} />;
        return <BankIcon sx={{ fontSize: 24, color: '#2563eb' }} />;
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Paper elevation={0} sx={{
                p: 3, mb: 3, borderRadius: '16px',
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                    : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                color: 'white',
            }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} letterSpacing={0.5}>
                            🏦 Company Bank & Cash Accounts
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                            Manage organization treasury, bank current accounts, and cash drawer (Galla).
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="outlined"
                            startIcon={<StatementIcon />}
                            onClick={() => navigate('/org/cashbook')}
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', borderRadius: '10px', textTransform: 'none' }}
                        >
                            Cash & Bank Book
                        </Button>
                        <GradientButton
                            startIcon={<AddIcon />}
                            onClick={handleOpenCreate}
                        >
                            + Add Account
                        </GradientButton>
                    </Stack>
                </Stack>
            </Paper>

            {/* Summary Metrics */}
            <Grid container spacing={2.5} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                                Total Liquid Funds
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#10b981" mt={0.5}>
                                {fmt(accountSummary?.total_balance)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                All bank & cash balances combined
                            </Typography>
                        </CardContent>
                    </GlassCard>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                                In Bank Accounts
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#3b82f6" mt={0.5}>
                                {fmt(accountSummary?.bank_balance)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Current & savings balances
                            </Typography>
                        </CardContent>
                    </GlassCard>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                                Cash in Hand (Galla)
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#f59e0b" mt={0.5}>
                                {fmt(accountSummary?.cash_balance)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Physical cash / petty cash
                            </Typography>
                        </CardContent>
                    </GlassCard>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                                Active Accounts
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="#8b5cf6" mt={0.5}>
                                {accountSummary?.total_accounts || accounts.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Configured treasury accounts
                            </Typography>
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* Accounts Grid */}
            <Typography variant="h6" fontWeight={700} mb={2}>
                Configured Accounts ({accounts.length})
            </Typography>

            {isLoading && accounts.length === 0 ? (
                <Box textAlign="center" py={6}><CircularProgress /></Box>
            ) : accounts.length === 0 ? (
                <GlassCard sx={{ p: 4, textAlign: 'center' }}>
                    <WalletIcon sx={{ fontSize: 50, color: '#94a3b8', mb: 1 }} />
                    <Typography variant="h6" color="text.secondary">No business accounts found</Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Add your company bank account or cash in hand to start tracking payments.
                    </Typography>
                    <GradientButton startIcon={<AddIcon />} onClick={handleOpenCreate}>
                        Add Your First Account
                    </GradientButton>
                </GlassCard>
            ) : (
                <Grid container spacing={2.5}>
                    {accounts.map((acc) => (
                        <Grid item xs={12} sm={6} md={4} key={acc.id}>
                            <motion.div whileHover={{ y: -4 }}>
                                <GlassCard sx={{ position: 'relative', overflow: 'hidden' }}>
                                    {acc.is_default && (
                                        <Box sx={{
                                            position: 'absolute', top: 0, right: 0,
                                            bgcolor: '#10b981', color: 'white',
                                            px: 1.5, py: 0.3, borderBottomLeftRadius: '10px',
                                            fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                                            display: 'flex', alignItems: 'center', gap: 0.5,
                                        }}>
                                            <DefaultIcon sx={{ fontSize: 12 }} /> PRIMARY
                                        </Box>
                                    )}
                                    <CardContent sx={{ p: 3 }}>
                                        <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                                            <Avatar sx={{ bgcolor: isDark ? '#334155' : '#f1f5f9', width: 44, height: 44 }}>
                                                {getAccountIcon(acc.account_type)}
                                            </Avatar>
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography variant="subtitle1" fontWeight={700} noWrap>
                                                    {acc.account_name || acc.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {acc.bank_name ? `${acc.bank_name} · ` : ''}{acc.account_type?.toUpperCase()}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        {/* Live Balance Box */}
                                        <Paper elevation={0} sx={{
                                            p: 2, my: 1.5, borderRadius: '12px',
                                            bgcolor: isDark ? '#0f172a' : '#f8fafc',
                                            border: '1px solid', borderColor: 'divider',
                                        }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                                CURRENT LIVE BALANCE
                                            </Typography>
                                            <Typography variant="h5" fontWeight={800} color={Number(acc.current_balance) >= 0 ? '#10b981' : '#ef4444'}>
                                                {fmt(acc.current_balance)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Opening: {fmt(acc.opening_balance)}
                                            </Typography>
                                        </Paper>

                                        {/* Details */}
                                        <Stack spacing={0.5} mb={2}>
                                            {acc.account_number && (
                                                <Typography variant="caption" color="text.secondary">
                                                    <b>A/c:</b> •••• {acc.account_number.slice(-4)}
                                                </Typography>
                                            )}
                                            {acc.ifsc_code && (
                                                <Typography variant="caption" color="text.secondary">
                                                    <b>IFSC:</b> {acc.ifsc_code}
                                                </Typography>
                                            )}
                                            {acc.upi_id && (
                                                <Typography variant="caption" color="text.secondary">
                                                    <b>UPI:</b> {acc.upi_id}
                                                </Typography>
                                            )}
                                        </Stack>

                                        <Divider sx={{ my: 1.5 }} />

                                        {/* Actions */}
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Stack direction="row" spacing={0.5}>
                                                <Button
                                                    size="small"
                                                    startIcon={<StatementIcon />}
                                                    onClick={() => navigate('/org/cashbook', { state: { selectedAccountId: acc.id } })}
                                                    sx={{ textTransform: 'none', borderRadius: '8px', fontSize: 11 }}
                                                >
                                                    Passbook
                                                </Button>
                                                <Button
                                                    size="small"
                                                    onClick={() => navigate('/org/reconciliation', { state: { selectedAccountId: acc.id } })}
                                                    sx={{ textTransform: 'none', borderRadius: '8px', fontSize: 11, color: '#0284c7', fontWeight: 700 }}
                                                >
                                                    BRS
                                                </Button>
                                            </Stack>
                                            <Stack direction="row" spacing={0.5}>
                                                <Tooltip title="Edit Account">
                                                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(acc)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Account">
                                                    <IconButton size="small" color="error" onClick={() => { setToDelete(acc); setDeleteDialog(true); }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </GlassCard>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={formDialog} onClose={() => setFormDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={700}>
                            {editMode ? 'Edit Account' : 'Add Bank / Cash Account'}
                        </Typography>
                        <IconButton onClick={() => setFormDialog(false)}><CloseIcon /></IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" id="org-account-form" onSubmit={handleSubmit}>
                        <Grid container spacing={2} mt={0.5}>
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    fullWidth size="small" required
                                    label="Account Name"
                                    name="account_name"
                                    value={formData.account_name}
                                    onChange={(e) => setFormData(p => ({ ...p, account_name: e.target.value }))}
                                    placeholder="e.g. HDFC Current A/c, Cash in Hand"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={formData.account_type}
                                        label="Type"
                                        onChange={(e) => setFormData(p => ({ ...p, account_type: e.target.value }))}
                                    >
                                        <MenuItem value="bank">🏦 Bank Account</MenuItem>
                                        <MenuItem value="cash">💵 Cash / Galla</MenuItem>
                                        <MenuItem value="upi">📱 UPI Wallet</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {formData.account_type === 'bank' && (
                                <>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth size="small"
                                            label="Bank Name"
                                            value={formData.bank_name}
                                            onChange={(e) => setFormData(p => ({ ...p, bank_name: e.target.value }))}
                                            placeholder="e.g. HDFC Bank"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth size="small"
                                            label="Account Number"
                                            value={formData.account_number}
                                            onChange={(e) => setFormData(p => ({ ...p, account_number: e.target.value }))}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth size="small"
                                            label="IFSC Code"
                                            value={formData.ifsc_code}
                                            onChange={(e) => setFormData(p => ({ ...p, ifsc_code: e.target.value.toUpperCase() }))}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth size="small"
                                            label="Branch"
                                            value={formData.branch}
                                            onChange={(e) => setFormData(p => ({ ...p, branch: e.target.value }))}
                                        />
                                    </Grid>
                                </>
                            )}

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth size="small"
                                    label="UPI ID (Optional)"
                                    value={formData.upi_id}
                                    onChange={(e) => setFormData(p => ({ ...p, upi_id: e.target.value }))}
                                    placeholder="company@hdfcbank"
                                />
                            </Grid>

                            {!editMode && (
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth size="small" type="number"
                                        label="Opening Balance (Day 1)"
                                        value={formData.opening_balance}
                                        onChange={(e) => setFormData(p => ({ ...p, opening_balance: e.target.value }))}
                                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                        helperText="Initial balance when starting"
                                    />
                                </Grid>
                            )}

                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.is_default}
                                            onChange={(e) => setFormData(p => ({ ...p, is_default: e.target.checked }))}
                                            color="primary"
                                        />
                                    }
                                    label="Mark as Primary / Default Account for Payments"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setFormDialog(false)} variant="outlined" sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <GradientButton type="submit" form="org-account-form" disabled={actionLoading}>
                        {actionLoading ? 'Saving...' : editMode ? 'Update Account' : 'Create Account'}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
                <DialogTitle>Delete Account?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to delete <b>{accountToDelete?.account_name || accountToDelete?.name}</b>?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(p => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Container>
    );
};

export default OrgAccountsList;