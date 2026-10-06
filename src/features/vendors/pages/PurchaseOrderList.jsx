import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProducts, getCategories } from '../../inventory/state/inventorySlice';
import { Inventory as InventoryIcon, Undo as ReturnIcon } from '@mui/icons-material';
import PurchaseReturnDialog from '../components/PurchaseReturnDialog';
import {
    getPurchaseOrders, createPurchaseOrder, deletePurchaseOrder,
    getPurchaseOrderById, updatePOStatus, getVendors, getVendorPayments,
    createVendorPayment, deleteVendorPayment, clearVendorPayments, reset,
} from '../state/vendorSlice';
import { getHsnCodes } from '../../../redux/features/hsnCodeSlice';
import Autocomplete from '@mui/material/Autocomplete';
import {
    Box, Container, Grid, Card, CardContent, Typography, Paper,
    Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
    TablePagination, TextField, Button, IconButton, Chip, Stack,
    Avatar, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
    InputAdornment, Tooltip, Zoom, Fade, Snackbar, Alert, LinearProgress,
    Select, MenuItem,
} from '@mui/material';
import {
    Add as AddIcon, Delete as DeleteIcon, Search as SearchIcon,
    Clear as ClearIcon, Refresh as RefreshIcon, Close as CloseIcon,
    Save as SaveIcon, ShoppingCart as POIcon, Visibility as ViewIcon,
    CheckCircle as ApproveIcon, LocalShipping as ReceiveIcon,
    Cancel as CancelIcon, Payment as PaymentIcon,
    HourglassEmpty as PendingIcon,
    Remove as RemoveIcon, AutoAwesome as AutoIcon,
    Business as BusinessIcon, Description as DescriptionIcon,
    DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled, useTheme } from '@mui/material/styles';
import SpeechFieldButton from '../../../components/SpeechFieldButton';

// ── Styled Components ─────────────────────────────────────

const GlassCard = styled(Card)(() => ({
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.3)',
}));

const GradientButton = styled(Button)(({ gradient }) => ({
    background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(102,126,234,0.25)',
    '&:hover': { transform: 'scale(1.02)', opacity: 0.95 },
    '&:disabled': { opacity: 0.6, transform: 'none' },
}));

const StyledTableRow = styled(TableRow)(() => ({
    transition: 'all 0.2s ease',
    '&:hover': { backgroundColor: 'rgba(102,126,234,0.04)', cursor: 'pointer' },
}));

// ── Helpers ───────────────────────────────────────────────

const fmt = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
};

const STATUS_CONFIG = {
    pending:   { color: 'warning',   label: 'Pending',   icon: <PendingIcon  sx={{ fontSize: 14 }} /> },
    approved:  { color: 'info',      label: 'Approved',  icon: <ApproveIcon  sx={{ fontSize: 14 }} /> },
    received:  { color: 'success',   label: 'Received',  icon: <ReceiveIcon  sx={{ fontSize: 14 }} /> },
    cancelled: { color: 'error',     label: 'Cancelled', icon: <CancelIcon   sx={{ fontSize: 14 }} /> },
    return:    { color: 'secondary', label: 'Return',    icon: <CancelIcon   sx={{ fontSize: 14 }} /> },
    returned:  { color: 'secondary', label: 'Returned',  icon: <CancelIcon   sx={{ fontSize: 14 }} /> },
};

const normalizePOStatus = (status) => (status === 'returned' ? 'return' : status);

