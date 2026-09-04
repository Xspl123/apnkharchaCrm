import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPurchaseReturn, getPurchaseReturnsByPO } from '../../../redux/features/purchaseReturnSlice';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Stack, Typography, Avatar, Divider, Button,
    Table, TableHead, TableRow, TableCell, TableBody,
    TableContainer, Paper, TextField, Chip, Alert,
    CircularProgress, IconButton,
} from '@mui/material';
import {
    Undo as ReturnIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    Warning as WarnIcon,
    CheckCircle as DoneIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const GradientButton = styled(Button)(() => ({
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: 'white',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'none',
    '&:hover': { opacity: 0.9 },
    '&:disabled': { opacity: 0.6 },
}));

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const PurchaseReturnDialog = ({ open, onClose, po, onSuccess }) => {
    const dispatch = useDispatch();
    const { isLoading } = useSelector((s) => s.purchaseReturns);

    const [returnDate,  setReturnDate]  = useState(new Date().toISOString().split('T')[0]);
    const [notes,       setNotes]       = useState('');
    const [returnItems, setReturnItems] = useState([]);
    const [snackMsg,    setSnackMsg]    = useState('');
    const [submitting,  setSubmitting]  = useState(false);

    useEffect(() => {
        if (open && po) {
            dispatch(getPurchaseReturnsByPO(po.id));

            const items = (po.items || []).map((item) => ({
                product_id:   item.product_id,
                item_name:    item.item_name || item.product?.name || '',
                hsn_code:     item.hsn_code || '',
                max_qty:      parseFloat(item.qty) - parseFloat(item.returned_qty || 0),
                original_qty: parseFloat(item.qty),
                returned_qty: parseFloat(item.returned_qty || 0),
                rate:         parseFloat(item.rate),
                unit:         item.unit || 'pcs',
                tax_rate:     parseFloat(item.tax_rate || 0),
                return_qty:   '',
                reason:       '',
            }));
            setReturnItems(items);
            setNotes('');
            setSnackMsg('');
        }
    }, [dispatch, open, po]);

    const handleQtyChange = (index, value) => {
        setReturnItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], return_qty: value };
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
        (i) => i.return_qty !== '' && parseFloat(i.return_qty) > 0 && i.product_id
    );

    const totalReturnAmount = selectedItems.reduce((sum, i) => {
        const amt = parseFloat(i.return_qty) * i.rate;
        return sum + amt + (amt * i.tax_rate / 100);
    }, 0);

    const handleSubmit = async () => {
        if (selectedItems.length === 0) {
            setSnackMsg('Kam se kam ek item ki qty daalo!');
            return;
        }

        for (const item of selectedItems) {
            const qty = parseFloat(item.return_qty);
            if (qty > item.max_qty) {
                setSnackMsg(`${item.item_name}: Max return qty ${item.max_qty} ${item.unit} hai!`);
                return;
            }
            if (!item.reason?.trim()) {
                setSnackMsg(`${item.item_name}: Reason daalo!`);
                return;
            }
        }

        try {
            setSubmitting(true);
            await dispatch(createPurchaseReturn({
                original_po_id: po.id,
                return_date:    returnDate,
                notes:          notes,
                items: selectedItems.map((i) => ({
                    product_id: i.product_id,
                    qty:        parseFloat(i.return_qty),
                    rate:       i.rate,
                    reason:     i.reason,
                })),
            })).unwrap();

            onSuccess?.('Purchase return created! Stock updated. ✅');
            onClose();
        } catch (err) {
            setSnackMsg(typeof err === 'string' ? err : 'Purchase return failed!');
        } finally {
            setSubmitting(false);
        }
    };

    if (!po) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: '20px' } }}>

            <DialogTitle sx={{ pb: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: '#f59e0b', width: 40, height: 40 }}>
                            <ReturnIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>Purchase Return</Typography>
                            <Typography variant="caption" color="text.secondary">
                                PO #{po.po_number} · {po.vendor?.vendor_name} · {fmt(po.total_amount)}
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Stack>
                <Divider sx={{ mt: 2 }} />
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                    <TextField fullWidth size="small" label="Return Date" type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <TextField fullWidth size="small" label="Notes (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                </Stack>

                {snackMsg && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}
                        onClose={() => setSnackMsg('')}>
                        {snackMsg}
                    </Alert>
                )}

                <Alert severity="warning" icon={<WarnIcon />} sx={{ mb: 2, borderRadius: '10px' }}>
                    Jo items vendor ko wapas karne hain unki qty daalo. Stock inventory se minus ho jayega.
                </Alert>

                <TableContainer component={Paper} elevation={0}
                    sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fffbeb' }}>
                                {['Item', 'Original', 'Returned', 'Returnable', 'Return Qty', 'Rate', 'Reason'].map((h) => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, py: 1.5 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {returnItems.map((item, index) => {
                                const maxQty    = item.max_qty;
                                const returnQty = parseFloat(item.return_qty) || 0;
                                const isOver    = returnQty > maxQty;
                                const isFullyRet= maxQty <= 0;
                                const lineTotal = returnQty * item.rate;

                                return (
                                    <TableRow key={index} sx={{
                                        bgcolor: isFullyRet
                                            ? 'rgba(0,0,0,0.02)'
                                            : returnQty > 0
                                                ? 'rgba(245,158,11,0.04)'
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
                                                    size="small" color="warning" variant="outlined"
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
                                                error={isOver}
                                                helperText={isOver ? `Max: ${maxQty}` : ''}
                                                sx={{
                                                    width: 90,
                                                    '& .MuiOutlinedInput-root': { borderRadius: '8px' },
                                                }}
                                            />
                                            {returnQty > 0 && !isOver && (
                                                <Typography variant="caption" color="warning.main" display="block">
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

                {selectedItems.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Paper elevation={0} sx={{
                            mt: 2, p: 2, borderRadius: '12px',
                            bgcolor: 'rgba(245,158,11,0.06)',
                            border: '1px solid rgba(245,158,11,0.3)',
                        }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedItems.length} item(s) return ho rahi hain
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Inventory se stock minus hoga
                                    </Typography>
                                </Box>
                                <Box textAlign="right">
                                    <Typography variant="caption" color="text.secondary">
                                        Return Amount (incl. GST)
                                    </Typography>
                                    <Typography variant="h6" fontWeight={800} color="warning.dark">
                                        {fmt(totalReturnAmount)}
                                    </Typography>
                                </Box>
                            </Stack>
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
                    startIcon={submitting
                        ? <CircularProgress size={16} color="inherit" />
                        : <SaveIcon />}
                >
                    {submitting ? 'Processing...' : `Return ${selectedItems.length} Item(s)`}
                </GradientButton>
            </DialogActions>
        </Dialog>
    );
};

export default PurchaseReturnDialog;
