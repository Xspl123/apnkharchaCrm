import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getMovements, createMovement, deleteMovement,
    getProducts, reset,
} from '../state/inventorySlice';
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
    Save as SaveIcon, TrendingUp as InIcon, TrendingDown as OutIcon,
    Tune as AdjustIcon,
    SwapVert as MovementIcon, FilterList as FilterIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';

// ── Styled Components ─────────────────────────────────────

const GlassCard = styled(Card)(() => ({
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.3)',
}));

const GradientButton = styled(Button)(({ gradient }) => ({
    background: gradient || 'linear-gradient(135deg,#667eea,#764ba2)',
    color: 'white', fontWeight: 600, borderRadius: '12px',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(102,126,234,0.25)',
    '&:hover': { transform: 'scale(1.02)', opacity: 0.95 },
    '&:disabled': { opacity: 0.6, transform: 'none' },
}));

const StyledRow = styled(TableRow)(() => ({
    transition: 'all 0.2s',
    '&:hover': { backgroundColor: 'rgba(102,126,234,0.04)' },
}));

// ── Helpers ───────────────────────────────────────────────

const fmt    = (v) => `₹${Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
const fmtDate= (d) => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

const MOVEMENT_TYPES = {
    opening:    { label: 'Opening Stock', color: '#9c27b0', direction: 'in'  },
    purchase_in:{ label: 'Purchase In',   color: '#2e7d32', direction: 'in'  },
    sale_out:   { label: 'Sale Out',      color: '#ef4444', direction: 'out' },
    manual_in:  { label: 'Manual In',     color: '#1976d2', direction: 'in'  },
    manual_out: { label: 'Manual Out',    color: '#ed6c02', direction: 'out' },
    adjustment: { label: 'Adjustment',    color: '#0288d1', direction: 'adj' },
    return_in:  { label: 'Sale Return',color:'#11998e', direction: 'in'  },
    return_out: { label: 'Purchase Return',   color: '#f5576c', direction: 'out' },
};

const MANUAL_TYPES = ['manual_in', 'manual_out', 'adjustment'];

const emptyForm = {
    product_id:    '',
    type:          'manual_in',
    qty:           '',
    rate:          '',
    notes:         '',
    movement_date: new Date().toISOString().split('T')[0],
};

// ── Direction Chip ────────────────────────────────────────

const DirectionChip = ({ type }) => {
    const cfg = MOVEMENT_TYPES[type] || MOVEMENT_TYPES.manual_in;
    const icon =
        cfg.direction === 'in'  ? <InIcon     sx={{ fontSize: 12 }} /> :
        cfg.direction === 'out' ? <OutIcon    sx={{ fontSize: 12 }} /> :
                                  <AdjustIcon sx={{ fontSize: 12 }} />;
    return (
        <Stack spacing={0.4}>
            <Chip
                icon={icon}
                label={cfg.label}
                size="small"
                sx={{
                    bgcolor: cfg.color + '18',
                    color:   cfg.color,
                    fontWeight: 700, fontSize: 10,
                    '& .MuiChip-icon': { color: cfg.color },
                }}
            />
        </Stack>
    );
};

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════

const StockMovement = () => {
    const dispatch = useDispatch();
    const { movements, products, isLoading, actionLoading } =
        useSelector((s) => s.inventory);

    // ── UI State ──────────────────────────────────────────
    const [loading, setLoading]           = useState(false);
    const [showForm, setShowForm]         = useState(false);
    const [formData, setFormData]         = useState({ ...emptyForm });
    const [searchQuery, setSearch]        = useState('');
    const [typeFilter, setTypeFilter]     = useState('all');
    const [productFilter, setProductFilter] = useState('all');
    const [fromDate, setFromDate]         = useState('');
    const [toDate, setToDate]             = useState('');
    const [page, setPage]                 = useState(0);
    const [rowsPerPage, setRows]          = useState(15);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [toDelete, setToDelete]         = useState(null);
    const [snackbar, setSnackbar]         = useState({ open: false, message: '', severity: 'success' });

    // ── Effects ───────────────────────────────────────────

    const loadData = useCallback(async (filters = {}) => {
        setLoading(true);
        try {
            await Promise.all([
                dispatch(getMovements(filters)),
                dispatch(getProducts()),
            ]);
        } finally { setLoading(false); }
    }, [dispatch]);

    useEffect(() => {
        loadData();
        return () => { dispatch(reset()); };
    }, [dispatch, loadData]);

    const handleApplyFilters = () => {
        const params = {};
        if (productFilter !== 'all') params.product_id = productFilter;
        if (typeFilter    !== 'all') params.type        = typeFilter;
        if (fromDate)                params.from_date   = fromDate;
        if (toDate)                  params.to_date     = toDate;
        loadData(params);
    };

    const handleClearFilters = () => {
        setTypeFilter('all'); setProductFilter('all');
        setFromDate(''); setToDate(''); setSearch('');
        loadData();
    };

    const showSnack = (message, severity = 'success') =>
        setSnackbar({ open: true, message, severity });

    // ── Form ──────────────────────────────────────────────

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
    };

    const handleProductSelect = (productId) => {
        const product = products.find((p) => p.id === Number(productId));
        setFormData((p) => ({
            ...p,
            product_id: productId,
            rate: product?.avg_cost || '',
        }));
    };

    const handleCancel = () => {
        setShowForm(false);
        setFormData({ ...emptyForm });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.product_id) { showSnack('Product select karo!', 'error'); return; }
        if (!formData.qty || formData.qty <= 0) { showSnack('Valid qty daalo!', 'error'); return; }

        try {
            setLoading(true);
            await dispatch(createMovement(formData)).unwrap();
            showSnack('Stock movement recorded successfully!');
            handleCancel();
            await dispatch(getMovements());
            await dispatch(getProducts());
        } catch (err) {
            showSnack(typeof err === 'string' ? err : 'Operation failed!', 'error');
        } finally { setLoading(false); }
    };

    const handleDeleteConfirm = (movement) => {
        setToDelete(movement); setDeleteDialog(true);
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            await dispatch(deleteMovement(toDelete.id)).unwrap();
            showSnack('Movement deleted & stock reversed!');
            setDeleteDialog(false);
            await dispatch(getMovements());
            await dispatch(getProducts());
        } catch (err) {
            showSnack(typeof err === 'string' ? err : 'Delete failed!', 'error');
        } finally { setLoading(false); }
    };

    // ── Filters ───────────────────────────────────────────

    const filtered = movements.filter((m) => {
        const q = searchQuery.toLowerCase();
        return (
            m.product?.name?.toLowerCase().includes(q) ||
            m.product?.sku?.toLowerCase().includes(q)  ||
            m.reference_no?.toLowerCase().includes(q)  ||
            m.notes?.toLowerCase().includes(q)
        );
    });

    const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // ── Stats ─────────────────────────────────────────────

    const stats = {
        total:   movements.length,
        inward:  movements.filter((m) => (MOVEMENT_TYPES[m.type]?.direction === 'in')).length,
        outward: movements.filter((m) => (MOVEMENT_TYPES[m.type]?.direction === 'out')).length,
        totalIn: movements
            .filter((m) => MOVEMENT_TYPES[m.type]?.direction === 'in')
            .reduce((s, m) => s + (m.value || 0), 0),
        totalOut: movements
            .filter((m) => MOVEMENT_TYPES[m.type]?.direction === 'out')
            .reduce((s, m) => s + (m.value || 0), 0),
    };

    // ── Selected Product ──────────────────────────────────

    const selectedProduct = products.find((p) => p.id === Number(formData.product_id));

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
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                    }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="h5" fontWeight={700}>
                                    📊 Stock Movements
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3 }}>
                                    Stock in, out aur adjustments ka poora record
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                                <Chip label={`${stats.total} Total`}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
                                <Chip label={`${stats.inward} In`}
                                    sx={{ bgcolor: 'rgba(46,125,50,0.4)', color: 'white', fontWeight: 600 }} />
                                <Chip label={`${stats.outward} Out`}
                                    sx={{ bgcolor: 'rgba(239,68,68,0.4)', color: 'white', fontWeight: 600 }} />
                            </Stack>
                        </Stack>
                    </Paper>
                </motion.div>

                {/* ══ STATS CARDS ══ */}
                <Grid container spacing={2} mb={3}>
                    {[
                        {
                            label: 'Total Movements',
                            value: stats.total,
                            color: '#4facfe',
                            gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)',
                        },
                        {
                            label: 'Inward Movements',
                            value: stats.inward,
                            color: '#2e7d32',
                            gradient: 'linear-gradient(135deg,#11998e,#38ef7d)',
                        },
                        {
                            label: 'Outward Movements',
                            value: stats.outward,
                            color: '#ef4444',
                            gradient: 'linear-gradient(135deg,#f5576c,#f093fb)',
                        },
                        {
                            label: 'Total In Value',
                            value: fmt(stats.totalIn),
                            color: '#2e7d32',
                            gradient: 'linear-gradient(135deg,#11998e,#38ef7d)',
                        },
                        {
                            label: 'Total Out Value',
                            value: fmt(stats.totalOut),
                            color: '#ef4444',
                            gradient: 'linear-gradient(135deg,#f5576c,#f093fb)',
                        },
                    ].map((s, i) => (
                        <Grid item xs={12} sm={6} md key={i}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                whileHover={{ y: -3 }}
                            >
                                <GlassCard>
                                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h5" fontWeight={800}
                                            sx={{
                                                background: s.gradient,
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                            }}>
                                            {s.value}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            {s.label}
                                        </Typography>
                                    </CardContent>
                                </GlassCard>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>

                {/* ══ FILTER BAR ══ */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: '16px' }} elevation={2}>
                    <Grid container spacing={2} alignItems="center">

                        {/* Search */}
                        <Grid item xs={12} md={3}>
                            <TextField fullWidth size="small"
                                placeholder="Search product, ref no, notes..."
                                value={searchQuery}
                                onChange={(e) => setSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchQuery && (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearch('')}>
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: '10px' },
                                }}
                            />
                        </Grid>

                        {/* Product Filter */}
                        <Grid item xs={6} md={2}>
                            <Select fullWidth size="small" value={productFilter}
                                onChange={(e) => setProductFilter(e.target.value)}
                                displayEmpty sx={{ borderRadius: '10px' }}>
                                <MenuItem value="all">All Products</MenuItem>
                                {products.map((p) => (
                                    <MenuItem key={p.id} value={String(p.id)}>
                                        <Typography variant="body2" noWrap>{p.name}</Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </Grid>

                        {/* Type Filter */}
                        <Grid item xs={6} md={2}>
                            <Select fullWidth size="small" value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                sx={{ borderRadius: '10px' }}>
                                <MenuItem value="all">All Types</MenuItem>
                                {Object.entries(MOVEMENT_TYPES).map(([key, cfg]) => (
                                    <MenuItem key={key} value={key}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box sx={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                bgcolor: cfg.color,
                                            }} />
                                            <span>{cfg.label}</span>
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </Grid>

                        {/* Date Range */}
                        <Grid item xs={6} md={1.5}>
                            <TextField fullWidth size="small" type="date"
                                label="From" value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        </Grid>
                        <Grid item xs={6} md={1.5}>
                            <TextField fullWidth size="small" type="date"
                                label="To" value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        </Grid>

                        {/* Buttons */}
                        <Grid item xs={4} md={1}>
                            <GradientButton fullWidth size="small"
                                onClick={handleApplyFilters}
                                gradient="linear-gradient(135deg,#4facfe,#00f2fe)"
                                startIcon={<FilterIcon />}>
                                Filter
                            </GradientButton>
                        </Grid>
                        <Grid item xs={4} md={1}>
                            <Button fullWidth size="small" variant="outlined"
                                onClick={handleClearFilters}
                                sx={{ borderRadius: '10px' }}>
                                Clear
                            </Button>
                        </Grid>
                        <Grid item xs={4} md={1}>
                            <GradientButton fullWidth size="small"
                                startIcon={showForm ? <CloseIcon /> : <AddIcon />}
                                onClick={showForm ? handleCancel : () => setShowForm(true)}
                                gradient={showForm
                                    ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                                    : 'linear-gradient(135deg,#11998e,#38ef7d)'}>
                                {showForm ? 'Close' : 'Add'}
                            </GradientButton>
                        </Grid>

                    </Grid>
                </Paper>

                {/* ══ ADD MOVEMENT FORM ══ */}
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

                                    {/* Form Header */}
                                    <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                                        <Avatar sx={{
                                            background: 'linear-gradient(135deg,#4facfe,#00f2fe)',
                                            width: 44, height: 44,
                                        }}>
                                            <MovementIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" fontWeight={700}>
                                                New Stock Movement
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Manual stock in, out ya adjustment karo
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Divider sx={{ mb: 3 }} />

                                    <Box component="form" onSubmit={handleSubmit}>
                                        <Grid container spacing={2.5}>

                                            {/* Product Select */}
                                            <Grid item xs={12} md={4}>
                                                <Select fullWidth size="small" required
                                                    value={formData.product_id}
                                                    onChange={(e) => handleProductSelect(e.target.value)}
                                                    displayEmpty
                                                    sx={{ borderRadius: '10px' }}>
                                                    <MenuItem value=""><em>Select Product *</em></MenuItem>
                                                    {products.map((p) => (
                                                        <MenuItem key={p.id} value={p.id}>
                                                            <Stack>
                                                                <Typography variant="body2" fontWeight={600}>
                                                                    {p.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Stock: {p.current_stock} {p.unit}
                                                                    {p.sku && ` · SKU: ${p.sku}`}
                                                                </Typography>
                                                            </Stack>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </Grid>

                                            {/* Movement Type */}
                                            <Grid item xs={12} md={3}>
                                                <Select fullWidth size="small"
                                                    name="type" value={formData.type}
                                                    onChange={handleChange}
                                                    sx={{ borderRadius: '10px' }}>
                                                    <MenuItem value="manual_in">
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <InIcon color="success" fontSize="small" />
                                                            <span>Manual In — Stock Badhao</span>
                                                        </Stack>
                                                    </MenuItem>
                                                    <MenuItem value="manual_out">
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <OutIcon color="error" fontSize="small" />
                                                            <span>Manual Out — Stock Ghatao</span>
                                                        </Stack>
                                                    </MenuItem>
                                                    <MenuItem value="adjustment">
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <AdjustIcon color="info" fontSize="small" />
                                                            <span>Adjustment — Physical Count</span>
                                                        </Stack>
                                                    </MenuItem>
                                                </Select>
                                            </Grid>

                                            {/* Qty */}
                                            <Grid item xs={6} md={1.5}>
                                                <TextField fullWidth required size="small"
                                                    label="Quantity" name="qty"
                                                    type="number"
                                                    value={formData.qty}
                                                    onChange={handleChange}
                                                    helperText={selectedProduct
                                                        ? `Available: ${selectedProduct.current_stock} ${selectedProduct.unit}`
                                                        : ''}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>

                                            {/* Rate */}
                                            <Grid item xs={6} md={1.5}>
                                                <TextField fullWidth size="small"
                                                    label="Rate" name="rate"
                                                    type="number"
                                                    value={formData.rate}
                                                    onChange={handleChange}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">₹</InputAdornment>
                                                        ),
                                                    }}
                                                    helperText={selectedProduct
                                                        ? `Avg: ${fmt(selectedProduct.avg_cost)}`
                                                        : ''}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>

                                            {/* Date */}
                                            <Grid item xs={6} md={2}>
                                                <TextField fullWidth size="small"
                                                    label="Date" name="movement_date"
                                                    type="date"
                                                    value={formData.movement_date}
                                                    onChange={handleChange}
                                                    InputLabelProps={{ shrink: true }}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>

                                            {/* Notes */}
                                            <Grid item xs={12} md={6}>
                                                <TextField fullWidth size="small"
                                                    label="Notes (optional)"
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleChange}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>

                                            {/* Selected Product Info */}
                                            {selectedProduct && (
                                                <Grid item xs={12}>
                                                    <Paper elevation={0} sx={{
                                                        p: 2, borderRadius: '12px',
                                                        bgcolor: 'rgba(79,172,254,0.06)',
                                                        border: '1px solid rgba(79,172,254,0.2)',
                                                    }}>
                                                        <Stack direction="row" spacing={3}
                                                            alignItems="center" flexWrap="wrap">
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Avatar sx={{
                                                                    bgcolor: selectedProduct.category?.color || '#4facfe',
                                                                    width: 32, height: 32, fontSize: 14,
                                                                }}>
                                                                    {selectedProduct.name?.charAt(0)?.toUpperCase()}
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight={700}>
                                                                        {selectedProduct.name}
                                                                    </Typography>
                                                                    {selectedProduct.sku && (
                                                                        <Typography variant="caption"
                                                                            color="text.secondary">
                                                                            SKU: {selectedProduct.sku}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Stack>
                                                            <Divider orientation="vertical" flexItem />
                                                            {[
                                                                { label: 'Current Stock',
                                                                  value: `${selectedProduct.current_stock} ${selectedProduct.unit}`,
                                                                  color: selectedProduct.is_out_of_stock ? '#ef4444'
                                                                       : selectedProduct.is_low_stock ? '#ed6c02' : '#2e7d32' },
                                                                { label: 'Avg Cost',
                                                                  value: fmt(selectedProduct.avg_cost),
                                                                  color: '#1976d2' },
                                                                { label: 'Stock Value',
                                                                  value: fmt(selectedProduct.stock_value),
                                                                  color: '#667eea' },
                                                            ].map((item) => (
                                                                <Box key={item.label}>
                                                                    <Typography variant="caption"
                                                                        color="text.secondary" display="block">
                                                                        {item.label}
                                                                    </Typography>
                                                                    <Typography variant="body2"
                                                                        fontWeight={700} color={item.color}>
                                                                        {item.value}
                                                                    </Typography>
                                                                </Box>
                                                            ))}
                                                        </Stack>
                                                    </Paper>
                                                </Grid>
                                            )}

                                            {/* Submit */}
                                            <Grid item xs={12}>
                                                <Divider sx={{ mb: 2 }} />
                                                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                                                    <Button variant="outlined"
                                                        onClick={handleCancel}
                                                        startIcon={<CloseIcon />}
                                                        sx={{ borderRadius: '10px' }}>
                                                        Cancel
                                                    </Button>
                                                    <GradientButton type="submit"
                                                        disabled={actionLoading}
                                                        startIcon={<SaveIcon />}
                                                        gradient={
                                                            formData.type === 'manual_in'
                                                                ? 'linear-gradient(135deg,#11998e,#38ef7d)'
                                                                : formData.type === 'manual_out'
                                                                ? 'linear-gradient(135deg,#f5576c,#f093fb)'
                                                                : 'linear-gradient(135deg,#4facfe,#00f2fe)'
                                                        }>
                                                        {actionLoading ? 'Saving...' : 'Record Movement'}
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

                {/* ══ MOVEMENTS TABLE ══ */}
                <GlassCard>
                    <CardContent sx={{ p: 0 }}>

                        {/* Table Header */}
                        <Stack direction="row" justifyContent="space-between"
                            alignItems="center" sx={{ p: 2.5, pb: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <MovementIcon color="action" />
                                <Typography variant="subtitle1" fontWeight={700}>
                                    Stock Movement Log
                                </Typography>
                                <Chip label={filtered.length} size="small" color="primary"
                                    sx={{ fontWeight: 700 }} />
                            </Stack>
                            <Tooltip title="Refresh" TransitionComponent={Zoom}>
                                <IconButton onClick={() => loadData()} size="small">
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>

                        <Divider sx={{ mt: 2 }} />

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        {['Date','Product','Type','Qty','Rate',
                                          'Value','Before','After','Reference','Actions'].map((h) => (
                                            <TableCell key={h} sx={{ fontWeight: 700, py: 2, fontSize: 12 }}>
                                                {h}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                                                <Typography color="text.secondary">Loading...</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginated.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                                                <Stack alignItems="center" spacing={2}>
                                                    <Avatar sx={{ width: 72, height: 72, bgcolor: '#e0f7ff' }}>
                                                        <MovementIcon sx={{ fontSize: 40, color: '#4facfe' }} />
                                                    </Avatar>
                                                    <Typography variant="h6" color="text.secondary">
                                                        Koi movement nahi mila
                                                    </Typography>
                                                    <GradientButton
                                                        startIcon={<AddIcon />}
                                                        onClick={() => setShowForm(true)}
                                                        gradient="linear-gradient(135deg,#4facfe,#00f2fe)">
                                                        Pehla Movement Add Karo
                                                    </GradientButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginated.map((m) => {
                                        const cfg = MOVEMENT_TYPES[m.type] || MOVEMENT_TYPES.manual_in;
                                        const isManual = MANUAL_TYPES.includes(m.type);
                                        return (
                                            <StyledRow key={m.id}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {fmtDate(m.movement_date)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Avatar sx={{
                                                            width: 28, height: 28,
                                                            bgcolor: cfg.color + '20',
                                                            color:  cfg.color,
                                                            fontSize: 12, fontWeight: 700,
                                                        }}>
                                                            {m.product?.name?.charAt(0)?.toUpperCase()}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {m.product?.name || '—'}
                                                            </Typography>
                                                            {m.product?.sku && (
                                                                <Typography variant="caption"
                                                                    color="text.secondary">
                                                                    {m.product.sku}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <DirectionChip type={m.type} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={700}
                                                        color={m.qty > 0 ? '#2e7d32' : '#ef4444'}>
                                                        {m.qty > 0 ? '+' : ''}{m.qty} {m.product?.unit}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {m.rate > 0 ? fmt(m.rate) : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}
                                                        color="#667eea">
                                                        {m.value > 0 ? fmt(m.value) : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {m.stock_before}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={m.stock_after}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: cfg.color + '15',
                                                            color:   cfg.color,
                                                            fontWeight: 700,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {m.reference_no ? (
                                                        <Chip label={m.reference_no} size="small"
                                                            variant="outlined" sx={{ fontSize: 10 }} />
                                                    ) : m.notes ? (
                                                        <Typography variant="caption"
                                                            color="text.secondary"
                                                            sx={{
                                                                maxWidth: 120, display: 'block',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}>
                                                            {m.notes}
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="caption"
                                                            color="text.disabled">—</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {isManual ? (
                                                        <Tooltip title="Delete & Reverse Stock"
                                                            TransitionComponent={Zoom}>
                                                            <IconButton size="small" color="error"
                                                                onClick={() => handleDeleteConfirm(m)}
                                                                sx={{ bgcolor: 'rgba(239,68,68,0.1)' }}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip title="Auto-generated — delete nahi ho sakta">
                                                            <span>
                                                                <IconButton size="small" disabled>
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                            </StyledRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[15, 25, 50, 100]}
                            component="div"
                            count={filtered.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(_, p) => setPage(p)}
                            onRowsPerPageChange={(e) => {
                                setRows(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            sx={{ borderTop: '1px solid #e2e8f0' }}
                        />
                    </CardContent>
                </GlassCard>

                {/* ══ DELETE DIALOG ══ */}
                <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}
                    PaperProps={{ sx: { borderRadius: '20px', p: 2, maxWidth: 400 } }}>
                    <DialogTitle sx={{ textAlign: 'center' }}>
                        <Avatar sx={{
                            width: 72, height: 72, bgcolor: '#fee2e2',
                            color: '#ef4444', margin: '0 auto 12px',
                        }}>
                            <DeleteIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Typography variant="h6" fontWeight={700}>
                            Movement Delete Karo?
                        </Typography>
                    </DialogTitle>
                    <DialogContent sx={{ textAlign: 'center' }}>
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: '10px', textAlign: 'left' }}>
                            Delete karne par stock automatically reverse ho jayega!
                        </Alert>
                        <Typography variant="body2" color="text.secondary">
                            Product: <b>{toDelete?.product?.name}</b>
                            <br />
                            Qty: <b>{toDelete?.qty} {toDelete?.product?.unit}</b>
                            <br />
                            Date: <b>{fmtDate(toDelete?.movement_date)}</b>
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
                        <Button variant="outlined" onClick={() => setDeleteDialog(false)}
                            sx={{ borderRadius: '10px', px: 3 }}>
                            Cancel
                        </Button>
                        <Button variant="contained" color="error"
                            onClick={handleDelete} disabled={loading}
                            sx={{ borderRadius: '10px', px: 3 }}>
                            {loading ? 'Deleting...' : 'Delete & Reverse'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ══ SNACKBAR ══ */}
                <Snackbar open={snackbar.open} autoHideDuration={4000}
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

export default StockMovement;
