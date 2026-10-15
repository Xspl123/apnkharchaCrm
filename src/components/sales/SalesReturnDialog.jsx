import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSalesReturn, getSalesReturnsByInvoice } from '../../redux/features/salesReturnSlice';
import { getOrgAccounts } from '../../features/finance/state/orgFinanceSlice';
import usePermission from '../../hooks/usePermission';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Stack, Typography, Avatar, Divider, Button,
    Table, TableHead, TableRow, TableCell, TableBody,
    TableContainer, Paper, TextField, Chip, Alert,
    FormControl, FormControlLabel, Switch, InputLabel, Select, MenuItem,
    CircularProgress, IconButton,
} from '@mui/material';
import {
    AssignmentReturn as ReturnIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    Warning as WarnIcon,
    CheckCircle as DoneIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const GradientButton = styled(Button)(() => ({
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'none',
    '&:hover': { opacity: 0.9 },
    '&:disabled': { opacity: 0.6 },
}));

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const SalesReturnDialog = ({ open, onClose, invoice, onSuccess }) => {
    const dispatch = useDispatch();
    const { isLoading } = useSelector((s) => s.salesReturns);
    const { accounts: orgAccounts = [] } = useSelector((s) => s.orgFinance || {});

    const permissionApi = usePermission();
    const canViewBalance = permissionApi.can('org_accounts.view');

    const [returnDate,          setReturnDate]          = useState(new Date().toISOString().split('T')[0]);
    const [notes,               setNotes]               = useState('');
    const [returnItems,         setReturnItems]         = useState([]);
    const [snackMsg,            setSnackMsg]            = useState('');
    const [submitting,          setSubmitting]          = useState(false);

    // ── Instant Refund States ──────────────────────────────────
    const [isRefunded,          setIsRefunded]          = useState(false);
    const [refundAccountId,     setRefundAccountId]     = useState('');
    const [refundPaymentMethod, setRefundPaymentMethod] = useState('bank_transfer');

    useEffect(() => {
        if (open && invoice) {
            dispatch(getSalesReturnsByInvoice(invoice.id));
            dispatch(getOrgAccounts());

            const items = (invoice.items || []).map((item) => ({
                invoice_item_id: item.id,
                product_id:    item.product_id,
                item_name:     item.item_name || item.product?.name || '',
                hsn_code:      item.hsn_code  || '',
                max_qty:       (parseFloat(item.qty) - parseFloat(item.returned_qty || 0)),
                original_qty:  parseFloat(item.qty),
                returned_qty:  parseFloat(item.returned_qty || 0),
                rate:          parseFloat(String(item.rate).replace(/,/g, '')) || 0,
                unit:          item.unit || 'pcs',
                tax_rate:      parseFloat(item.tax_rate || 0),
                return_qty:    '',
                reason:        '',
            }));
            setReturnItems(items);
            setNotes('');
            setIsRefunded(false);
            setRefundAccountId('');
        }
    }, [dispatch, open, invoice]);

    const handleQtyChange = (index, value) => {
        setReturnItems((prev) => {
            const updated = [...prev];
            const max = updated[index].max_qty;
            const clamped = value === '' ? '' : Math.min(parseFloat(value) || 0, max);
            updated[index] = { ...updated[index], return_qty: clamped === '' ? '' : String(clamped) };
            return updated;
        });
    };

    const handleReasonChange = (index, value) => {
        setReturnItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], reason: value };
            return updated;
        });
    };

    const selectedItems = returnItems.filter(
        (i) => i.return_qty !== '' && parseFloat(i.return_qty) > 0
    );

    const totalReturnAmount = selectedItems.reduce((sum, i) => {
        const amt = parseFloat(i.return_qty) * i.rate;
        return sum + amt + (amt * i.tax_rate / 100);
    }, 0);

    const handleSubmit = async () => {
        if (selectedItems.length === 0) {
            setSnackMsg('Enter a quantity for at least one item.');
            return;
        }

        for (const item of selectedItems) {
            const qty = parseFloat(item.return_qty);
            if (qty > item.max_qty) {
                setSnackMsg(`${item.item_name}: Max return qty ${item.max_qty} ${item.unit} hai!`);
                return;
            }
            if (!item.reason?.trim()) {
                setSnackMsg(`${item.item_name}: Enter a reason.`);
                return;
            }
        }

        if (isRefunded && !refundAccountId) {
            setSnackMsg('Kripya refund debit karne ke liye Bank ya Cash account chunein.');
            return;
        }

        try {
            setSubmitting(true);
            await dispatch(createSalesReturn({
                original_invoice_id: invoice.id,
                return_date:         returnDate,
                notes:               notes,
                is_refunded:         isRefunded,
                account_id:          isRefunded && refundAccountId ? Number(refundAccountId) : undefined,
                refund_amount:       isRefunded ? totalReturnAmount : undefined,
                payment_method:      isRefunded ? refundPaymentMethod : undefined,
                items: selectedItems.map((i) => ({
                    invoice_item_id: i.invoice_item_id,
                    ...(i.product_id && { product_id: i.product_id }),
                    item_name:  i.item_name,
                    qty:        parseFloat(i.return_qty),
                    rate:       i.rate,
                    reason:     i.reason,
                })),
            })).unwrap();

            onSuccess?.('Sales return created successfully! Stock and Cashbook updated. ✅');
            onClose();
        } catch (err) {
            setSnackMsg(typeof err === 'string' ? err : 'Sales return failed!');
        } finally {
            setSubmitting(false);
        }
    };

    if (!invoice) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: '20px' } }}>

            {/* ── Title ── */}
            <DialogTitle sx={{ pb: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: '#ef4444', width: 40, height: 40 }}>
                            <ReturnIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>Sales Return</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Invoice #{invoice.invoice_no} · {invoice.client?.name} · {fmt(invoice.total_amount)}
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Stack>
                <Divider sx={{ mt: 2 }} />
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>

                {/* Return Date + Notes */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                            Return Date
                        </Typography>
                        <TextField fullWidth size="small" type="date"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                            Notes (optional)
                        </Typography>
                        <TextField fullWidth size="small"
                            placeholder="Add notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                    </Box>
                </Stack>

                {snackMsg && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}
                        onClose={() => setSnackMsg('')}>
                        {snackMsg}
                    </Alert>
                )}

                {/* Info */}
                <Alert severity="info" icon={<WarnIcon />} sx={{ mb: 2, borderRadius: '10px' }}>
                    Enter the quantity for each item to return. Stock will update automatically.
                </Alert>

                {/* Items Table */}
                <TableContainer component={Paper} elevation={0}
                    sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fef2f2' }}>
                                {['Item', 'Original', 'Returned', 'Returnable', 'Return Qty', 'Rate', 'Reason'].map((h) => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, py: 1.5 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {returnItems.map((item, index) => {
                                const maxQty     = item.max_qty;
                                const returnQty  = parseFloat(item.return_qty) || 0;
                                const isFullyRet = maxQty <= 0;
                                const lineTotal  = returnQty * item.rate;

                                return (
                                    <TableRow key={index} sx={{
                                        bgcolor: isFullyRet
                                            ? 'rgba(0,0,0,0.02)'
                                            : returnQty > 0
                                                ? 'rgba(239,68,68,0.03)'
                                                : 'transparent',
                                    }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {item.item_name}
                                            </Typography>
                                            {item.hsn_code && (
                                                <Typography variant="caption" color="text.secondary">
                                                    HSN: {item.hsn_code}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {item.original_qty} {item.unit}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {item.returned_qty > 0 ? (
                                                <Chip label={`${item.returned_qty} ${item.unit}`}
                                                    size="small" color="warning"
                                                    sx={{ fontSize: 11, height: 20 }} />
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isFullyRet ? (
                                                <Chip icon={<DoneIcon sx={{ fontSize: '12px !important' }} />}
                                                    label="Fully Returned" size="small" color="success"
                                                    sx={{ fontSize: 10, height: 20 }} />
                                            ) : (
                                                <Chip label={`${maxQty} ${item.unit}`}
                                                    size="small" color="error" variant="outlined"
                                                    sx={{ fontSize: 11, height: 20, fontWeight: 700 }} />
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 100 }}>
                                            <TextField
                                                size="small" type="number"
                                                disabled={isFullyRet}
                                                inputProps={{ min: 0, max: maxQty, step: 'any' }}
                                                value={item.return_qty}
                                                onChange={(e) => handleQtyChange(index, e.target.value)}
                                                sx={{
                                                    width: 90,
                                                    '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                                                }}
                                            />
                                            {returnQty > 0 && (
                                                <Typography variant="caption" color="error.main" display="block">
                                                    {fmt(lineTotal)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {fmt(item.rate)}
                                            </Typography>
                                            {item.tax_rate > 0 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    +{item.tax_rate}% GST
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 150 }}>
                                            <TextField
                                                size="small" fullWidth
                                                disabled={isFullyRet || returnQty === 0}
                                                placeholder="Reason..."
                                                value={item.reason}
                                                onChange={(e) => handleReasonChange(index, e.target.value)}
                                                error={returnQty > 0 && !item.reason?.trim()}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Summary & Instant Refund Section */}
                {selectedItems.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}>
                        <Paper elevation={0} sx={{
                            mt: 2, p: 2, borderRadius: '12px',
                            bgcolor: 'rgba(239,68,68,0.06)',
                            border: '1px solid rgba(239,68,68,0.2)',
                        }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedItems.length} item(s) will be returned
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Stock will be added back to inventory
                                    </Typography>
                                </Box>
                                <Box textAlign="right">
                                    <Typography variant="caption" color="text.secondary">
                                        Return Amount (incl. GST)
                                    </Typography>
                                    <Typography variant="h6" fontWeight={800} color="error.main">
                                        {fmt(totalReturnAmount)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        {/* Instant Refund Settlement */}
                        <Paper elevation={0} sx={{
                            mt: 1.5, p: 2, borderRadius: '12px',
                            bgcolor: isRefunded ? 'rgba(239, 68, 68, 0.05)' : '#f8fafc',
                            border: '1px solid',
                            borderColor: isRefunded ? '#fca5a5' : '#e2e8f0',
                        }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isRefunded}
                                        onChange={(e) => {
                                            setIsRefunded(e.target.checked);
                                            if (e.target.checked && !refundAccountId) {
                                                const def = orgAccounts.find(a => a.is_default) || orgAccounts[0];
                                                if (def) setRefundAccountId(def.id);
                                            }
                                        }}
                                        color="error"
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2" fontWeight={700} color={isRefunded ? 'error.main' : 'text.primary'}>
                                            Refund Paid to Client Immediately (Debit Company Account)
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {isRefunded
                                                ? 'Bank/Cash account se paisa minus hoga aur Cashbook me entry banegi.'
                                                : 'Uncheck rehne par client ledger me Credit Note banega bina bank balance hilaye.'}
                                        </Typography>
                                    </Box>
                                }
                            />

                            {isRefunded && (
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={2}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Refund From Account</InputLabel>
                                        <Select
                                            value={refundAccountId}
                                            label="Refund From Account"
                                            onChange={(e) => setRefundAccountId(e.target.value)}
                                            sx={{ borderRadius: '10px' }}
                                        >
                                            {orgAccounts.map((a) => (
                                                <MenuItem key={a.id} value={a.id}>
                                                    {a.account_type === 'cash' ? '💵 ' : '🏦 '}
                                                    {a.account_name || a.name}
                                                    {canViewBalance ? ` (₹${Number(a.current_balance || 0).toLocaleString('en-IN')})` : ''}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth size="small">
                                        <InputLabel>Payment Method</InputLabel>
                                        <Select
                                            value={refundPaymentMethod}
                                            label="Payment Method"
                                            onChange={(e) => setRefundPaymentMethod(e.target.value)}
                                            sx={{ borderRadius: '10px' }}
                                        >
                                            <MenuItem value="bank_transfer">🏦 Bank Transfer</MenuItem>
                                            <MenuItem value="upi">📱 UPI</MenuItem>
                                            <MenuItem value="cash">💵 Cash</MenuItem>
                                            <MenuItem value="cheque">📝 Cheque</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                            )}
                        </Paper>
                    </motion.div>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button onClick={onClose} variant="outlined"
                    sx={{ borderRadius: '10px', textTransform: 'none' }}>
                    Cancel
                </Button>
                <GradientButton
                    onClick={handleSubmit}
                    disabled={submitting || isLoading || selectedItems.length === 0}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                >
                    {submitting ? 'Processing...' : `Return ${selectedItems.length} Item(s)`}
                </GradientButton>
            </DialogActions>
        </Dialog>
    );
};

export default SalesReturnDialog;