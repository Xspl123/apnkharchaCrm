import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
    createVendorPayment,
    deleteVendorPayment,
    clearVendorPayments,
    reset,
} from '../state/vendorSlice';
import vendorService from '../services/vendorService';
import {
    Box, Container, Grid, Card, CardContent, Typography, Paper, Stack,
    TextField, InputAdornment, Avatar, Chip, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton, Snackbar, Alert, LinearProgress,
    Divider,
} from '@mui/material';
import {
    Payment as PaymentIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    ReceiptLong as ReceiptIcon,
    AccountBalance as AccountBalanceIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

const GlassCard = styled(Card)(() => ({
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.3)',
}));

const GradientButton = styled(Button)(({ gradient }) => ({
    background: gradient || 'linear-gradient(135deg, #1976d2, #42a5f5)',
    color: 'white',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(25,118,210,0.25)',
    '&:hover': { opacity: 0.95 },
}));

const fmt = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const normalizePOStatus = (status) => (status === 'returned' ? 'return' : status);

const getStatusLabel = (status) => {
    const normalized = normalizePOStatus(status);
    if (normalized === 'return') return 'Returned';
    if (!normalized) return 'Pending';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const generateReference = () =>
    `VP-${Date.now()}-${Math.floor(10000 + Math.random() * 90000)}`;

const createEmptyPayment = (poId = '') => ({
    purchase_order_id: poId,
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference_no: generateReference(),
    notes: '',
});

const VendorPayments = () => {
    const dispatch = useDispatch();

    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [payments, setPayments] = useState([]);
    const [selectedPO, setSelectedPO] = useState(null);
    const [paymentDialog, setPaymentDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState(null);
    const [paymentForm, setPaymentForm] = useState(createEmptyPayment());
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const loadPurchaseOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await vendorService.getAllPOs();
            const poList = response.data?.data || response.data || [];
            setPurchaseOrders(poList);

            const firstOpenPO = poList.find((po) => Number(po.balance_amount) > 0 && po.status !== 'cancelled')
                || poList[0]
                || null;

            setSelectedPO((prev) => {
                if (prev) {
                    return poList.find((po) => String(po.id) === String(prev.id)) || firstOpenPO;
                }
                return firstOpenPO;
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message: err?.response?.data?.message || 'Purchase orders load nahi huye.',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const loadPaymentsForPO = useCallback(async (poId) => {
        if (!poId) {
            setPayments([]);
            return;
        }

        setLoading(true);
        try {
            const response = await vendorService.getPayments({ purchase_order_id: poId });
            setPayments(response.data?.data || response.data || []);
        } catch (err) {
            setPayments([]);
            setSnackbar({
                open: true,
                message: err?.response?.data?.message || 'Payments load nahi ho paayin.',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPurchaseOrders();
        return () => {
            dispatch(clearVendorPayments());
            dispatch(reset());
        };
    }, [dispatch, loadPurchaseOrders]);

    useEffect(() => {
        if (selectedPO?.id) {
            loadPaymentsForPO(selectedPO.id);
        } else {
            setPayments([]);
        }
    }, [selectedPO, loadPaymentsForPO]);

    const filteredPOs = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return purchaseOrders;

        return purchaseOrders.filter((po) => [
            po.po_number,
            po.vendor?.vendor_name,
            po.vendor?.company_name,
            po.status,
        ].filter(Boolean).join(' ').toLowerCase().includes(q));
    }, [purchaseOrders, searchQuery]);

    const totalPaid = purchaseOrders.reduce((sum, po) => sum + (parseFloat(po.paid_amount) || 0), 0);
    const totalBalance = purchaseOrders.reduce((sum, po) => sum + (parseFloat(po.balance_amount) || 0), 0);
    const activePOs = purchaseOrders.filter((po) => po.status !== 'cancelled').length;
    const totalReturned = purchaseOrders.reduce((sum, po) => sum + (parseFloat(po.returned_amount) || 0), 0);

    const handleSelectPO = (po) => {
        setSelectedPO(po);
        setPaymentDialog(false);
    };

    const handleOpenPayment = (po) => {
        setSelectedPO(po);
        setPaymentForm({
            ...createEmptyPayment(po.id),
            amount: po.balance_amount || '',
        });
        setPaymentDialog(true);
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();

        const amount = parseFloat(paymentForm.amount);
        const maxBalance = parseFloat(selectedPO?.balance_amount) || 0;

        if (!selectedPO?.id) {
            setSnackbar({ open: true, message: 'Pehle PO select karo.', severity: 'error' });
            return;
        }
        if (!amount || amount <= 0) {
            setSnackbar({ open: true, message: 'Valid amount daalo.', severity: 'error' });
            return;
        }
        if (maxBalance > 0 && amount > maxBalance) {
            setSnackbar({ open: true, message: 'Amount outstanding balance se zyada nahi ho sakta.', severity: 'error' });
            return;
        }

        try {
            setLoading(true);
            await dispatch(createVendorPayment({
                ...paymentForm,
                amount,
                purchase_order_id: selectedPO.id,
            })).unwrap();
            await Promise.all([
                loadPurchaseOrders(),
                loadPaymentsForPO(selectedPO.id),
            ]);
            setPaymentDialog(false);
            setSnackbar({ open: true, message: 'Payment recorded successfully!', severity: 'success' });
        } catch (err) {
            setSnackbar({
                open: true,
                message: typeof err === 'string' ? err : 'Payment save failed!',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePayment = async () => {
        if (!paymentToDelete?.id || !selectedPO?.id) return;

        try {
            setLoading(true);
            await dispatch(deleteVendorPayment(paymentToDelete.id)).unwrap();
            await Promise.all([
                loadPurchaseOrders(),
                loadPaymentsForPO(selectedPO.id),
            ]);
            setDeleteDialog(false);
            setPaymentToDelete(null);
            setSnackbar({ open: true, message: 'Payment deleted!', severity: 'success' });
        } catch (err) {
            setSnackbar({
                open: true,
                message: typeof err === 'string' ? err : 'Delete failed!',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {loading && (
                <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
                    <LinearProgress />
                </Box>
            )}

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Paper elevation={0} sx={{
                    p: 3, mb: 3, borderRadius: '20px',
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    color: 'white',
                }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h5" fontWeight={700}>Vendor Payments</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                Purchase order wise payment section, same flow as PO view
                            </Typography>
                        </Box>
                        <GradientButton
                            startIcon={<RefreshIcon />}
                            onClick={loadPurchaseOrders}
                            gradient="linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.28))"
                        >
                            Refresh
                        </GradientButton>
                    </Stack>
                </Paper>
            </motion.div>

            <Grid container spacing={2} mb={3}>
                {[
                    { label: 'Total POs', value: purchaseOrders.length, icon: <ReceiptIcon />, color: '#1976d2' },
                    { label: 'Total Paid', value: fmt(totalPaid), icon: <PaymentIcon />, color: '#11998e' },
                    { label: 'Outstanding', value: fmt(totalBalance), icon: <AccountBalanceIcon />, color: '#ef4444' },
                    { label: 'Returned Value', value: fmt(totalReturned), icon: <VisibilityIcon />, color: '#7c3aed' },
                    { label: 'Active POs', value: activePOs, icon: <ReceiptIcon />, color: '#0f766e' },
                ].map((item) => (
                    <Grid item xs={12} sm={6} md={3} key={item.label}>
                        <GlassCard>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                            {item.label}
                                        </Typography>
                                        <Typography variant="h5" fontWeight={800} color={item.color} mt={0.5}>
                                            {item.value}
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: item.color, width: 42, height: 42 }}>
                                        {item.icon}
                                    </Avatar>
                                </Stack>
                            </CardContent>
                        </GlassCard>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={5} lg={4}>
                    <GlassCard>
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="h6" fontWeight={700}>Purchase Orders</Typography>
                                <TextField
                                    size="small"
                                    placeholder="PO number ya vendor search karo..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Stack spacing={1.5}>
                                    {filteredPOs.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                                            Koi purchase order nahi mila
                                        </Typography>
                                    ) : filteredPOs.map((po) => (
                                        <Paper
                                            key={po.id}
                                            elevation={0}
                                            onClick={() => handleSelectPO(po)}
                                            sx={{
                                                p: 2,
                                                borderRadius: '14px',
                                                border: '1px solid',
                                                borderColor: selectedPO?.id === po.id ? '#42a5f5' : '#e2e8f0',
                                                bgcolor: selectedPO?.id === po.id ? 'rgba(66,165,245,0.08)' : 'white',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <Stack spacing={0.8}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" fontWeight={700} color="#1976d2">
                                                        {po.po_number}
                                                    </Typography>
                                                    <Chip label={getStatusLabel(po.status)} size="small" variant="outlined" />
                                                </Stack>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {po.vendor?.vendor_name || 'Vendor'}
                                                </Typography>
                                                {po.vendor?.company_name && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {po.vendor.company_name}
                                                    </Typography>
                                                )}
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">
                                                        Paid: {fmt(po.paid_amount)}
                                                    </Typography>
                                                    <Typography variant="caption" color="error.main" fontWeight={700}>
                                                        Balance: {fmt(po.balance_amount)}
                                                    </Typography>
                                                </Stack>
                                                {Number(po.returned_amount) > 0 && (
                                                    <Typography variant="caption" color="warning.main" fontWeight={700}>
                                                        Returned: {fmt(po.returned_amount)}
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} md={7} lg={8}>
                    <GlassCard>
                        <CardContent>
                            {!selectedPO ? (
                                <Typography variant="body2" color="text.secondary" textAlign="center" py={8}>
                                    Payment details dekhne ke liye PO select karo
                                </Typography>
                            ) : (
                                <>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Box>
                                            <Typography variant="h6" fontWeight={700}>{selectedPO.po_number}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {selectedPO.vendor?.vendor_name || 'Vendor'}{selectedPO.vendor?.company_name ? ` · ${selectedPO.vendor.company_name}` : ''}
                                            </Typography>
                                            {Number(selectedPO.returned_amount) > 0 && (
                                                <Typography variant="caption" color="warning.main" fontWeight={700}>
                                                    Returned Value: {fmt(selectedPO.returned_amount)}
                                                </Typography>
                                            )}
                                        </Box>
                                        {Number(selectedPO.balance_amount) > 0 && selectedPO.status !== 'cancelled' && (
                                            <GradientButton
                                                startIcon={<PaymentIcon />}
                                                onClick={() => handleOpenPayment(selectedPO)}
                                                gradient="linear-gradient(135deg, #11998e, #38ef7d)"
                                            >
                                                Pay Karo
                                            </GradientButton>
                                        )}
                                    </Stack>

                                    <Paper elevation={0} sx={{
                                        p: 2, mb: 2, borderRadius: '12px',
                                        bgcolor: Number(selectedPO.balance_amount) > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(46,125,50,0.06)',
                                        border: '1px solid',
                                        borderColor: Number(selectedPO.balance_amount) > 0 ? '#fecaca' : '#86efac',
                                    }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" color="text.secondary">
                                                Total: <b>{fmt(selectedPO.total_amount)}</b>&nbsp;|&nbsp;
                                                Paid: <b style={{ color: '#2e7d32' }}>{fmt(selectedPO.paid_amount)}</b>&nbsp;|&nbsp;
                                                Balance: <b style={{ color: '#ef4444' }}>{fmt(selectedPO.balance_amount)}</b>
                                            </Typography>
                                            <Chip label={getStatusLabel(selectedPO.status)} size="small" variant="outlined" />
                                        </Stack>
                                        {Number(selectedPO.returned_amount) > 0 && (
                                            <>
                                                <Divider sx={{ my: 1.5 }} />
                                                <Typography variant="body2" color="warning.main" fontWeight={700}>
                                                    Returned: {fmt(selectedPO.returned_amount)}
                                                </Typography>
                                            </>
                                        )}
                                    </Paper>

                                    {payments.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                                            Koi payment nahi mili abhi tak
                                        </Typography>
                                    ) : (
                                        <Stack spacing={1.5}>
                                            {payments.map((payment) => (
                                                <Paper key={payment.id} elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Stack>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Typography variant="body2" fontWeight={700} color="success.main">
                                                                    {fmt(payment.amount)}
                                                                </Typography>
                                                                <Chip label={payment.payment_method_label || payment.payment_method} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                                                            </Stack>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {payment.payment_date_formatted || payment.payment_date}
                                                                {payment.reference_no && ` · Ref: ${payment.reference_no}`}
                                                            </Typography>
                                                        </Stack>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => {
                                                                setPaymentToDelete(payment);
                                                                setDeleteDialog(true);
                                                            }}
                                                            sx={{ bgcolor: 'rgba(239,68,68,0.08)' }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            <Dialog
                open={paymentDialog}
                onClose={() => setPaymentDialog(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
            >
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar sx={{ bgcolor: '#11998e', width: 36, height: 36 }}>
                                <PaymentIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700}>Add Payment</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {selectedPO?.po_number} · Balance: {fmt(selectedPO?.balance_amount)}
                                </Typography>
                            </Box>
                        </Stack>
                        <IconButton size="small" onClick={() => setPaymentDialog(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" id="vendor-payment-form" onSubmit={handleSubmitPayment}>
                        <Stack spacing={2} mt={1}>
                            <TextField
                                fullWidth
                                required
                                size="small"
                                label="Amount"
                                type="number"
                                inputProps={{ min: 0.01, step: 'any' }}
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                helperText={`Max: ${fmt(selectedPO?.balance_amount)}`}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                            <TextField
                                fullWidth
                                required
                                size="small"
                                label="Payment Date"
                                type="date"
                                value={paymentForm.payment_date}
                                onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_date: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                label="Payment Method"
                                value={paymentForm.payment_method}
                                onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                label="Reference No"
                                value={paymentForm.reference_no}
                                onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference_no: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                label="Notes"
                                value={paymentForm.notes}
                                onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                                multiline
                                rows={3}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button variant="outlined" onClick={() => setPaymentDialog(false)} sx={{ borderRadius: '10px' }}>
                        Cancel
                    </Button>
                    <GradientButton type="submit" form="vendor-payment-form" gradient="linear-gradient(135deg, #11998e, #38ef7d)">
                        Save Payment
                    </GradientButton>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} PaperProps={{ sx: { borderRadius: '18px' } }}>
                <DialogTitle>Delete payment?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        {paymentToDelete?.reference_no
                            ? `Reference ${paymentToDelete.reference_no} wala payment delete karna hai?`
                            : 'Yeh payment record delete karna hai?'}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" fontWeight={700}>
                        {paymentToDelete?.amount ? fmt(paymentToDelete.amount) : ''}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleDeletePayment}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default VendorPayments;
