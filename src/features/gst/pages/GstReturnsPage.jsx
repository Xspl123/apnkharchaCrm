import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchReturns,
    saveReturnDraft,
    fileReturn,
} from '../state/gstSlice';
import {
    Box, Grid, Card, Typography, TextField, Button,
    Chip, Divider, CircularProgress, Alert, Paper, Stack, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogContentText,
    DialogActions, MenuItem, Select, FormControl, InputLabel,
    IconButton, Tooltip, Snackbar,
} from '@mui/material';
import {
    FileUpload, SaveAlt, CheckCircle, HourglassEmpty,
    Refresh, FilterList, Receipt, AccountBalance, Close,
    WarningAmber,
} from '@mui/icons-material';

// ── Helpers ───────────────────────────────────────────────

const fmt = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ── Status Chip ───────────────────────────────────────────

const StatusChip = ({ status }) => (
    <Chip
        icon={status === 'filed' ? <CheckCircle fontSize="small" /> : <HourglassEmpty fontSize="small" />}
        label={status === 'filed' ? 'Filed' : 'Draft'}
        size="small"
        color={status === 'filed' ? 'success' : 'warning'}
        variant={status === 'filed' ? 'filled' : 'outlined'}
    />
);

// ── Return Type Chip ──────────────────────────────────────

const ReturnTypeChip = ({ type }) => (
    <Chip
        icon={type === 'GSTR1' ? <Receipt fontSize="small" /> : <AccountBalance fontSize="small" />}
        label={type}
        size="small"
        color={type === 'GSTR1' ? 'primary' : 'secondary'}
        variant="outlined"
    />
);

// ── Deadline Badge ────────────────────────────────────────

const DeadlineInfo = ({ period, returnType }) => {
    if (!period) return null;

    const [year, month] = period.split('-').map(Number);
    const deadline      = returnType === 'GSTR1' ? 11 : 20;
    const deadlineDate  = new Date(year, month, deadline); // next month deadline
    const today         = new Date();
    const daysLeft      = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

    const color = daysLeft < 0 ? 'error' : daysLeft <= 5 ? 'warning' : 'success';
    const label = daysLeft < 0
        ? `${Math.abs(daysLeft)} days overdue`
        : daysLeft === 0
        ? 'Due today!'
        : `${daysLeft} days left`;

    return (
        <Chip
            label={label}
            size="small"
            color={color}
            variant="outlined"
            icon={daysLeft <= 5 ? <WarningAmber fontSize="small" /> : undefined}
        />
    );
};

// ── Create Draft Dialog ───────────────────────────────────

const CreateDraftDialog = ({ open, onClose, onSubmit, loading }) => {
    const [form, setForm] = useState({
        return_type: 'GSTR1',
        period: new Date().toISOString().slice(0, 7),
    });

    const handleSubmit = () => onSubmit(form);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={700}>
                        New Return Draft
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2.5} mt={1}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Return Type</InputLabel>
                        <Select
                            value={form.return_type}
                            label="Return Type"
                            onChange={(e) => setForm((p) => ({ ...p, return_type: e.target.value }))}
                        >
                            <MenuItem value="GSTR1">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Receipt fontSize="small" color="primary" />
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>GSTR-1</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Outward supplies — 11 tarikh deadline
                                        </Typography>
                                    </Box>
                                </Stack>
                            </MenuItem>
                            <MenuItem value="GSTR3B">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <AccountBalance fontSize="small" color="secondary" />
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>GSTR-3B</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Tax payment summary — 20 tarikh deadline
                                        </Typography>
                                    </Box>
                                </Stack>
                            </MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        type="month"
                        label="Period"
                        size="small"
                        fullWidth
                        value={form.period}
                        onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))}
                        inputProps={{ max: new Date().toISOString().slice(0, 7) }}
                    />
                    <Alert severity="info">
                        Draft save hone ke baad aap review karke file kar sakte ho.
                    </Alert>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="outlined" disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveAlt />}
                    disabled={loading}
                >
                    Save Draft
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ── File Confirm Dialog ───────────────────────────────────

