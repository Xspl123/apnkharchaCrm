import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getVendors, createVendor, updateVendor,
    deleteVendor, reset,
} from '../state/vendorSlice';
import {
    Box, Container, Grid, Card, CardContent, Typography, Paper,
    Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
    TablePagination, TextField, Button, IconButton, Chip, Stack,
    Avatar, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
    InputAdornment, Tooltip, Zoom, Fade, Snackbar,
    Alert, LinearProgress, Badge, Select, MenuItem,
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Search as SearchIcon, Clear as ClearIcon, Business as BusinessIcon,
    Refresh as RefreshIcon, Close as CloseIcon, Save as SaveIcon,
    Phone as PhoneIcon, Email as EmailIcon, LocationOn as LocationIcon,
    AccountBalance as BankIcon, Receipt as ReceiptIcon,
    CheckCircle as ActiveIcon, Cancel as InactiveIcon,
    Visibility as ViewIcon,
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
    background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
    '&:hover': { transform: 'scale(1.02)', opacity: 0.95 },
}));

const StyledTableRow = styled(TableRow)(() => ({
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: 'rgba(102,126,234,0.04)',
        cursor: 'pointer',
    },
}));

// ── Empty Form ────────────────────────────────────────────

const emptyForm = {
    vendor_name:     '',
    company_name:    '',
    email:           '',
    phone:           '',
    address:         '',
    city:            '',
    state:           '',
    pincode:         '',
    country:         'India',
    gstin:           '',
    pan:             '',
    bank_name:       '',
    bank_account_no: '',
    bank_ifsc:       '',
    bank_branch:     '',
    status:          'active',
    notes:           '',
};

// ── Section Heading ───────────────────────────────────────

const FormSection = ({ title, icon }) => (
    <Stack direction="row" alignItems="center" spacing={1} mb={2} mt={1}>
        <Avatar sx={{ bgcolor: '#667eea', width: 28, height: 28 }}>
            {icon}
        </Avatar>
        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
            {title}
        </Typography>
        <Divider sx={{ flex: 1 }} />
    </Stack>
);

// ── Main Component ────────────────────────────────────────