const INDIAN_STATES = [
    { code: '01', name: 'Jammu & Kashmir' }, { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' },          { code: '04', name: 'Chandigarh' },
    { code: '05', name: 'Uttarakhand' },     { code: '06', name: 'Haryana' },
    { code: '07', name: 'Delhi' },           { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' },   { code: '10', name: 'Bihar' },
    { code: '18', name: 'Assam' },           { code: '19', name: 'West Bengal' },
    { code: '20', name: 'Jharkhand' },       { code: '21', name: 'Odisha' },
    { code: '22', name: 'Chhattisgarh' },    { code: '23', name: 'Madhya Pradesh' },
    { code: '24', name: 'Gujarat' },         { code: '27', name: 'Maharashtra' },
    { code: '29', name: 'Karnataka' },       { code: '30', name: 'Goa' },
    { code: '32', name: 'Kerala' },          { code: '33', name: 'Tamil Nadu' },
    { code: '36', name: 'Telangana' },       { code: '37', name: 'Andhra Pradesh' },
    { code: '38', name: 'Ladakh' },
];

const emptyItem = {
    product_id:  null,
    category_id: null,   // ✅ category
    item_name:   '',
    description: '',
    hsn_code:    '',
    qty:         1,
    unit:        'pcs',
    rate:        '',
    tax_rate:    18,
    amount:      0,
    tax_amount:  0,
};

const emptyForm = {
    vendor_id:              '',
    po_date:                new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    supply_type:            'intra',
    place_of_supply:        '',
    is_reverse_charge:      false,
    notes:                  '',
    terms_conditions:       '1. Payment within 30 days\n2. GST as applicable',
    items:                  [{ ...emptyItem }],
};

const emptyPayment = {
    purchase_order_id: '',
    amount:            '',
    payment_date:      new Date().toISOString().split('T')[0],
    payment_method:    'bank_transfer',
    reference_no:      '',
    notes:             '',
};

// ── Section Heading ───────────────────────────────────────

const FormSection = ({ title, icon }) => (
    <Stack direction="row" alignItems="center" spacing={1} mb={2} mt={1}>
        <Avatar sx={{ bgcolor: '#667eea', width: 28, height: 28 }}>{icon}</Avatar>
        <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
        <Divider sx={{ flex: 1 }} />
    </Stack>
);

const StatusChip = ({ status }) => {
    const cfg = STATUS_CONFIG[normalizePOStatus(status)] || STATUS_CONFIG.pending;
    return (
        <Chip icon={cfg.icon} label={cfg.label} size="small"
            color={cfg.color} sx={{ fontWeight: 700 }} />
    );
};

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════

const PurchaseOrderList = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { purchaseOrders, vendors, payments, isLoading, actionLoading } =
        useSelector((s) => s.vendors);
    const { products, categories } = useSelector((s) => s.inventory);
    const { hsnCodes } = useSelector((s) => s.hsnCodes);

    const [showForm,      setShowForm]      = useState(false);
    const [loading,       setLoading]       = useState(false);
    const [searchQuery,   setSearchQuery]   = useState('');
    const [statusFilter,  setStatusFilter]  = useState('all');
    const [vendorFilter,  setVendorFilter]  = useState('all');
    const [page,          setPage]          = useState(0);
    const [rowsPerPage,   setRowsPerPage]   = useState(10);
    const [formData,      setFormData]      = useState({ ...emptyForm, items: [{ ...emptyItem }] });
    const [snackbar,      setSnackbar]      = useState({ open: false, message: '', severity: 'success' });
    const [viewDialog,    setViewDialog]    = useState(false);
    const [viewPO,        setViewPO]        = useState(null);
    const [statusDialog,  setStatusDialog]  = useState(false);
    const [statusPO,      setStatusPO]      = useState(null);
    const [newStatus,     setNewStatus]     = useState('');
    const [deleteDialog,  setDeleteDialog]  = useState(false);
    const [poToDelete,    setPoToDelete]    = useState(null);
    const [paymentDialog, setPaymentDialog] = useState(false);
    const [paymentPO,     setPaymentPO]     = useState(null);
    const [paymentForm,   setPaymentForm]   = useState({ ...emptyPayment });
    const [returnDialog,  setReturnDialog]  = useState(false);
    const [poToReturn,    setPoToReturn]    = useState(null);
    const appendSpeech = (value, transcript) =>
        [value, transcript].filter(Boolean).join(' ').trim();

    // ── Effects ───────────────────────────────────────────

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([
                dispatch(getPurchaseOrders()),
                dispatch(getVendors()),
                dispatch(getHsnCodes()),
                dispatch(getProducts()),
                dispatch(getCategories()),
            ]);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        loadData();
        return () => { dispatch(reset()); };
    }, [dispatch, loadData]);

    const showSnackbar = (message, severity = 'success') =>
        setSnackbar({ open: true, message, severity });

    const loadPaymentsForPO = useCallback(async (poId) => {
        if (!poId) {
            dispatch(clearVendorPayments());
            return;
        }
        await dispatch(getVendorPayments({ purchase_order_id: poId }));
    }, [dispatch]);

    // ── Calculations ──────────────────────────────────────

    const calcItem = (item) => {
        const qty     = parseFloat(item.qty)      || 0;
        const rate    = parseFloat(item.rate)     || 0;
        const taxRate = parseFloat(item.tax_rate) || 0;
        const amount  = qty * rate;
        return {
            ...item,
            amount:     +amount.toFixed(2),
            tax_amount: +(amount * taxRate / 100).toFixed(2),
        };
    };

    const calcTotals = (items, supplyType) => {
        const subTotal = items.reduce((s, i) => s + (parseFloat(i.amount)     || 0), 0);
        const totalTax = items.reduce((s, i) => s + (parseFloat(i.tax_amount) || 0), 0);
        const isInter  = supplyType === 'inter';
        return {
            subTotal:   +subTotal.toFixed(2),
            cgst:       isInter ? 0 : +(totalTax / 2).toFixed(2),
            sgst:       isInter ? 0 : +(totalTax / 2).toFixed(2),
            igst:       isInter ? +totalTax.toFixed(2) : 0,
            grandTotal: +(subTotal + totalTax).toFixed(2),
        };
    };

    const totals = calcTotals(formData.items, formData.supply_type);

    // ── Form Handlers ─────────────────────────────────────

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
    };

    // Single field update — functional updater avoids stale closure
    const handleItemChange = (index, field, value) => {
        setFormData((prev) => {
            const updated = [...prev.items];
            updated[index] = calcItem({ ...updated[index], [field]: value });
            return { ...prev, items: updated };
        });
    };

    const handleItemTextChange = (index, value) => {
        setFormData((prev) => {
            const updated = [...prev.items];
            updated[index] = calcItem({
                ...updated[index],
                item_name:  value, 
                product_id: null,  
            });
            return { ...prev, items: updated };
        });
    };

    const handleProductSelect = (index, product) => {
        if (!product) {
            setFormData((prev) => {
                const updated = [...prev.items];
                updated[index] = calcItem({ ...updated[index], product_id: null });
                return { ...prev, items: updated };
            });
            return;
        }
        setFormData((prev) => {
            const updated = [...prev.items];
            updated[index] = calcItem({
                ...updated[index],
                product_id:  product.id,
                category_id: product.category_id   || null,
                item_name:   product.name,
                hsn_code:    product.hsn_code       || updated[index].hsn_code,
                unit:        product.unit           || updated[index].unit,
                rate:        product.purchase_price || '',
                tax_rate:    product.tax_rate       || updated[index].tax_rate,
            });
            return { ...prev, items: updated };
        });
        showSnackbar(`${product.name} — auto filled! ✅`, 'success');
    };

    const handleAddItem = () =>
        setFormData((p) => ({ ...p, items: [...p.items, { ...emptyItem }] }));

    const handleRemoveItem = (index) => {
        if (formData.items.length === 1) {
            showSnackbar('Add at least one item.', 'warning');
            return;
        }
        setFormData((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) }));
    };

    const handleCancel = () => {
        setShowForm(false);
        setFormData({ ...emptyForm, items: [{ ...emptyItem }] });
    };

    // ✅ Item-wise validation with clear messages
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.vendor_id) {
            showSnackbar('Select a vendor.', 'error'); return;
        }

        for (let i = 0; i < formData.items.length; i++) {
            const item = formData.items[i];
            const num  = i + 1;
            if (!item.item_name?.trim()) {
                showSnackbar(`Item ${num}: Enter a product name.`, 'error'); return;
            }
            if (!item.qty || parseFloat(item.qty) <= 0) {
                showSnackbar(`Item ${num} (${item.item_name}): Enter a quantity.`, 'error'); return;
            }
            if (!item.rate || parseFloat(item.rate) <= 0) {
                showSnackbar(`Item ${num} (${item.item_name}): Enter a rate greater than 0.`, 'error'); return;
            }
        }

        try {
            setLoading(true);
            await dispatch(createPurchaseOrder({
                ...formData,
                cgst:         totals.cgst,
                sgst:         totals.sgst,
                igst:         totals.igst,
                sub_total:    totals.subTotal,
                total_amount: totals.grandTotal,
                // ✅ items explicitly map karo — category_id included
                items: formData.items.map((item) => ({
                    product_id:   item.product_id   ?? null,
                    category_id:  item.category_id  ?? null,
                    item_name:    item.item_name,
                    description:  item.description  ?? '',
                    hsn_code:     item.hsn_code      ?? '',
                    qty:          parseFloat(item.qty),
                    unit:         item.unit          ?? 'pcs',
                    rate:         parseFloat(item.rate),
                    tax_rate:     parseFloat(item.tax_rate ?? 18),
                    amount:       parseFloat(item.amount   ?? 0),
                    tax_amount:   parseFloat(item.tax_amount ?? 0),
                })),
            })).unwrap();
            showSnackbar('Purchase Order created successfully! 🎉');
            handleCancel();
            await dispatch(getPurchaseOrders());
        } catch (err) {
            showSnackbar(typeof err === 'string' ? err : 'PO create failed!', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Status Handlers ───────────────────────────────────

    const handleStatusClick = (po, status) => {
        setStatusPO(po); setNewStatus(status); setStatusDialog(true);
    };

    const handleStatusConfirm = async () => {
        try {
            setLoading(true);
            await dispatch(updatePOStatus({ id: statusPO.id, status: newStatus })).unwrap();
            if (newStatus === 'received') {
                showSnackbar('Purchase order received. Updating inventory... 📦', 'info');
                await dispatch(getProducts());
                showSnackbar('✅ Stock updated. New products have been added to inventory.', 'success');
            } else {
                showSnackbar(`PO marked as ${newStatus}!`);
            }
            setStatusDialog(false);
            setViewDialog(false);
            await dispatch(getPurchaseOrders());
        } catch (err) {
            showSnackbar(typeof err === 'string' ? err : 'Status update failed!', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Delete ────────────────────────────────────────────

    const handleDeleteConfirm = (po) => { setPoToDelete(po); setDeleteDialog(true); };

    const handleDelete = async () => {
        try {
            setLoading(true);
            await dispatch(deletePurchaseOrder(poToDelete.id)).unwrap();
            showSnackbar('PO deleted successfully!');
            setDeleteDialog(false);
        } catch (err) {
            showSnackbar(typeof err === 'string' ? err : 'Delete failed!', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── View ──────────────────────────────────────────────

    const handleView = async (po) => {
        setViewPO(null);
        dispatch(clearVendorPayments());
        const res = await dispatch(getPurchaseOrderById(po.id));
        if (res.meta.requestStatus === 'fulfilled') {
            const poDetails = res.payload.data;
            setViewPO(poDetails);
            setViewDialog(true);
            await loadPaymentsForPO(poDetails.id);
        }
    };

    // ── Payment ───────────────────────────────────────────

    const generateReference = () =>
        `VP-${Date.now()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const handleOpenPayment = (po) => {
        setPaymentPO(po);
        setPaymentForm({ ...emptyPayment, purchase_order_id: po.id, reference_no: generateReference() });
        setPaymentDialog(true);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        const amount = parseFloat(paymentForm.amount);
        const maxBalance = parseFloat(paymentPO?.balance_amount) || 0;

        if (!amount || amount <= 0) {
            showSnackbar('Enter a valid amount.', 'error'); return;
        }
        if (maxBalance > 0 && amount > maxBalance) {
            showSnackbar('Payment amount cannot exceed the outstanding balance.', 'error'); return;
        }
        try {
            setLoading(true);
            await dispatch(createVendorPayment({
                ...paymentForm,
                amount,
            })).unwrap();
            showSnackbar('Payment recorded successfully!');
            setPaymentDialog(false);
            await Promise.all([
                dispatch(getPurchaseOrders()),
                loadPaymentsForPO(paymentPO.id),
            ]);
        } catch (err) {
            showSnackbar(typeof err === 'string' ? err : 'Payment failed!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePayment = async (paymentId) => {
        try {
            setLoading(true);
            await dispatch(deleteVendorPayment(paymentId)).unwrap();
            showSnackbar('Payment deleted!');
            await Promise.all([
                dispatch(getPurchaseOrders()),
                loadPaymentsForPO(viewPO.id),
            ]);
            const res = await dispatch(getPurchaseOrderById(viewPO.id));
            if (res.meta.requestStatus === 'fulfilled') {
                setViewPO(res.payload.data);
            }
        } catch (err) {
            showSnackbar(typeof err === 'string' ? err : 'Delete failed!', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Filters ───────────────────────────────────────────

    const filtered = purchaseOrders.filter((po) => {
        const q = searchQuery.toLowerCase();
        const normalizedStatus = normalizePOStatus(po.status);
        return (
            (po.po_number?.toLowerCase().includes(q) ||
             po.vendor?.vendor_name?.toLowerCase().includes(q) ||
             po.vendor?.company_name?.toLowerCase().includes(q)) &&
            (statusFilter === 'all' || normalizedStatus === statusFilter) &&
            (vendorFilter === 'all' || String(po.vendor_id) === String(vendorFilter))
        );
    });

    const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const stats = {
        total:     purchaseOrders.length,
        pending:   purchaseOrders.filter((p) => normalizePOStatus(p.status) === 'pending').length,
        approved:  purchaseOrders.filter((p) => normalizePOStatus(p.status) === 'approved').length,
        return:    purchaseOrders.filter((p) => normalizePOStatus(p.status) === 'return').length,
        received:  purchaseOrders.filter((p) => normalizePOStatus(p.status) === 'received').length,
        cancelled: purchaseOrders.filter((p) => normalizePOStatus(p.status) === 'cancelled').length,
    };

    // ── Item Row ──────────────────────────────────────────

    const renderItemRow = (item, index) => {
        const linkedProduct = (products || []).find((p) => p.id === item.product_id) || null;
        const isNew         = !item.product_id && item.item_name?.trim();
        const rateError     = !item.rate || parseFloat(item.rate) <= 0;
        const nameError     = !item.item_name?.trim();

        return (
            <TableRow key={index} sx={{
                bgcolor: linkedProduct
                    ? 'rgba(17,153,142,0.03)'
                    : isNew ? 'rgba(102,126,234,0.03)' : 'transparent',
                verticalAlign: 'top',
            }}>

                {/* # */}
                <TableCell data-label="Item #" sx={{ color: '#94a3b8', fontWeight: 600, width: 40, pt: 1.5 }}>
                    {String(index + 1).padStart(2, '0')}
                </TableCell>

                {/* ✅ Product / Item — freeSolo Autocomplete (FIXED) */}
                <TableCell data-label="Product / Item" sx={{ minWidth: 220 }}>
                    <Autocomplete
                        freeSolo
                        size="small"
                        sx={{ width: '100%', minWidth: 0 }}
                        options={products || []}
                        getOptionLabel={(opt) =>
                            typeof opt === 'string' ? opt : opt.name || ''
                        }
                        value={linkedProduct || item.item_name || ''}
                        onChange={(_, newValue) => {
                            if (newValue && typeof newValue === 'object') {
                                // Dropdown se inventory product select kiya
                                handleProductSelect(index, newValue);
                            } else if (!newValue) {
                                // Clear button dabaya
                                handleItemTextChange(index, '');
                            }
                            // string case: onInputChange handles it
                        }}
                        // ✅ KEY FIX: sirf ek atomic call — race condition khatam
                        onInputChange={(_, value, reason) => {
                            if (reason === 'input') {
                                handleItemTextChange(index, value);
                            }
                        }}
                        filterOptions={(options, { inputValue }) =>
                            options.filter((o) =>
                                o.name?.toLowerCase().includes(inputValue.toLowerCase()) ||
                                o.sku?.toLowerCase().includes(inputValue.toLowerCase()) ||
                                o.hsn_code?.includes(inputValue)
                            ).slice(0, 20)
                        }
                        renderOption={(props, option) => (
                            <Box component="li" {...props} key={option.id}>
                                <Stack spacing={0.3} sx={{ py: 0.5, width: '100%' }}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" fontWeight={700}>
                                            {option.name}
                                        </Typography>
                                        <Chip
                                            label={
                                                option.is_out_of_stock ? 'Out of Stock' :
                                                option.is_low_stock    ? `Low: ${option.current_stock}` :
                                                `Stock: ${option.current_stock} ${option.unit}`
                                            }
                                            size="small"
                                            color={
                                                option.is_out_of_stock ? 'error' :
                                                option.is_low_stock    ? 'warning' : 'success'
                                            }
                                        />
                                    </Stack>
                                    <Stack direction="row" spacing={0.8} alignItems="center">
                                        {option.sku && (
                                            <Typography variant="caption" color="text.secondary">
                                                SKU: {option.sku}
                                            </Typography>
                                        )}
                                        {option.hsn_code && (
                                            <Chip label={`HSN: ${option.hsn_code}`} size="small"
                                                sx={{ height: 16, fontSize: 9, bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                                        )}
                                        <Chip
                                            label={`Buy: ₹${Number(option.purchase_price || 0).toLocaleString('en-IN')}`}
                                            size="small"
                                            sx={{ height: 16, fontSize: 9, bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 700 }}
                                        />
                                    </Stack>
                                </Stack>
                            </Box>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Search or enter a new name..."
                                error={nameError}
                                helperText={nameError ? 'Product naam required hai' : ''}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            <SpeechFieldButton onTranscript={(text) => handleItemTextChange(index, appendSpeech(item.item_name, text))} />
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                        bgcolor: linkedProduct ? 'rgba(17,153,142,0.05)' : 'transparent',
                                    },
                                }}
                            />
                        )}
                        noOptionsText="No inventory match found. It will be added automatically when the purchase order is received. 🆕"
                    />
                    {/* Badges */}
                    <Stack direction="row" spacing={0.5} mt={0.3} flexWrap="wrap">
                        {linkedProduct && (
                            <Chip
                                icon={<InventoryIcon sx={{ fontSize: '11px !important' }} />}
                                label="Inventory Linked"
                                size="small"
                                sx={{ height: 18, fontSize: 10, bgcolor: 'rgba(17,153,142,0.1)', color: '#11998e', fontWeight: 700 }}
                            />
                        )}
                        {linkedProduct?.sku && (
                            <Chip
                                label={`SKU: ${linkedProduct.sku}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: 10 }}
                            />
                        )}
                        {isNew && (
                            <Chip
                                icon={<AutoIcon sx={{ fontSize: '11px !important' }} />}
                                label="Will Be Created Automatically"
                                size="small"
                                sx={{ height: 18, fontSize: 10, bgcolor: 'rgba(102,126,234,0.1)', color: '#667eea', fontWeight: 700 }}
                            />
                        )}
                    </Stack>
                </TableCell>

                {/* HSN */}
                <TableCell data-label="HSN" sx={{ minWidth: 140 }}>
                    <Autocomplete
                        freeSolo size="small"
                        sx={{ width: '100%', minWidth: 0 }}
                        options={hsnCodes}
                        getOptionLabel={(opt) =>
                            typeof opt === 'string' ? opt : opt.hsn_code || ''
                        }
                        value={hsnCodes.find((h) => h.hsn_code === item.hsn_code) || item.hsn_code || ''}
                        onChange={(_, newValue) => {
                            if (typeof newValue === 'string') {
                                handleItemChange(index, 'hsn_code', newValue);
                            } else if (newValue) {
                                // HSN select hone par tax_rate bhi update karo
                                setFormData((prev) => {
                                    const updated = [...prev.items];
                                    updated[index] = calcItem({
                                        ...updated[index],
                                        hsn_code: newValue.hsn_code,
                                        tax_rate: newValue.tax_rate || updated[index].tax_rate,
                                    });
                                    return { ...prev, items: updated };
                                });
                            } else {
                                handleItemChange(index, 'hsn_code', '');
                            }
                        }}
                        onInputChange={(_, value) => handleItemChange(index, 'hsn_code', value)}
                        filterOptions={(options, { inputValue }) =>
                            options.filter((o) =>
                                o.hsn_code?.includes(inputValue) ||
                                o.description?.toLowerCase().includes(inputValue.toLowerCase())
                            ).slice(0, 15)
                        }
                        renderOption={(props, option) => (
                            <Box component="li" {...props} key={option.id}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2" fontWeight={700}>{option.hsn_code}</Typography>
                                    {option.tax_rate > 0 && (
                                        <Chip label={`${option.tax_rate}%`} size="small"
                                            sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontSize: 10, height: 18 }} />
                                    )}
                                    {option.description && (
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                            {option.description}
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>
                        )}
                        renderInput={(params) => (
                            <TextField {...params} placeholder="HSN..."
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        )}
                        noOptionsText="Type..."
                    />
                </TableCell>

                {/* Category ✅ NEW */}
                <TableCell data-label="Category" sx={{ minWidth: 130 }}>
                    <Select fullWidth size="small"
                        value={item.category_id || ''}
                        onChange={(e) => handleItemChange(index, 'category_id', e.target.value || null)}
                        displayEmpty
                        sx={{ borderRadius: '8px' }}>
                        <MenuItem value=""><em style={{ color: '#94a3b8' }}>Category</em></MenuItem>
                        {(categories || []).map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                        ))}
                    </Select>
                </TableCell>

                {/* Qty */}
                <TableCell data-label="Quantity" sx={{ minWidth: 80 }}>
                    <TextField fullWidth size="small" type="number"
                        inputProps={{ min: 0.01, step: 'any' }}
                        value={item.qty}
                        error={!item.qty || parseFloat(item.qty) <= 0}
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                </TableCell>

                {/* Unit */}
                <TableCell data-label="Unit" sx={{ minWidth: 80 }}>
                    <Select fullWidth size="small" value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        sx={{ borderRadius: '8px' }}>
                        {['pcs', 'kg', 'ltr', 'box', 'set', 'job', 'hr', 'mtr'].map((u) => (
                            <MenuItem key={u} value={u}>{u}</MenuItem>
                        ))}
                    </Select>
                </TableCell>

                {/* Rate ✅ — placeholder 0.00, error shown */}
                <TableCell data-label="Rate" sx={{ minWidth: 110 }}>
                    <TextField fullWidth size="small" type="number"
                        inputProps={{ min: 0.01, step: 'any' }}
                        placeholder="0.00"
                        value={item.rate}
                        error={rateError}
                        helperText={rateError ? 'Rate required' : ''}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                </TableCell>

                {/* Tax */}
                <TableCell data-label="Tax" sx={{ minWidth: 80 }}>
                    <Select fullWidth size="small" value={item.tax_rate}
                        onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                        sx={{ borderRadius: '8px' }}>
                        {[0, 5, 12, 18, 28].map((r) => (
                            <MenuItem key={r} value={r}>{r}%</MenuItem>
                        ))}
                    </Select>
                </TableCell>

                {/* Amount */}
                <TableCell data-label="Amount">
                    <Typography variant="body2" fontWeight={700} color="#667eea">
                        {fmt(item.amount)}
                    </Typography>
                </TableCell>

                {/* Remove */}
                <TableCell data-label="Remove" sx={{ textAlign: { xs: 'right', sm: 'left' } }}>
                    <IconButton size="small" color="error"
                        onClick={() => handleRemoveItem(index)}
                        sx={{ bgcolor: 'rgba(239,68,68,0.08)' }}>
                        <RemoveIcon fontSize="small" />
                    </IconButton>
                </TableCell>
            </TableRow>
        );
    };

    // ─────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────

    return (
        <>
            {loading && (
                <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
                    <LinearProgress />
                </Box>
            )}

            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* ══ HEADER ══ */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Paper elevation={0} sx={{
                        p: 2.5, mb: 3, borderRadius: '16px',
                        background: isDark
                            ? 'linear-gradient(135deg, #164e63 0%, #115e59 100%)'
                            : 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                        color: '#f0fdfa',
                    }}>
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            spacing={{ xs: 1.5, sm: 2 }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                                    🛒 Purchase Orders
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3, lineHeight: 1.4 }}>
                                    Create purchase orders. New products are added to inventory automatically.
                                </Typography>
                            </Box>
                            <Stack
                                direction="row"
                                useFlexGap
                                flexWrap="wrap"
                                justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                                sx={{ gap: 0.75, maxWidth: { xs: '100%', sm: '60%' } }}
                            >
                                {Object.entries(STATUS_CONFIG).filter(([key]) => key !== 'returned').map(([key, cfg]) => (
                                    <Chip key={key}
                                        label={`${stats[key]} ${cfg.label}`}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: '#f0fdfa', fontWeight: 600, flexShrink: 0 }}
                                    />
                                ))}
                            </Stack>
                        </Stack>
                    </Paper>
                </motion.div>

                {/* ── Info Banner ── */}
                <Alert severity="info" icon={<AutoIcon />} sx={{ mb: 3, borderRadius: '12px', fontWeight: 500 }}>
                    <strong>Automatic inventory update:</strong> Enter a new item. When the purchase order is received,
                    <strong> a product will be created automatically</strong> and stock will be updated!
                </Alert>

                {/* ══ STATS ══ */}
                <Grid container spacing={2} mb={3}>
                    {[
                        { label: 'Total',     value: stats.total,     color: '#667eea' },
                        { label: 'Pending',   value: stats.pending,   color: '#ed6c02' },
                        { label: 'Approved',  value: stats.approved,  color: '#1976d2' },
                        { label: 'Return',    value: stats.return,    color: '#ff9800' },   
                        { label: 'Received',  value: stats.received,  color: '#2e7d32' },
                        { label: 'Cancelled', value: stats.cancelled, color: '#ef4444' },
                    ].map((s, i) => (
                        <Grid item xs={4} sm={4} md={2} key={i}>
                            <motion.div whileHover={{ y: -2 }}>
                                <GlassCard>
                                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" fontWeight={800} color={s.color}>{s.value}</Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                                    </CardContent>
                                </GlassCard>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>

                {/* ══ ACTION BAR ══ */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: '16px' }} elevation={2}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth size="small"
                                placeholder="Search by PO number, vendor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            {searchQuery && (
                                                <IconButton size="small" onClick={() => setSearchQuery('')}><ClearIcon /></IconButton>
                                            )}
                                            <SpeechFieldButton onTranscript={(text) => setSearchQuery((prev) => appendSpeech(prev, text))} />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: '10px' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <Select fullWidth size="small" value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{ borderRadius: '10px' }}>
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="pending">⏳ Pending</MenuItem>
                                <MenuItem value="approved">✅ Approved</MenuItem>
                                <MenuItem value="return">🔄 Return</MenuItem>
                                <MenuItem value="received">📦 Received</MenuItem>
                                <MenuItem value="cancelled">❌ Cancelled</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <Select fullWidth size="small" value={vendorFilter}
                                onChange={(e) => setVendorFilter(e.target.value)}
                                sx={{ borderRadius: '10px' }}>
                                <MenuItem value="all">All Vendors</MenuItem>
                                {vendors.map((v) => (
                                    <MenuItem key={v.id} value={String(v.id)}>{v.vendor_name}</MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <GradientButton fullWidth startIcon={<RefreshIcon />} onClick={loadData}
                                gradient="linear-gradient(135deg, #667eea, #764ba2)">
                                Refresh
                            </GradientButton>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <GradientButton fullWidth
                                startIcon={showForm ? <CloseIcon /> : <AddIcon />}
                                onClick={showForm ? handleCancel : () => setShowForm(true)}
                                gradient={showForm
                                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                    : 'linear-gradient(135deg, #11998e, #38ef7d)'}>
                                {showForm ? 'Cancel' : 'New PO'}
                            </GradientButton>
                        </Grid>
                    </Grid>
                </Paper>

                {/* ══ CREATE FORM ══ */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.3 }}
                        >
                            <GlassCard sx={{ mb: 3 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                                        <Avatar sx={{ bgcolor: '#11998e', width: 44, height: 44 }}><AddIcon /></Avatar>
                                        <Box>
                                            <Typography variant="h6" fontWeight={700}>New Purchase Order</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Select an existing product or enter a new name. New products are added to inventory when the purchase order is received.
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Divider sx={{ mb: 3 }} />

                                    <Box component="form" onSubmit={handleSubmit} noValidate>
                                        <Grid container spacing={2.5}>

                                            {/* PO Details */}
                                            <Grid item xs={12}>
                                                <FormSection title="PO Details" icon={<POIcon sx={{ fontSize: 14 }} />} />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <Select fullWidth size="small" required
                                                    name="vendor_id" value={formData.vendor_id}
                                                    onChange={handleChange} displayEmpty
                                                    error={!formData.vendor_id}
                                                    sx={{ borderRadius: '10px' }}>
                                                    <MenuItem value=""><em>Select Vendor *</em></MenuItem>
                                                    {vendors.filter((v) => v.status === 'active').map((v) => (
                                                        <MenuItem key={v.id} value={v.id}>
                                                            <Stack>
                                                                <Typography variant="body2" fontWeight={600}>{v.vendor_name}</Typography>
                                                                {v.company_name && (
                                                                    <Typography variant="caption" color="text.secondary">{v.company_name}</Typography>
                                                                )}
                                                            </Stack>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <TextField fullWidth size="small" required
                                                    label="PO Date" type="date"
                                                    name="po_date" value={formData.po_date}
                                                    onChange={handleChange}
                                                    InputLabelProps={{ shrink: true }}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <TextField fullWidth size="small"
                                                    label="Expected Delivery" type="date"
                                                    name="expected_delivery_date"
                                                    value={formData.expected_delivery_date}
                                                    onChange={handleChange}
                                                    InputLabelProps={{ shrink: true }}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <TextField fullWidth size="small"
                                                    label="Notes" name="notes"
                                                    value={formData.notes} onChange={handleChange}
                                                    InputProps={{
                                                        endAdornment: <InputAdornment position="end"><SpeechFieldButton onTranscript={(text) => setFormData((prev) => ({ ...prev, notes: appendSpeech(prev.notes, text) }))} /></InputAdornment>,
                                                    }}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>

                                            {/* GST Details */}
                                            <Grid item xs={12}>
                                                <FormSection title="GST Details" icon={<POIcon sx={{ fontSize: 14 }} />} />
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Select fullWidth size="small"
                                                    name="supply_type" value={formData.supply_type}
                                                    onChange={handleChange} sx={{ borderRadius: '10px' }}>
                                                    <MenuItem value="intra">🏠 Intra-state</MenuItem>
                                                    <MenuItem value="inter">✈️ Inter-state</MenuItem>
                                                </Select>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Select fullWidth size="small"
                                                    name="place_of_supply" value={formData.place_of_supply}
                                                    onChange={handleChange} displayEmpty
                                                    sx={{ borderRadius: '10px' }}>
                                                    <MenuItem value=""><em>Place of Supply</em></MenuItem>
                                                    {INDIAN_STATES.map((s) => (
                                                        <MenuItem key={s.code} value={s.code}>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Chip label={s.code} size="small" variant="outlined"
                                                                    sx={{ minWidth: 32, fontSize: 10, fontWeight: 700 }} />
                                                                <Typography variant="body2">{s.name}</Typography>
                                                            </Stack>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Paper elevation={0}
                                                    onClick={() => setFormData((p) => ({ ...p, is_reverse_charge: !p.is_reverse_charge }))}
                                                    sx={{
                                                        height: 40, px: 2, borderRadius: '10px',
                                                        border: '1px solid',
                                                        borderColor: formData.is_reverse_charge ? '#ed6c02' : 'divider',
                                                        bgcolor: formData.is_reverse_charge ? 'rgba(237,108,2,0.06)' : 'background.paper',
                                                        cursor: 'pointer', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'space-between',
                                                    }}>
                                                    <Typography variant="body2" fontWeight={500}
                                                        color={formData.is_reverse_charge ? '#ed6c02' : 'text.secondary'}>
                                                        {formData.is_reverse_charge ? '⚠️ RCM Applicable' : 'Reverse Charge'}
                                                    </Typography>
                                                    <Chip size="small"
                                                        label={formData.is_reverse_charge ? 'YES' : 'NO'}
                                                        color={formData.is_reverse_charge ? 'warning' : 'default'} />
                                                </Paper>
                                            </Grid>

                                            {/* Items */}
                                            <Grid item xs={12}>
                                                <FormSection title="Items — select from inventory or enter a new name"
                                                    icon={<AddIcon sx={{ fontSize: 14 }} />} />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TableContainer component={Paper} elevation={0}
                                                    sx={{
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '12px',
                                                        overflowX: { xs: 'hidden', sm: 'auto' },
                                                        overflowY: 'visible',
                                                        '@media (max-width:599.95px)': {
                                                            border: 'none',
                                                            boxShadow: 'none',
                                                            background: 'transparent',
                                                        },
                                                    }}>
                                                    <Table size="small" sx={{
                                                        '@media (max-width:599.95px)': {
                                                            display: 'block',
                                                            width: '100%',
                                                            '& thead': { display: 'none' },
                                                            '& tbody': { display: 'grid', gap: 1.5 },
                                                            '& tbody tr': {
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                width: '100%',
                                                                boxSizing: 'border-box',
                                                                border: '1px solid #e2e8f0',
                                                                borderRadius: '12px',
                                                                overflow: 'hidden',
                                                                backgroundColor: 'background.paper',
                                                            },
                                                            '& tbody td': {
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                width: '100%',
                                                                minWidth: 0,
                                                                boxSizing: 'border-box',
                                                                py: 1,
                                                                px: 1.5,
                                                                borderBottom: '1px solid',
                                                                borderColor: 'divider',
                                                                '&:last-of-type': { borderBottom: 0 },
                                                                '&::before': {
                                                                    content: 'attr(data-label)',
                                                                    width: '82px',
                                                                    flex: '0 0 82px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 700,
                                                                    color: 'text.secondary',
                                                                },
                                                            },
                                                            '& tbody td:first-of-type': {
                                                                justifyContent: 'flex-start',
                                                                minHeight: 36,
                                                                bgcolor: 'action.hover',
                                                            },
                                                            '& tbody td:last-of-type': { justifyContent: 'space-between' },
                                                            '& .MuiAutocomplete-root': { flex: 1, minWidth: 0 },
                                                            '& .MuiFormControl-root, & .MuiInputBase-root': {
                                                                flex: 1,
                                                                width: 'auto',
                                                                minWidth: 0,
                                                            },
                                                            '& tbody td:nth-of-type(2)': { flexWrap: 'wrap' },
                                                            '& tbody td:nth-of-type(2) .MuiAutocomplete-root': {
                                                                flex: '0 0 calc(100% - 90px)',
                                                            },
                                                            '& tbody td:nth-of-type(2) > .MuiStack-root': {
                                                                width: 'calc(100% - 90px)',
                                                                ml: '90px',
                                                            },
                                                        },
                                                    }}>
                                                        <TableHead>
                                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                                {['#', 'Product / Item *', 'HSN', 'Category', 'Qty *', 'Unit', 'Rate *', 'Tax %', 'Amount', ''].map((h) => (
                                                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, py: 1.5 }}>{h}</TableCell>
                                                                ))}
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {formData.items.map((item, index) =>
                                                                renderItemRow(item, index)
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>

                                                <Button startIcon={<AddIcon />} onClick={handleAddItem}
                                                    size="small" sx={{ mt: 1.5, borderRadius: '8px', textTransform: 'none' }}>
                                                    Add Item
                                                </Button>
                                            </Grid>

                                            {/* Totals */}
                                            <Grid item xs={12}>
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Paper elevation={0} sx={{
                                                        p: 2, borderRadius: '12px',
                                                        border: '1px solid #e2e8f0', minWidth: 280,
                                                    }}>
                                                        {[
                                                            { label: 'Subtotal', value: totals.subTotal },
                                                            ...(totals.cgst > 0 ? [{ label: 'CGST', value: totals.cgst }] : []),
                                                            ...(totals.sgst > 0 ? [{ label: 'SGST', value: totals.sgst }] : []),
                                                            ...(totals.igst > 0 ? [{ label: 'IGST', value: totals.igst }] : []),
                                                        ].map((row) => (
                                                            <Stack key={row.label} direction="row" justifyContent="space-between" mb={0.8}>
                                                                <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                                                                <Typography variant="body2" fontWeight={600}>{fmt(row.value)}</Typography>
                                                            </Stack>
                                                        ))}
                                                        <Divider sx={{ my: 1 }} />
                                                        <Stack direction="row" justifyContent="space-between">
                                                            <Typography variant="subtitle2" fontWeight={800}>Grand Total</Typography>
                                                            <Typography variant="subtitle2" fontWeight={800} color="#667eea">
                                                                {fmt(totals.grandTotal)}
                                                            </Typography>
                                                        </Stack>
                                                    </Paper>
                                                </Box>
                                            </Grid>

                                            {/* Submit */}
                                            <Grid item xs={12}>
                                                <Divider sx={{ mb: 2 }} />
                                                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                                                    <Button variant="outlined" onClick={handleCancel}
                                                        startIcon={<CloseIcon />} sx={{ borderRadius: '10px' }}>
                                                        Cancel
                                                    </Button>
                                                    <GradientButton type="submit" disabled={actionLoading || loading}
                                                        startIcon={<SaveIcon />}
                                                        gradient="linear-gradient(135deg, #11998e, #38ef7d)">
                                                        {(actionLoading || loading) ? 'Creating...' : 'Create PO'}
                                                    </GradientButton>
                                                </Stack>
                                            </Grid>

                                        </Grid>
                                    </Box>
                                </CardContent>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ══ TABLE ══ */}
                <GlassCard>
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        {['PO Number', 'Vendor', 'Date', 'Amount', 'Paid', 'Balance', 'Status', 'Actions'].map((h) => (
                                            <TableCell key={h} sx={{ fontWeight: 700, py: 2 }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                                <Typography color="text.secondary">Loading...</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginated.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                                <Stack alignItems="center" spacing={2}>
                                                    <Avatar sx={{ width: 72, height: 72, bgcolor: '#f1f5f9' }}>
                                                        <POIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
                                                    </Avatar>
                                                    <Typography variant="h6" color="text.secondary">
                                                        No purchase orders found.
                                                    </Typography>
                                                    <GradientButton startIcon={<AddIcon />}
                                                        onClick={() => setShowForm(true)}
                                                        gradient="linear-gradient(135deg, #11998e, #38ef7d)">
                                                        Create Your First Purchase Order
                                                    </GradientButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginated.map((po) => (
                                        <StyledTableRow key={po.id}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700} color="#11998e">
                                                    {po.po_number}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {fmtDate(po.po_date)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Avatar sx={{ bgcolor: '#667eea', width: 32, height: 32, fontSize: 14 }}>
                                                        {po.vendor?.vendor_name?.charAt(0)?.toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{po.vendor?.vendor_name}</Typography>
                                                        {po.vendor?.company_name && (
                                                            <Typography variant="caption" color="text.secondary">{po.vendor.company_name}</Typography>
                                                        )}
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{fmtDate(po.po_date)}</Typography>
                                                {po.expected_delivery_date && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Due: {fmtDate(po.expected_delivery_date)}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700}>{fmt(po.total_amount)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} color="success.main">
                                                    {fmt(po.paid_amount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}
                                                    color={po.balance_amount > 0 ? 'error.main' : 'success.main'}>
                                                    {fmt(po.balance_amount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell><StatusChip status={po.status} /></TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5}>
                                                    <Tooltip title="View" TransitionComponent={Zoom}>
                                                        <IconButton size="small" color="info"
                                                            onClick={() => handleView(po)}
                                                            sx={{ bgcolor: 'rgba(59,130,246,0.1)' }}>
                                                            <ViewIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {po.can_approve && (
                                                        <Tooltip title="Approve" TransitionComponent={Zoom}>
                                                            <IconButton size="small" color="info"
                                                                onClick={() => handleStatusClick(po, 'approved')}
                                                                sx={{ bgcolor: 'rgba(25,118,210,0.1)' }}>
                                                                <ApproveIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {po.can_receive && (
                                                        <Tooltip title="Mark Received" TransitionComponent={Zoom}>
                                                            <IconButton size="small" color="success"
                                                                onClick={() => handleStatusClick(po, 'received')}
                                                                sx={{ bgcolor: 'rgba(46,125,50,0.1)' }}>
                                                                <ReceiveIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {po.status !== 'cancelled' && po.balance_amount > 0 && (
                                                        <Tooltip title="Add Payment" TransitionComponent={Zoom}>
                                                            <IconButton size="small" color="success"
                                                                onClick={() => handleOpenPayment(po)}
                                                                sx={{ bgcolor: 'rgba(17,153,142,0.1)' }}>
                                                                <PaymentIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {po.can_cancel && (
                                                        <Tooltip title="Cancel PO" TransitionComponent={Zoom}>
                                                            <IconButton size="small" color="warning"
                                                                onClick={() => handleStatusClick(po, 'cancelled')}
                                                                sx={{ bgcolor: 'rgba(237,108,2,0.1)' }}>
                                                                <CancelIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {po.status === 'pending' && (
                                                        <Tooltip title="Delete PO" TransitionComponent={Zoom}>
                                                            <IconButton size="small" color="error"
                                                                onClick={() => handleDeleteConfirm(po)}
                                                                sx={{ bgcolor: 'rgba(239,68,68,0.1)' }}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </StyledTableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={filtered.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(_, p) => setPage(p)}
                            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                            sx={{ borderTop: '1px solid #e2e8f0' }}
                        />
                    </CardContent>
                </GlassCard>

                {/* ══ VIEW DIALOG ══ */}
                <Dialog open={viewDialog} onClose={() => {
                    setViewDialog(false);
                    dispatch(clearVendorPayments());
                }}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: '16px',
                            bgcolor: theme.palette.background.paper,
                            color: theme.palette.text.primary,
                            overflow: 'hidden',
                            maxHeight: { xs: 'calc(100dvh - 24px)', sm: '90vh' },
                            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                        }
                    }}>
                    <Box sx={{
                        px: { xs: 2, sm: 4 },
                        py: { xs: 1.5, sm: 2.5 },
                        borderBottom: '1px solid rgba(17, 153, 142, 0.12)',
                        display: 'flex',
                        flexWrap: { xs: 'wrap', sm: 'nowrap' },
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: { xs: 1, sm: 2 },
                        bgcolor: isDark ? theme.palette.background.paper : 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(10px)',
                    }}>
                        <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }} sx={{ minWidth: 0, flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
                            <Avatar sx={{
                                bgcolor: '#11998e',
                                width: { xs: 36, sm: 40 },
                                height: { xs: 36, sm: 40 },
                                flexShrink: 0,
                                boxShadow: '0 4px 10px rgba(17,153,142,0.2)'
                            }}>
                                <POIcon sx={{ fontSize: 22 }} />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' }, color: (isDark ? '#f1f5f9' : '#1e293b'), letterSpacing: '-0.3px', overflowWrap: 'anywhere' }}>
                                    Purchase Order {viewPO?.po_number}
                                </Typography>
                                <Typography variant="caption" sx={{ color: (isDark ? '#94a3b8' : '#64748b'), display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <DateRangeIcon sx={{ fontSize: 14 }} />
                                    {fmtDate(viewPO?.po_date)}
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="center" justifyContent="space-between" sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}>
                            <StatusChip status={viewPO?.status} />
                            <IconButton
                                onClick={() => {
                                    setViewDialog(false);
                                    dispatch(clearVendorPayments());
                                }}
                                sx={{
                                    color: (isDark ? '#94a3b8' : '#64748b'),
                                    bgcolor: (isDark ? '#334155' : '#f1f5f9'),
                                    '&:hover': { bgcolor: (isDark ? '#475569' : '#e2e8f0') }
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Box>
                    <DialogContent sx={{ p: 0, bgcolor: (isDark ? '#1e293b' : '#ffffff') }}>
                        {viewPO && (
                                    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: '100%' }}>
                                <Grid container spacing={3} sx={{ mb: 4 }}>
                                    <Grid item xs={12} md={7}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, minWidth: 0 }}>
                                                <Box sx={{
                                                width: { xs: 56, sm: 90 },
                                                height: { xs: 56, sm: 90 },
                                                flexShrink: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                                borderRadius: '14px',
                                                boxShadow: '0 10px 25px rgba(17,153,142,0.22)'
                                            }}>
                                                <Typography variant="h2" sx={{ fontWeight: 800, color: 'white', fontSize: { xs: '28px', sm: '42px' } }}>
                                                    {(viewPO?.vendor?.company_name || viewPO?.vendor?.vendor_name || 'P').charAt(0)}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="h5" sx={{
                                                    fontWeight: 800,
                                                    color: (isDark ? '#f1f5f9' : '#0f172a'),
                                                    mb: 0.8,
                                                    letterSpacing: '-0.5px',
                                                    fontSize: { xs: '1.15rem', sm: '26px' },
                                                    overflowWrap: 'anywhere'
                                                }}>
                                                    {viewPO?.vendor?.company_name || viewPO?.vendor?.vendor_name || 'Vendor'}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: (isDark ? '#94a3b8' : '#64748b') }}>
                                                    {viewPO?.vendor?.vendor_name && viewPO?.vendor?.company_name ? viewPO.vendor.vendor_name : 'Vendor Details'}
                                                </Typography>
                                                {viewPO?.vendor?.address && (
                                                    <Typography variant="body2" sx={{ color: (isDark ? '#94a3b8' : '#64748b'), mt: 0.8 }}>
                                                        📍 {viewPO.vendor.address}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        <Box sx={{
                                            mt: 2,
                                            ml: { xs: 0, md: '115px' },
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 1.5,
                                            alignItems: 'center'
                                        }}>
                                            {viewPO?.vendor?.phone && (
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    bgcolor: (isDark ? '#1e293b' : '#f8fafc'),
                                                    px: 1.5,
                                                    py: 0.8,
                                                    borderRadius: '30px',
                                                    border: '1px solid #e2e8f0'
                                                }}>
                                                    📞
                                                    <Typography variant="caption" sx={{ fontWeight: 500, color: (isDark ? '#cbd5e1' : '#334155') }}>
                                                        {viewPO.vendor.phone}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {viewPO?.vendor?.email && (
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    bgcolor: (isDark ? '#1e293b' : '#f8fafc'),
                                                    px: 1.5,
                                                    py: 0.8,
                                                    borderRadius: '30px',
                                                    border: '1px solid #e2e8f0'
                                                }}>
                                                    ✉️
                                                    <Typography variant="caption" sx={{ fontWeight: 500, color: (isDark ? '#cbd5e1' : '#334155') }}>
                                                        {viewPO.vendor.email}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {viewPO?.vendor?.gstin && (
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    bgcolor: '#f0fdf4',
                                                    px: 1.5,
                                                    py: 0.8,
                                                    borderRadius: '30px',
                                                    border: '1px solid #bbf7d0'
                                                }}>
                                                    <span style={{ fontWeight: 700, color: '#15803d' }}>GST</span>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#166534' }}>
                                                        {viewPO.vendor.gstin}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                                        <Typography variant="h2" sx={{
                                            fontWeight: 800,
                                            color: (isDark ? '#f1f5f9' : '#0f172a'),
                                            mb: 1.5,
                                            fontSize: { xs: '24px', sm: '34px' },
                                            letterSpacing: { xs: '0.5px', sm: '2px' },
                                            overflowWrap: 'anywhere',
                                        }}>
                                            PURCHASE ORDER
                                        </Typography>

                                        <Box sx={{
                                            display: 'inline-block',
                                            textAlign: 'left',
                                            bgcolor: (isDark ? '#1e293b' : '#f8fafc'),
                                            p: 2.5,
                                            borderRadius: '12px',
                                            width: '100%',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                                        }}>
                                            {[
                                                ['PO Number', viewPO?.po_number],
                                                ['PO Date', fmtDate(viewPO?.po_date)],
                                                ['Expected Delivery', fmtDate(viewPO?.expected_delivery_date)],
                                            ].map(([label, value]) => (
                                                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body2" sx={{ color: (isDark ? '#94a3b8' : '#64748b'), fontWeight: 500 }}>{label}</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: (isDark ? '#f1f5f9' : '#0f172a') }}>{value || '—'}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3.5, borderColor: (isDark ? '#475569' : '#e2e8f0'), borderWidth: '1.5px', opacity: 0.7 }} />

                                <Grid container spacing={3} sx={{ mb: 4 }}>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                                            <Box sx={{
                                                bgcolor: '#11998e',
                                                width: '8px',
                                                height: '50px',
                                                borderRadius: '4px',
                                                mt: 0.5
                                            }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle1" sx={{
                                                    fontWeight: 700,
                                                    color: (isDark ? '#f1f5f9' : '#0f172a'),
                                                    mb: 1.5,
                                                    fontSize: '15px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}>
                                                    <BusinessIcon sx={{ color: '#11998e', fontSize: 20 }} />
                                                    Vendor Details
                                                </Typography>

                                                <Box sx={{
                                                    bgcolor: (isDark ? '#1e293b' : '#ffffff'),
                                                    p: 3,
                                                    borderRadius: '16px',
                                                    border: '1px solid #e2e8f0',
                                                    boxShadow: '0 8px 20px rgba(0,0,0,0.02)',
                                                    display: 'grid',
                                                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                                    gap: 3
                                                }}>
                                                    <Box>
                                                        <Typography variant="h6" sx={{
                                                            fontWeight: 700,
                                                            color: (isDark ? '#f1f5f9' : '#0f172a'),
                                                            mb: 1.5,
                                                            fontSize: '18px'
                                                        }}>
                                                            {viewPO?.vendor?.vendor_name || 'Vendor'}
                                                        </Typography>
                                                        {viewPO?.vendor?.company_name && (
                                                            <Typography variant="body2" sx={{ color: (isDark ? '#cbd5e1' : '#475569'), mb: 1, fontSize: '14px' }}>
                                                                <span style={{ color: (isDark ? '#94a3b8' : '#64748b') }}>Company:</span> {viewPO.vendor.company_name}
                                                            </Typography>
                                                        )}
                                                        <Typography variant="body2" sx={{ color: (isDark ? '#cbd5e1' : '#475569'), mb: 0.8, fontSize: '14px' }}>
                                                            <span style={{ color: (isDark ? '#94a3b8' : '#64748b') }}>Address:</span> {viewPO?.vendor?.address || '—'}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: (isDark ? '#cbd5e1' : '#475569'), mb: 0.8, fontSize: '14px' }}>
                                                            <span style={{ color: (isDark ? '#94a3b8' : '#64748b') }}>City/State:</span>{' '}
                                                            {[viewPO?.vendor?.city, viewPO?.vendor?.state, viewPO?.vendor?.pincode].filter(Boolean).join(', ') || '—'}
                                                        </Typography>
                                                    </Box>

                                                    <Box>
                                                        <Typography variant="body2" sx={{ color: (isDark ? '#cbd5e1' : '#475569'), mb: 1, fontSize: '14px' }}>
                                                            <span style={{ color: (isDark ? '#94a3b8' : '#64748b') }}>Phone:</span> {viewPO?.vendor?.phone || '—'}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: (isDark ? '#cbd5e1' : '#475569'), mb: 1, fontSize: '14px' }}>
                                                            <span style={{ color: (isDark ? '#94a3b8' : '#64748b') }}>Email:</span> {viewPO?.vendor?.email || '—'}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: (isDark ? '#cbd5e1' : '#475569'), mb: 1, fontSize: '14px' }}>
                                                            <span style={{ color: (isDark ? '#94a3b8' : '#64748b') }}>Supply Type:</span>{' '}
                                                            {viewPO?.supply_type === 'intra' ? 'Intra-state' : 'Inter-state'}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: (isDark ? '#cbd5e1' : '#475569'), fontSize: '14px' }}>
                                                            <span style={{ color: (isDark ? '#94a3b8' : '#64748b') }}>Place of Supply:</span> {viewPO?.place_of_supply || '—'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Typography variant="subtitle1" sx={{
                                    fontWeight: 700,
                                    color: (isDark ? '#f1f5f9' : '#0f172a'),
                                    mb: 2,
                                    fontSize: '15px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <DescriptionIcon sx={{ color: '#11998e', fontSize: 20 }} />
                                    PO Items
                                </Typography>

                                <Stack spacing={1.5} sx={{ display: { xs: 'flex', sm: 'none' }, mb: 3 }}>
                                    {(viewPO.items || []).map((item, index) => (
                                        <Paper
                                            key={index}
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: '12px',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                bgcolor: isDark ? '#111827' : '#fff',
                                            }}
                                        >
                                            <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', overflowWrap: 'anywhere' }}>
                                                        {String(index + 1).padStart(2, '0')}. {item.item_name}
                                                    </Typography>
                                                    {item.description && (
                                                        <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', mt: 0.5, overflowWrap: 'anywhere' }}>
                                                            {item.description}
                                                        </Typography>
                                                    )}
                                                    {item.sku && (
                                                        <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', mt: 0.4 }}>
                                                            SKU: {item.sku}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Typography variant="subtitle2" sx={{ flexShrink: 0, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                                                    {fmt(item.amount)}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={1} mt={1}>
                                                <Chip
                                                    label={item.product_id ? 'Linked' : 'Auto Created'}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: 10,
                                                        bgcolor: item.product_id ? 'rgba(17,153,142,0.12)' : 'rgba(102,126,234,0.12)',
                                                        color: item.product_id ? (isDark ? '#5eead4' : '#11998e') : (isDark ? '#c4b5fd' : '#667eea'),
                                                    }}
                                                />
                                            </Stack>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.25, mt: 1.5 }}>
                                                {[
                                                    ['HSN', item.hsn_code || '—'],
                                                    ['Quantity', `${item.qty} ${item.unit || ''}`],
                                                    ['Rate', fmt(item.rate)],
                                                    ['Tax', `${item.tax_rate}%`],
                                                ].map(([label, value]) => (
                                                    <Box key={label} sx={{ minWidth: 0 }}>
                                                        <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block' }}>
                                                            {label}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: isDark ? '#e2e8f0' : '#334155', fontWeight: 600, overflowWrap: 'anywhere' }}>
                                                            {value}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Paper>
                                    ))}
                                </Stack>

                                <TableContainer sx={{
                                    display: { xs: 'none', sm: 'block' },
                                    mb: 3,
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '16px',
                                    overflowX: 'auto',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.02)'
                                }}>
                                    <Table size="small" sx={{ minWidth: 760 }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: (isDark ? '#1e293b' : '#f8fafc'), borderBottom: '2px solid #11998e' }}>
                                                {['#', 'Item Description', 'HSN', 'Qty', 'Rate (₹)', 'Tax %', 'Amount (₹)'].map((h, index) => (
                                                    <TableCell
                                                        key={h}
                                                        align={index >= 4 ? 'right' : index === 3 ? 'center' : 'left'}
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: (isDark ? '#f1f5f9' : '#0f172a'),
                                                            fontSize: '13px',
                                                            py: 2,
                                                            borderBottom: 'none'
                                                        }}
                                                    >
                                                        {h}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {(viewPO.items || []).map((item, index) => (
                                                <TableRow key={index} sx={{ '&:last-child td': { borderBottom: 'none' }, '&:hover': { bgcolor: (isDark ? '#1e293b' : '#f8fafc') } }}>
                                                    <TableCell sx={{ color: (isDark ? '#94a3b8' : '#64748b'), py: 2, fontSize: '14px', fontWeight: 600 }}>
                                                        {String(index + 1).padStart(2, '0')}
                                                    </TableCell>
                                                    <TableCell sx={{ py: 2 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: (isDark ? '#f1f5f9' : '#0f172a'), fontSize: '14px', mb: 0.3 }}>
                                                            {item.item_name}
                                                        </Typography>
                                                        {item.description && (
                                                            <Typography variant="caption" sx={{ color: (isDark ? '#94a3b8' : '#64748b'), display: 'block', fontSize: '12px', lineHeight: 1.5 }}>
                                                                {item.description}
                                                            </Typography>
                                                        )}
                                                        {item.sku && (
                                                            <Typography variant="caption" sx={{ color: (isDark ? '#94a3b8' : '#64748b'), display: 'block', mt: 0.4 }}>
                                                                SKU: {item.sku}
                                                            </Typography>
                                                        )}
                                                        <Stack direction="row" spacing={1} mt={0.8}>
                                                            {item.product_id ? (
                                                                <Chip
                                                                    icon={<InventoryIcon sx={{ fontSize: '11px !important' }} />}
                                                                    label="Linked"
                                                                    size="small"
                                                                    sx={{ height: 20, fontSize: 10, bgcolor: 'rgba(17,153,142,0.1)', color: '#11998e' }}
                                                                />
                                                            ) : (
                                                                <Chip
                                                                    icon={<AutoIcon sx={{ fontSize: '11px !important' }} />}
                                                                    label="Auto Created"
                                                                    size="small"
                                                                    sx={{ height: 20, fontSize: 10, bgcolor: 'rgba(102,126,234,0.1)', color: '#667eea' }}
                                                                />
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell sx={{ color: (isDark ? '#cbd5e1' : '#475569'), py: 2, fontSize: '13px', fontWeight: 500 }}>
                                                        {item.hsn_code || '—'}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ color: (isDark ? '#f1f5f9' : '#0f172a'), py: 2, fontSize: '14px', fontWeight: 600 }}>
                                                        {item.qty} {item.unit}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ color: (isDark ? '#cbd5e1' : '#475569'), py: 2, fontSize: '14px', fontWeight: 500 }}>
                                                        {fmt(item.rate)}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ color: (isDark ? '#cbd5e1' : '#475569'), py: 2, fontSize: '14px', fontWeight: 500 }}>
                                                        {item.tax_rate}%
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700, color: (isDark ? '#f1f5f9' : '#0f172a'), py: 2, fontSize: '15px', bgcolor: (isDark ? '#1e293b' : '#f8fafc') }}>
                                                        {fmt(item.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Grid container spacing={3} justifyContent="space-between" sx={{ mb: 3 }}>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{
                                            p: 3,
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '16px',
                                            bgcolor: (isDark ? '#1e293b' : '#ffffff'),
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.02)'
                                        }}>
                                            <Typography variant="subtitle2" sx={{
                                                fontWeight: 800,
                                                color: (isDark ? '#f1f5f9' : '#0f172a'),
                                                mb: 1.2,
                                                fontSize: '14px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <DescriptionIcon sx={{ color: '#11998e', fontSize: 18 }} />
                                                PO Notes / Terms
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: (isDark ? '#cbd5e1' : '#475569'), whiteSpace: 'pre-line', fontSize: '14px', lineHeight: '1.7' }}>
                                                {viewPO?.notes || viewPO?.terms_conditions || 'No notes added.'}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} md={5.5}>
                                        <Box sx={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.02)',
                                            bgcolor: (isDark ? '#1e293b' : '#ffffff')
                                        }}>
                                            <Table size="small" sx={{
                                                width: '100%',
                                                tableLayout: 'fixed',
                                                '& .MuiTableCell-root': {
                                                    px: { xs: 1.25, sm: 2 },
                                                    overflowWrap: 'anywhere',
                                                },
                                            }}>
                                                <TableBody>
                                                    {[
                                                        ['Subtotal', fmt(viewPO?.sub_total)],
                                                        ['CGST', fmt(viewPO?.cgst)],
                                                        ['SGST', fmt(viewPO?.sgst)],
                                                        ['IGST', fmt(viewPO?.igst)],
                                                    ].map(([label, value], index) => (
                                                        <TableRow key={label}>
                                                            <TableCell sx={{
                                                                borderBottom: index === 3 ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
                                                                color: (isDark ? '#cbd5e1' : '#475569'),
                                                                py: 1.9,
                                                                fontSize: '14px',
                                                                bgcolor: index === 0 ? (isDark ? '#1e293b' : '#f8fafc') : 'transparent'
                                                            }}>
                                                                {label}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{
                                                                borderBottom: '1px solid #e2e8f0',
                                                                fontWeight: index === 0 ? 600 : 500,
                                                                color: (isDark ? '#f1f5f9' : '#0f172a'),
                                                                py: 1.9,
                                                                fontSize: '14px',
                                                                bgcolor: index === 0 ? (isDark ? '#1e293b' : '#f8fafc') : 'transparent'
                                                            }}>
                                                                {value}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 800, color: (isDark ? '#f1f5f9' : '#0f172a'), py: 2.2, fontSize: '16px', bgcolor: (isDark ? '#334155' : '#f1f5f9') }}>
                                                            Grand Total
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 800, color: (isDark ? '#f1f5f9' : '#0f172a'), py: 2.2, fontSize: '18px', bgcolor: (isDark ? '#334155' : '#f1f5f9') }}>
                                                            {fmt(viewPO?.total_amount)}
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ color: '#166534', py: 1.8, fontSize: '14px', fontWeight: 700, pl: 4 }}>
                                                            Paid Amount
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ color: '#166534', fontWeight: 700, py: 1.8, fontSize: '15px' }}>
                                                            {fmt(viewPO?.paid_amount)}
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 800, color: '#b91c1c', py: 2, fontSize: '15px', pl: 4, borderTop: '1px dashed #e2e8f0' }}>
                                                            Balance Due
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 800, color: '#b91c1c', py: 2, fontSize: '16px', borderTop: '1px dashed #e2e8f0' }}>
                                                            {fmt(viewPO?.balance_amount)}
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{
                                            p: 3,
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '16px',
                                            bgcolor: (isDark ? '#1e293b' : '#ffffff'),
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.02)'
                                        }}>
                                            <Typography variant="subtitle2" sx={{
                                                fontWeight: 800,
                                                color: (isDark ? '#f1f5f9' : '#0f172a'),
                                                mb: 2,
                                                fontSize: '14px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                            }}>
                                                GST / Payment Summary
                                            </Typography>
                                            {[
                                                ['Supply Type', viewPO?.supply_type === 'intra' ? 'Intra-state' : 'Inter-state'],
                                                ['Place of Supply', viewPO?.place_of_supply || '—'],
                                                ['RCM', viewPO?.is_reverse_charge ? 'Applicable' : 'Not Applicable'],
                                                ['Payments Count', payments.length],
                                            ].map(([label, value]) => (
                                                <Stack key={label} direction="row" justifyContent="space-between" sx={{ mb: 1.2 }}>
                                                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                                                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                                                </Stack>
                                            ))}
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Box sx={{
                                            p: 3,
                                            borderRadius: '16px',
                                            bgcolor: Number(viewPO?.balance_amount || 0) > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(46,125,50,0.06)',
                                            border: '1px solid',
                                            borderColor: Number(viewPO?.balance_amount || 0) > 0 ? '#fecaca' : '#86efac',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.02)'
                                        }}>
                                            <Typography variant="subtitle2" sx={{
                                                fontWeight: 800,
                                                color: (isDark ? '#f1f5f9' : '#0f172a'),
                                                mb: 1.5,
                                                fontSize: '14px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                            }}>
                                                Payment Status
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.8 }}>
                                                Total: <b>{fmt(viewPO?.total_amount)}</b><br />
                                                Paid: <b style={{ color: '#2e7d32' }}>{fmt(viewPO?.paid_amount)}</b><br />
                                                Balance: <b style={{ color: '#ef4444' }}>{fmt(viewPO?.balance_amount)}</b>
                                            </Typography>
                                            {Number(viewPO?.balance_amount || 0) > 0 && viewPO?.status !== 'cancelled' && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<PaymentIcon />}
                                                    onClick={() => {
                                                        setViewDialog(false);
                                                        dispatch(clearVendorPayments());
                                                        handleOpenPayment(viewPO);
                                                    }}
                                                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                                                >
                                                    Make Payment
                                                </Button>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle2" sx={{
                                        fontWeight: 800,
                                        color: (isDark ? '#f1f5f9' : '#0f172a'),
                                        mb: 1.5,
                                        fontSize: '14px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                    }}>
                                        Payment History
                                    </Typography>
                                    {payments.length === 0 ? (
                                        <Box sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '16px', bgcolor: (isDark ? '#1e293b' : '#f8fafc') }}>
                                            <Typography variant="body2" color="text.secondary" textAlign="center">
                                                No payments recorded yet.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Stack spacing={1.5}>
                                            {payments.map((p) => (
                                                <Paper key={p.id} elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Stack>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Typography variant="body2" fontWeight={700} color="success.main">{fmt(p.amount)}</Typography>
                                                                <Chip label={p.payment_method_label} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                                                            </Stack>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {p.payment_date_formatted}{p.reference_no && ` · Ref: ${p.reference_no}`}
                                                            </Typography>
                                                        </Stack>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeletePayment(p.id)}
                                                            sx={{ bgcolor: 'rgba(239,68,68,0.08)' }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2, gap: 1, flexWrap: 'wrap' }}>
                        {viewPO?.can_approve && (
                            <GradientButton size="small" startIcon={<ApproveIcon />}
                                onClick={() => handleStatusClick(viewPO, 'approved')}
                                gradient="linear-gradient(135deg, #1976d2, #42a5f5)">
                                Approve
                            </GradientButton>
                        )}
                        {viewPO?.can_receive && (
                            <GradientButton size="small" startIcon={<ReceiveIcon />}
                                onClick={() => handleStatusClick(viewPO, 'received')}
                                gradient="linear-gradient(135deg, #2e7d32, #43a047)">
                                Mark Received
                            </GradientButton>
                        )}
                        {/* ✅ Purchase Return — sirf received PO pe */}
                        {viewPO?.status === 'received' && (
                            <GradientButton size="small" startIcon={<ReturnIcon />}
                                onClick={() => {
                                    setViewDialog(false);
                                    dispatch(clearVendorPayments());
                                    setPoToReturn(viewPO);
                                    setReturnDialog(true);
                                }}
                                gradient="linear-gradient(135deg, #f59e0b, #d97706)">
                                Return to Vendor
                            </GradientButton>
                        )}
                        {viewPO?.can_cancel && (
                            <Button size="small" color="error" variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={() => handleStatusClick(viewPO, 'cancelled')}
                                sx={{ borderRadius: '8px', textTransform: 'none' }}>
                                Cancel PO
                            </Button>
                        )}
                        <Box sx={{ flex: { xs: '1 1 100%', sm: 1 }, display: { xs: 'none', sm: 'block' } }} />
                        <Button onClick={() => {
                            setViewDialog(false);
                            dispatch(clearVendorPayments());
                        }} sx={{ borderRadius: '8px', ml: 'auto' }}>Close</Button>
                    </DialogActions>
                </Dialog>

                {/* ══ STATUS DIALOG ══ */}
                <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}
                    PaperProps={{ sx: { borderRadius: '20px', p: 2, maxWidth: 420 } }}>
                    <DialogTitle sx={{ textAlign: 'center' }}>
                        <Avatar sx={{
                            width: 72, height: 72, margin: '0 auto 12px',
                            bgcolor: newStatus === 'cancelled' ? '#fee2e2' : newStatus === 'received' ? '#dcfce7' : '#dbeafe',
                            color:  newStatus === 'cancelled' ? '#ef4444' : newStatus === 'received' ? '#2e7d32'  : '#1976d2',
                        }}>
                            {newStatus === 'approved'  && <ApproveIcon sx={{ fontSize: 40 }} />}
                            {newStatus === 'received'  && <ReceiveIcon sx={{ fontSize: 40 }} />}
                            {newStatus === 'cancelled' && <CancelIcon  sx={{ fontSize: 40 }} />}
                        </Avatar>
                        <Typography variant="h6" fontWeight={700}>
                            Confirm — {newStatus?.charAt(0).toUpperCase() + newStatus?.slice(1)}
                        </Typography>
                    </DialogTitle>
                    <DialogContent sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Are you sure you want to mark <b>{statusPO?.po_number}</b> as <b>{newStatus}</b>?
                        </Typography>
                        {newStatus === 'received' && (
                            <Alert severity="success" icon={<AutoIcon />}
                                sx={{ mt: 2, borderRadius: '10px', textAlign: 'left' }}>
                                <strong>Auto Inventory Update:</strong>
                                <ul style={{ margin: '4px 0 0 0', paddingLeft: 16 }}>
                                    <li>Stock for linked products will <strong>increase</strong></li>
                                    <li>New items will be <strong>added to inventory automatically</strong></li>
                                    <li>The average cost will be recalculated.</li>
                                </ul>
                            </Alert>
                        )}
                        {newStatus === 'cancelled' && (
                            <Alert severity="warning" sx={{ mt: 2, borderRadius: '10px', textAlign: 'left' }}>
                                A cancelled purchase order cannot be approved again.
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
                        <Button variant="outlined" onClick={() => setStatusDialog(false)}
                            sx={{ borderRadius: '10px', px: 3 }}>Cancel</Button>
                        <GradientButton disabled={loading} onClick={handleStatusConfirm}
                            gradient={
                                newStatus === 'cancelled' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                                newStatus === 'received'  ? 'linear-gradient(135deg, #2e7d32, #43a047)' :
                                                            'linear-gradient(135deg, #1976d2, #42a5f5)'
                            }>
                            {loading ? 'Processing...' : 'Confirm'}
                        </GradientButton>
                    </DialogActions>
                </Dialog>

                {/* ══ PAYMENT DIALOG ══ */}
                <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)}
                    maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
                    <DialogTitle>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar sx={{ bgcolor: '#11998e', width: 36, height: 36 }}>
                                    <PaymentIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700}>Add Payment</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {paymentPO?.po_number} · Balance: {fmt(paymentPO?.balance_amount)}
                                    </Typography>
                                </Box>
                            </Stack>
                            <IconButton size="small" onClick={() => setPaymentDialog(false)}><CloseIcon /></IconButton>
                        </Stack>
                    </DialogTitle>
                    <DialogContent>
                        <Box component="form" id="payment-form" onSubmit={handlePaymentSubmit}>
                            <Stack spacing={2} mt={1}>
                                <TextField fullWidth required size="small" label="Amount" type="number"
                                    inputProps={{ min: 0.01, step: 'any' }}
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                    helperText={`Max: ${fmt(paymentPO?.balance_amount)}`}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                />
                                <TextField fullWidth required size="small" label="Payment Date" type="date"
                                    value={paymentForm.payment_date}
                                    onChange={(e) => setPaymentForm((p) => ({ ...p, payment_date: e.target.value }))}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                />
                                <Select fullWidth size="small" value={paymentForm.payment_method}
                                    onChange={(e) => setPaymentForm((p) => ({ ...p, payment_method: e.target.value }))}
                                    sx={{ borderRadius: '10px' }}>
                                    <MenuItem value="bank_transfer">🏦 Bank Transfer</MenuItem>
                                    <MenuItem value="cash">💵 Cash</MenuItem>
                                    <MenuItem value="cheque">📄 Cheque</MenuItem>
                                    <MenuItem value="upi">📱 UPI</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                                <TextField fullWidth size="small" label="Reference No"
                                    value={paymentForm.reference_no}
                                    onChange={(e) => setPaymentForm((p) => ({ ...p, reference_no: e.target.value }))}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end"><SpeechFieldButton onTranscript={(text) => setPaymentForm((prev) => ({ ...prev, reference_no: appendSpeech(prev.reference_no, text) }))} /></InputAdornment>,
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                />
                                <TextField fullWidth size="small" label="Notes"
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end"><SpeechFieldButton onTranscript={(text) => setPaymentForm((prev) => ({ ...prev, notes: appendSpeech(prev.notes, text) }))} /></InputAdornment>,
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                />
                            </Stack>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button variant="outlined" onClick={() => setPaymentDialog(false)} sx={{ borderRadius: '10px' }}>Cancel</Button>
                        <GradientButton type="submit" form="payment-form" disabled={loading}
                            startIcon={<SaveIcon />} gradient="linear-gradient(135deg, #11998e, #38ef7d)">
                            {loading ? 'Saving...' : 'Save Payment'}
                        </GradientButton>
                    </DialogActions>
                </Dialog>

                {/* ══ DELETE DIALOG ══ */}
                <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}
                    PaperProps={{ sx: { borderRadius: '20px', p: 2, maxWidth: 380 } }}>
                    <DialogTitle sx={{ textAlign: 'center' }}>
                        <Avatar sx={{ width: 72, height: 72, bgcolor: '#fee2e2', color: '#ef4444', margin: '0 auto 12px' }}>
                            <DeleteIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Typography variant="h6" fontWeight={700}>Delete PO?</Typography>
                    </DialogTitle>
                    <DialogContent sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">This action cannot be undone.</Typography>
                        <Typography variant="subtitle1" fontWeight={700} color="error.main" mt={1}>
                            {poToDelete?.po_number}
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
                        <Button variant="outlined" onClick={() => setDeleteDialog(false)} sx={{ borderRadius: '10px', px: 3 }}>Cancel</Button>
                        <Button variant="contained" color="error" onClick={handleDelete}
                            disabled={loading} sx={{ borderRadius: '10px', px: 3 }}>Delete</Button>
                    </DialogActions>
                </Dialog>

                {/* ══ SNACKBAR ══ */}
                {/* ✅ Purchase Return Dialog */}
                <PurchaseReturnDialog
                    open={returnDialog}
                    onClose={() => setReturnDialog(false)}
                    po={poToReturn}
                    onSuccess={async (msg) => {
                        showSnackbar(msg, 'success');
                        setReturnDialog(false);
                        setPoToReturn(null);
                        await dispatch(getPurchaseOrders());
                    }}
                />

                <Snackbar open={snackbar.open} autoHideDuration={5000}
                    onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    TransitionComponent={Fade}>
                    <Alert severity={snackbar.severity} variant="filled"
                        sx={{ borderRadius: '12px', fontWeight: 500 }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>

            </Container>
        </>
    );
};

export default PurchaseOrderList;