const FileConfirmDialog = ({ open, onClose, onConfirm, returnData, loading }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
            <Stack direction="row" spacing={1} alignItems="center">
                <WarningAmber color="warning" />
                <Typography variant="h6" fontWeight={700}>
                    Return File Karo
                </Typography>
            </Stack>
        </DialogTitle>
        <DialogContent>
            <DialogContentText>
                Kya aap sure hain? Ek baar file hone ke baad yeh return
                <strong> modify nahi ho sakta.</strong>
            </DialogContentText>
            {returnData && (
                <Paper
                    elevation={0}
                    sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}
                >
                    <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">Return Type</Typography>
                            <ReturnTypeChip type={returnData.return_type} />
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">Period</Typography>
                            <Chip label={returnData.period} size="small" />
                        </Stack>
                        <Divider />
                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                                Tax Liability
                            </Typography>
                            <Typography variant="body2" fontWeight={700} color="error.main">
                                {returnData.data_snapshot?.tax_liability
                                    ? fmt(returnData.data_snapshot.tax_liability.total_tax)
                                    : returnData.data_snapshot?.summary
                                    ? fmt(returnData.data_snapshot.summary.total_tax)
                                    : '—'}
                            </Typography>
                        </Stack>
                    </Stack>
                </Paper>
            )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={onClose} disabled={loading}>
                Cancel
            </Button>
            <Button
                onClick={onConfirm}
                variant="contained"
                color="error"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FileUpload />}
                disabled={loading}
            >
                Haan, File Karo
            </Button>
        </DialogActions>
    </Dialog>
);

// ── Stats Cards ───────────────────────────────────────────