const VendorList = () => {
    const dispatch = useDispatch();
    const { vendors, isLoading, actionLoading } = useSelector((s) => s.vendors);

    // ── UI State ──────────────────────────────────────────
    const [showForm, setShowForm]         = useState(false);
    const [editMode, setEditMode]         = useState(false);
    const [selectedVendor, setSelected]   = useState(null);
    const [viewVendor, setViewVendor]     = useState(null);
    const [viewDialog, setViewDialog]     = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [vendorToDelete, setToDelete]   = useState(null);
    const [searchQuery, setSearchQuery]   = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage]                 = useState(0);
    const [rowsPerPage, setRowsPerPage]   = useState(10);
    const [formData, setFormData]         = useState(emptyForm);
    const [snackbar, setSnackbar]         = useState({ open: false, message: '', severity: 'success' });
    const [loading, setLoading]           = useState(false);

    // ── Effects ───────────────────────────────────────────

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(getVendors());
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        loadData();
        return () => { dispatch(reset()); };
    }, [dispatch, loadData]);

    // ── Helpers ───────────────────────────────────────────

    const showSnackbar = (message, severity = 'success') =>
        setSnackbar({ open: true, message, severity });

    // ── Filters ───────────────────────────────────────────

    const filtered = vendors.filter((v) => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
            v.vendor_name?.toLowerCase().includes(q)  ||
            v.company_name?.toLowerCase().includes(q) ||
            v.email?.toLowerCase().includes(q)        ||
            v.phone?.includes(q)                      ||
            v.gstin?.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || v.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // ── Form Handlers ─────────────────────────────────────

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
    };

    const handleOpenCreate = () => {
        setFormData(emptyForm);
        setEditMode(false);
        setSelected(null);
        setShowForm(true);
    };

    const handleEdit = (vendor) => {
        setFormData({
            vendor_name:     vendor.vendor_name     || '',
            company_name:    vendor.company_name    || '',
            email:           vendor.email           || '',
            phone:           vendor.phone           || '',
            address:         vendor.address         || '',
            city:            vendor.city            || '',
            state:           vendor.state           || '',
            pincode:         vendor.pincode         || '',
            country:         vendor.country         || 'India',
            gstin:           vendor.gstin           || '',
            pan:             vendor.pan             || '',
            bank_name:       vendor.bank_name       || '',
            bank_account_no: vendor.bank_account_no || '',
            bank_ifsc:       vendor.bank_ifsc       || '',
            bank_branch:     vendor.bank_branch     || '',
            status:          vendor.status          || 'active',
            notes:           vendor.notes           || '',
        });
        setSelected(vendor);
        setEditMode(true);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditMode(false);
        setSelected(null);
        setFormData(emptyForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.vendor_name.trim()) {
            showSnackbar('Vendor name required hai!', 'error');
            return;
        }
        try {
            setLoading(true);
            if (editMode && selectedVendor) {
                await dispatch(updateVendor({ id: selectedVendor.id, data: formData })).unwrap();
                showSnackbar('Vendor updated successfully!');
            } else {
                await dispatch(createVendor(formData)).unwrap();
                showSnackbar('Vendor created successfully!');
            }
            handleCancel();
            await dispatch(getVendors());
        } catch (err) {
            showSnackbar(typeof err === 'string' ? err : 'Operation failed!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = (vendor) => {
        setToDelete(vendor);
        setDeleteDialog(true);
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            await dispatch(deleteVendor(vendorToDelete.id)).unwrap();
            showSnackbar('Vendor deleted successfully!');
            setDeleteDialog(false);
            setToDelete(null);
        } catch (err) {
            showSnackbar(typeof err === 'string' ? err : 'Delete failed!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleView = (vendor) => {
        setViewVendor(vendor);
        setViewDialog(true);
    };

    // ── Stats ─────────────────────────────────────────────

    const stats = {
        total:    vendors.length,
        active:   vendors.filter((v) => v.status === 'active').length,
        inactive: vendors.filter((v) => v.status === 'inactive').length,
    };

    // ── Render ────────────────────────────────────────────

    return (
        <>
            {loading && (
                <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
                    <LinearProgress color="primary" />
                </Box>
            )}

            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* ── Header ── */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Paper elevation={0} sx={{
                        p: 2.5, mb: 3, borderRadius: '16px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                    }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="h5" fontWeight={700}>
                                    🏭 Vendors
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                    Vendor management — add, edit, delete
                                </Typography>
                            </Box>
                            <Badge badgeContent={stats.total} color="error" max={999}>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                                    <BusinessIcon />
                                </Avatar>
                            </Badge>
                        </Stack>
                    </Paper>
                </motion.div>

                {/* ── Stats ── */}
                <Grid container spacing={2} mb={3}>
                    {[
                        { label: 'Total',    value: stats.total,    color: '#667eea' },
                        { label: 'Active',   value: stats.active,   color: '#2e7d32' },
                        { label: 'Inactive', value: stats.inactive, color: '#ef4444' },
                    ].map((s, i) => (
                        <Grid item xs={4} key={i}>
                            <motion.div whileHover={{ y: -2 }}>
                                <GlassCard>
                                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" fontWeight={800} color={s.color}>
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

                {/* ── Action Bar ── */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: '16px' }} elevation={2}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={5}>
                            <TextField
                                fullWidth size="small"
                                placeholder="Search by name, email, phone, GSTIN..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchQuery && (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearchQuery('')}>
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: '10px' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Select
                                fullWidth size="small"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                sx={{ borderRadius: '10px' }}
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="active">✅ Active</MenuItem>
                                <MenuItem value="inactive">❌ Inactive</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <GradientButton
                                fullWidth
                                startIcon={<RefreshIcon />}
                                onClick={loadData}
                                gradient="linear-gradient(135deg, #667eea, #764ba2)"
                            >
                                Refresh
                            </GradientButton>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <GradientButton
                                fullWidth
                                startIcon={showForm ? <CloseIcon /> : <AddIcon />}
                                onClick={showForm ? handleCancel : handleOpenCreate}
                                gradient={showForm
                                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                    : 'linear-gradient(135deg, #11998e, #38ef7d)'
                                }
                            >
                                {showForm ? 'Cancel' : 'Add Vendor'}
                            </GradientButton>
                        </Grid>
                    </Grid>
                </Paper>

                {/* ── Create / Edit Form ── */}
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
                                        <Avatar sx={{ bgcolor: '#667eea', width: 44, height: 44 }}>
                                            {editMode ? <EditIcon /> : <AddIcon />}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" fontWeight={700}>
                                                {editMode ? `Edit — ${selectedVendor?.vendor_name}` : 'New Vendor'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {editMode ? 'Vendor details update karo' : 'Naya vendor add karo'}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Divider sx={{ mb: 3 }} />

                                    <Box component="form" onSubmit={handleSubmit}>
                                        <Grid container spacing={2.5}>

                                            {/* ── Basic Info ── */}
                                            <Grid item xs={12}>
                                                <FormSection
                                                    title="Basic Information"
                                                    icon={<BusinessIcon sx={{ fontSize: 14 }} />}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6} md={4}>
                                                <TextField
                                                    fullWidth required size="small"
                                                    label="Vendor Name"
                                                    name="vendor_name"
                                                    value={formData.vendor_name}
                                                    onChange={handleChange}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="Company Name"
                                                    name="company_name"
                                                    value={formData.company_name}
                                                    onChange={handleChange}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <Select
                                                    fullWidth size="small"
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleChange}
                                                    sx={{ borderRadius: '10px' }}
                                                >
                                                    <MenuItem value="active">✅ Active</MenuItem>
                                                    <MenuItem value="inactive">❌ Inactive</MenuItem>
                                                </Select>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="Email"
                                                    name="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <EmailIcon fontSize="small" color="action" />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="Phone"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <PhoneIcon fontSize="small" color="action" />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="Notes"
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleChange}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>

                                            {/* ── Address ── */}
                                            <Grid item xs={12}>
                                                <FormSection
                                                    title="Address"
                                                    icon={<LocationIcon sx={{ fontSize: 14 }} />}
                                                />
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="Address"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="City"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleChange}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="State"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleChange}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="Pincode"
                                                    name="pincode"
                                                    value={formData.pincode}
                                                    onChange={handleChange}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="Country"
                                                    name="country"
                                                    value={formData.country}
                                                    onChange={handleChange}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>

                                            {/* ── GST Info ── */}
                                            <Grid item xs={12}>
                                                <FormSection
                                                    title="GST Information"
                                                    icon={<ReceiptIcon sx={{ fontSize: 14 }} />}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6} md={4}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="GSTIN"
                                                    name="gstin"
                                                    value={formData.gstin}
                                                    onChange={handleChange}
                                                    inputProps={{ maxLength: 15, style: { textTransform: 'uppercase' } }}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="PAN"
                                                    name="pan"
                                                    value={formData.pan}
                                                    onChange={handleChange}
                                                    inputProps={{ maxLength: 10, style: { textTransform: 'uppercase' } }}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>

                                            {/* ── Bank Details ── */}
                                            <Grid item xs={12}>
                                                <FormSection
                                                    title="Bank Details"
                                                    icon={<BankIcon sx={{ fontSize: 14 }} />}
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={6} md={3}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="Bank Name"
                                                    name="bank_name"
                                                    value={formData.bank_name}
                                                    onChange={handleChange}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="Account No"
                                                    name="bank_account_no"
                                                    value={formData.bank_account_no}
                                                    onChange={handleChange}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="IFSC Code"
                                                    name="bank_ifsc"
                                                    value={formData.bank_ifsc}
                                                    onChange={handleChange}
                                                    inputProps={{ style: { textTransform: 'uppercase' } }}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={3}>
                                                <TextField
                                                    fullWidth size="small"
                                                    label="Branch"
                                                    name="bank_branch"
                                                    value={formData.bank_branch}
                                                    onChange={handleChange}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                                />
                                            </Grid>

                                            {/* ── Submit ── */}
                                            <Grid item xs={12}>
                                                <Divider sx={{ mb: 2 }} />
                                                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                                                    <Button
                                                        variant="outlined"
                                                        onClick={handleCancel}
                                                        startIcon={<CloseIcon />}
                                                        sx={{ borderRadius: '10px' }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <GradientButton
                                                        type="submit"
                                                        disabled={actionLoading}
                                                        startIcon={<SaveIcon />}
                                                        gradient="linear-gradient(135deg, #667eea, #764ba2)"
                                                    >
                                                        {actionLoading
                                                            ? 'Saving...'
                                                            : editMode ? 'Update Vendor' : 'Save Vendor'
                                                        }
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

                {/* ── Table ── */}
                <GlassCard>
                    <CardContent sx={{ p: 0 }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        {['#', 'Vendor', 'Contact', 'GSTIN', 'City', 'Status', 'Actions'].map((h) => (
                                            <TableCell key={h} sx={{ fontWeight: 700, py: 2 }}>
                                                {h}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                                <Typography color="text.secondary">Loading...</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginated.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                                <Stack alignItems="center" spacing={2}>
                                                    <Avatar sx={{ width: 72, height: 72, bgcolor: '#f1f5f9' }}>
                                                        <BusinessIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
                                                    </Avatar>
                                                    <Typography variant="h6" color="text.secondary">
                                                        Koi vendor nahi mila
                                                    </Typography>
                                                    <GradientButton
                                                        startIcon={<AddIcon />}
                                                        onClick={handleOpenCreate}
                                                        gradient="linear-gradient(135deg, #667eea, #764ba2)"
                                                    >
                                                        Pehla Vendor Add Karo
                                                    </GradientButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginated.map((vendor, i) => (
                                        <StyledTableRow key={vendor.id}>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {page * rowsPerPage + i + 1}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Avatar sx={{
                                                        bgcolor: '#667eea', width: 38, height: 38,
                                                        fontSize: 16, fontWeight: 700,
                                                    }}>
                                                        {vendor.vendor_name?.charAt(0)?.toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {vendor.vendor_name}
                                                        </Typography>
                                                        {vendor.company_name && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {vendor.company_name}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Stack spacing={0.3}>
                                                    {vendor.phone && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            📞 {vendor.phone}
                                                        </Typography>
                                                    )}
                                                    {vendor.email && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            ✉️ {vendor.email}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                {vendor.gstin ? (
                                                    <Chip
                                                        label={vendor.gstin}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: '#f0f9ff',
                                                            color: '#0369a1',
                                                            fontWeight: 600,
                                                            fontSize: 11,
                                                            borderColor: '#bae6fd',
                                                            border: '1px solid',
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {vendor.city || '—'}
                                                    {vendor.state ? `, ${vendor.state}` : ''}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={vendor.status === 'active'
                                                        ? <ActiveIcon fontSize="small" />
                                                        : <InactiveIcon fontSize="small" />
                                                    }
                                                    label={vendor.status === 'active' ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    color={vendor.status === 'active' ? 'success' : 'error'}
                                                    variant={vendor.status === 'active' ? 'filled' : 'outlined'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5}>
                                                    <Tooltip title="View Details" TransitionComponent={Zoom}>
                                                        <IconButton
                                                            size="small" color="info"
                                                            onClick={() => handleView(vendor)}
                                                            sx={{ bgcolor: 'rgba(59,130,246,0.1)' }}
                                                        >
                                                            <ViewIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit Vendor" TransitionComponent={Zoom}>
                                                        <IconButton
                                                            size="small" color="primary"
                                                            onClick={() => handleEdit(vendor)}
                                                            sx={{ bgcolor: 'rgba(102,126,234,0.1)' }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Vendor" TransitionComponent={Zoom}>
                                                        <IconButton
                                                            size="small" color="error"
                                                            onClick={() => handleDeleteConfirm(vendor)}
                                                            sx={{ bgcolor: 'rgba(239,68,68,0.1)' }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
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
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            sx={{ borderTop: '1px solid #e2e8f0' }}
                        />
                    </CardContent>
                </GlassCard>

                {/* ── View Dialog ── */}
                <Dialog
                    open={viewDialog}
                    onClose={() => setViewDialog(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
                >
                    <DialogTitle>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{ bgcolor: '#667eea' }}>
                                    {viewVendor?.vendor_name?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight={700}>
                                        {viewVendor?.vendor_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {viewVendor?.company_name}
                                    </Typography>
                                </Box>
                            </Stack>
                            <IconButton onClick={() => setViewDialog(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Stack>
                    </DialogTitle>
                    <DialogContent>
                        {viewVendor && (
                            <Stack spacing={2}>
                                {/* Contact */}
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: '12px' }}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary"
                                        sx={{ textTransform: 'uppercase' }}>
                                        Contact
                                    </Typography>
                                    <Stack spacing={0.5} mt={1}>
                                        {viewVendor.phone && (
                                            <Typography variant="body2">📞 {viewVendor.phone}</Typography>
                                        )}
                                        {viewVendor.email && (
                                            <Typography variant="body2">✉️ {viewVendor.email}</Typography>
                                        )}
                                        {viewVendor.address && (
                                            <Typography variant="body2">
                                                📍 {viewVendor.address}, {viewVendor.city} {viewVendor.state} {viewVendor.pincode}
                                            </Typography>
                                        )}
                                    </Stack>
                                </Paper>

                                {/* GST */}
                                {(viewVendor.gstin || viewVendor.pan) && (
                                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: '12px' }}>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary"
                                            sx={{ textTransform: 'uppercase' }}>
                                            GST Info
                                        </Typography>
                                        <Stack direction="row" spacing={1} mt={1}>
                                            {viewVendor.gstin && (
                                                <Chip label={`GST: ${viewVendor.gstin}`} size="small"
                                                    sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }} />
                                            )}
                                            {viewVendor.pan && (
                                                <Chip label={`PAN: ${viewVendor.pan}`} size="small"
                                                    sx={{ bgcolor: '#fef2f2', color: '#991b1b', fontWeight: 600 }} />
                                            )}
                                        </Stack>
                                    </Paper>
                                )}

                                {/* Bank */}
                                {viewVendor.bank_name && (
                                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: '12px' }}>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary"
                                            sx={{ textTransform: 'uppercase' }}>
                                            Bank Details
                                        </Typography>
                                        <Grid container spacing={1} mt={0.5}>
                                            {[
                                                { label: 'Bank', value: viewVendor.bank_name },
                                                { label: 'Account', value: viewVendor.bank_account_no },
                                                { label: 'IFSC', value: viewVendor.bank_ifsc },
                                                { label: 'Branch', value: viewVendor.bank_branch },
                                            ].map((item) => item.value && (
                                                <Grid item xs={6} key={item.label}>
                                                    <Typography variant="caption" color="text.secondary"
                                                        display="block">
                                                        {item.label}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {item.value}
                                                    </Typography>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Paper>
                                )}

                                {viewVendor.notes && (
                                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: '12px' }}>
                                        <Typography variant="caption" fontWeight={700} color="text.secondary"
                                            sx={{ textTransform: 'uppercase' }}>
                                            Notes
                                        </Typography>
                                        <Typography variant="body2" mt={0.5}>
                                            {viewVendor.notes}
                                        </Typography>
                                    </Paper>
                                )}
                            </Stack>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setViewDialog(false);
                                handleEdit(viewVendor);
                            }}
                            startIcon={<EditIcon />}
                            sx={{ borderRadius: '10px' }}
                        >
                            Edit Karo
                        </Button>
                        <Button
                            onClick={() => setViewDialog(false)}
                            sx={{ borderRadius: '10px' }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ── Delete Dialog ── */}
                <Dialog
                    open={deleteDialog}
                    onClose={() => setDeleteDialog(false)}
                    PaperProps={{ sx: { borderRadius: '20px', p: 2, maxWidth: 380 } }}
                >
                    <DialogTitle sx={{ textAlign: 'center' }}>
                        <Avatar sx={{
                            width: 72, height: 72, bgcolor: '#fee2e2',
                            color: '#ef4444', margin: '0 auto 12px',
                        }}>
                            <DeleteIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Typography variant="h6" fontWeight={700}>
                            Confirm Delete
                        </Typography>
                    </DialogTitle>
                    <DialogContent sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Kya aap sure hain? Yeh action undo nahi ho sakta.
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700} color="error.main" mt={1}>
                            {vendorToDelete?.vendor_name}
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setDeleteDialog(false)}
                            sx={{ borderRadius: '10px', px: 3 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDelete}
                            disabled={loading}
                            sx={{ borderRadius: '10px', px: 3 }}
                        >
                            Delete Karo
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ── Snackbar ── */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    TransitionComponent={Fade}
                >
                    <Alert
                        severity={snackbar.severity}
                        variant="filled"
                        sx={{ borderRadius: '12px', fontWeight: 500 }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>

            </Container>
        </>
    );
};

export default VendorList;