const StatsCards = ({ returns }) => {
    const total  = returns.length;
    const filed  = returns.filter((r) => r.status === 'filed').length;
    const drafts = returns.filter((r) => r.status === 'draft').length;
    const gstr1  = returns.filter((r) => r.return_type === 'GSTR1').length;
    const gstr3b = returns.filter((r) => r.return_type === 'GSTR3B').length;

    return (
        <Grid container spacing={2} mb={3}>
            {[
                { label: 'Total Returns', value: total, color: 'primary.main' },
                { label: 'Filed', value: filed, color: 'success.main' },
                { label: 'Drafts Pending', value: drafts, color: 'warning.main' },
                { label: 'GSTR-1', value: gstr1, color: 'info.main' },
                { label: 'GSTR-3B', value: gstr3b, color: 'secondary.main' },
            ].map((item, i) => (
                <Grid item xs={6} sm={4} md key={i}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="h5" fontWeight={700} color={item.color}>
                            {item.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {item.label}
                        </Typography>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );
};

// ── Main Page ─────────────────────────────────────────────

const GstReturnsPage = () => {
    const dispatch = useDispatch();
    const { returns, returnsLoading, actionLoading, error } =
        useSelector((s) => s.gst);

    // Filters
    const [filters, setFilters] = useState({
        return_type: '',
        status: '',
        period: '',
    });

    // Dialogs
    const [createOpen, setCreateOpen]     = useState(false);
    const [fileDialog, setFileDialog]     = useState({ open: false, data: null });
    const [snackbar, setSnackbar]         = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        dispatch(fetchReturns({}));
    }, [dispatch]);

    // ── Handlers ──────────────────────────────────────────

    const handleFilterChange = (key, val) => {
        const newFilters = { ...filters, [key]: val };
        setFilters(newFilters);
        // Remove empty filters before dispatching
        const clean = Object.fromEntries(
            Object.entries(newFilters).filter(([_, v]) => v !== '')
        );
        dispatch(fetchReturns(clean));
    };

    const handleResetFilters = () => {
        setFilters({ return_type: '', status: '', period: '' });
        dispatch(fetchReturns({}));
    };

    const handleCreateDraft = async (formData) => {
        const result = await dispatch(saveReturnDraft(formData));
        if (saveReturnDraft.fulfilled.match(result)) {
            setSnackbar({ open: true, message: 'Draft saved successfully!', severity: 'success' });
            setCreateOpen(false);
            dispatch(fetchReturns({}));
        } else {
            setSnackbar({ open: true, message: result.payload || 'Error saving draft', severity: 'error' });
        }
    };

    const handleFileConfirm = async () => {
        const result = await dispatch(fileReturn(fileDialog.data.id));
        if (fileReturn.fulfilled.match(result)) {
            setSnackbar({ open: true, message: 'Return filed successfully! 🎉', severity: 'success' });
            setFileDialog({ open: false, data: null });
        } else {
            setSnackbar({ open: true, message: result.payload || 'Error filing return', severity: 'error' });
        }
    };

    // ── Render ────────────────────────────────────────────

    return (
        <Box p={3}>

            {/* ── Header ── */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                mb={3}
                spacing={2}
            >
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        GST Returns
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        GSTR-1 aur GSTR-3B returns manage karo
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Refresh">
                        <IconButton onClick={() => dispatch(fetchReturns({}))} disabled={returnsLoading}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<SaveAlt />}
                        onClick={() => setCreateOpen(true)}
                    >
                        New Draft
                    </Button>
                </Stack>
            </Stack>

            {/* ── Error ── */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* ── Stats ── */}
            {returns.length > 0 && <StatsCards returns={returns} />}

            {/* ── Filters ── */}
            <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ sm: 'center' }}
                >
                    <Stack direction="row" spacing={1} alignItems="center">
                        <FilterList fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight={600}>
                            Filters
                        </Typography>
                    </Stack>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Return Type</InputLabel>
                        <Select
                            value={filters.return_type}
                            label="Return Type"
                            onChange={(e) => handleFilterChange('return_type', e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="GSTR1">GSTR-1</MenuItem>
                            <MenuItem value="GSTR3B">GSTR-3B</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filters.status}
                            label="Status"
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="draft">Draft</MenuItem>
                            <MenuItem value="filed">Filed</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        type="month"
                        label="Period"
                        size="small"
                        value={filters.period}
                        onChange={(e) => handleFilterChange('period', e.target.value)}
                        sx={{ width: 160 }}
                    />
                    {(filters.return_type || filters.status || filters.period) && (
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleResetFilters}
                            startIcon={<Close />}
                        >
                            Clear
                        </Button>
                    )}
                </Stack>
            </Paper>

            {/* ── Table ── */}
            <Card elevation={2}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                {['#', 'Return Type', 'Period', 'Deadline', 'Status', 'Tax Liability', 'Filed At', 'Actions'].map((col) => (
                                    <TableCell key={col} sx={{ fontWeight: 700 }}>
                                        {col}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {returnsLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : returns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <Stack spacing={1} alignItems="center">
                                            <Receipt sx={{ fontSize: 48, color: 'text.disabled' }} />
                                            <Typography color="text.secondary">
                                                Koi return nahi mila
                                            </Typography>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => setCreateOpen(true)}
                                            >
                                                Pehla Draft Banao
                                            </Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                returns.map((ret, i) => {
                                    const taxLiability =
                                        ret.data_snapshot?.tax_liability?.total_tax ||
                                        ret.data_snapshot?.summary?.total_tax ||
                                        null;

                                    return (
                                        <TableRow
                                            key={ret.id}
                                            hover
                                            sx={{
                                                bgcolor: ret.status === 'filed'
                                                    ? 'success.lighter'
                                                    : 'inherit',
                                            }}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {i + 1}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <ReturnTypeChip type={ret.return_type} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={ret.period}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {ret.status === 'draft' && (
                                                    <DeadlineInfo
                                                        period={ret.period}
                                                        returnType={ret.return_type}
                                                    />
                                                )}
                                                {ret.status === 'filed' && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        —
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <StatusChip status={ret.status} />
                                            </TableCell>
                                            <TableCell>
                                                {taxLiability !== null ? (
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={700}
                                                        color="error.main"
                                                    >
                                                        {fmt(taxLiability)}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled">
                                                        —
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">
                                                    {ret.filed_at || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    {/* Re-generate Draft */}
                                                    {ret.status === 'draft' && (
                                                        <Tooltip title="Draft update karo (latest data se)">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<Refresh />}
                                                                onClick={() =>
                                                                    handleCreateDraft({
                                                                        return_type: ret.return_type,
                                                                        period: ret.period,
                                                                    })
                                                                }
                                                                disabled={actionLoading}
                                                            >
                                                                Update
                                                            </Button>
                                                        </Tooltip>
                                                    )}
                                                    {/* File */}
                                                    {ret.status === 'draft' && (
                                                        <Tooltip title="Filed mark karo">
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="success"
                                                                startIcon={<FileUpload />}
                                                                onClick={() =>
                                                                    setFileDialog({ open: true, data: ret })
                                                                }
                                                                disabled={actionLoading}
                                                            >
                                                                File
                                                            </Button>
                                                        </Tooltip>
                                                    )}
                                                    {/* Filed badge */}
                                                    {ret.status === 'filed' && (
                                                        <Chip
                                                            icon={<CheckCircle />}
                                                            label="Filed"
                                                            size="small"
                                                            color="success"
                                                        />
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* ── Dialogs ── */}
            <CreateDraftDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onSubmit={handleCreateDraft}
                loading={actionLoading}
            />

            <FileConfirmDialog
                open={fileDialog.open}
                onClose={() => setFileDialog({ open: false, data: null })}
                onConfirm={handleFileConfirm}
                returnData={fileDialog.data}
                loading={actionLoading}
            />

            {/* ── Snackbar ── */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

        </Box>
    );
};

export default GstReturnsPage;
