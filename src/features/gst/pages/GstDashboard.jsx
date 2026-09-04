import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchGstSummary,
  setSelectedPeriod
} from "../state/gstSlice";

import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Chip,
    Divider,
    CircularProgress,
    Alert,
    Paper,
    Stack,
} from '@mui/material';
import {
    Receipt,
    AccountBalance,
    TrendingUp,
    FileUpload,
} from '@mui/icons-material';

// ── Summary Card Component ────────────────────────────────

const SummaryCard = ({ title, value, subtitle, icon, color }) => (
    <Card elevation={2} sx={{ height: '100%' }}>
        <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color={color || 'text.primary'}>
                        {value}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                <Box
                    sx={{
                        bgcolor: `${color || 'primary'}.lighter` ,
                        borderRadius: 2,
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {icon}
                </Box>
            </Stack>
        </CardContent>
    </Card>
);

// ── Tax Breakup Row ───────────────────────────────────────

const TaxRow = ({ label, value, color }) => (
    <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        py={1.2}
        px={2}
        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
    >
        <Stack direction="row" alignItems="center" spacing={1}>
            <Box
                sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: color,
                }}
            />
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
        </Stack>
        <Typography variant="body2" fontWeight={600}>
            ₹{Number(value || 0).toLocaleString('en-IN')}
        </Typography>
    </Stack>
);

// ── Invoice Type Chip ─────────────────────────────────────

const TypeChip = ({ label, count, color }) => (
    <Stack alignItems="center" spacing={0.5}>
        <Typography variant="h6" fontWeight={700} color={color}>
            {count || 0}
        </Typography>
        <Chip label={label} size="small" sx={{ bgcolor: color, color: '#fff', fontWeight: 600 }} />
    </Stack>
);

// ── Main Component ────────────────────────────────────────

const GstDashboard = () => {
    const dispatch  = useDispatch();
    const { summary, summaryLoading, error, selectedPeriod } = useSelector((s) => s.gst);

    // Local period state for input (before user hits fetch)
    const [period, setPeriod] = useState(selectedPeriod);

    useEffect(() => {
        dispatch(fetchGstSummary(selectedPeriod));
    }, [dispatch, selectedPeriod]);

    const handleFetch = () => {
        if (!period) return;
        dispatch(setSelectedPeriod(period));
        dispatch(fetchGstSummary(period));
    };

    // Format currency
    const fmt = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

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
                        GST Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Period-wise GST summary aur tax liability
                    </Typography>
                </Box>

                {/* Period Selector */}
                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        type="month"
                        size="small"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        sx={{ width: 180 }}
                        inputProps={{ max: new Date().toISOString().slice(0, 7) }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleFetch}
                        disabled={summaryLoading}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        {summaryLoading ? <CircularProgress size={20} color="inherit" /> : 'Fetch'}
                    </Button>
                </Stack>
            </Stack>

            {/* ── Error ── */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
                    {error}
                </Alert>
            )}

            {/* ── Loading ── */}
            {summaryLoading && (
                <Box display="flex" justifyContent="center" py={8}>
                    <CircularProgress />
                </Box>
            )}

            {/* ── Data ── */}
            {!summaryLoading && summary && (
                <>
                    {/* Period Badge */}
                    <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                        <Typography variant="body2" color="text.secondary">
                            Showing data for:
                        </Typography>
                        <Chip
                            label={summary.period}
                            color="primary"
                            size="small"
                            variant="outlined"
                        />
                    </Stack>

                    {/* ── Row 1: Main Summary Cards ── */}
                    <Grid container spacing={2} mb={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <SummaryCard
                                title="Total Invoices"
                                value={summary.total_invoices}
                                subtitle="Is period mein"
                                icon={<Receipt color="primary" />}
                                color="primary.main"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <SummaryCard
                                title="Taxable Value"
                                value={fmt(summary.total_taxable_value)}
                                subtitle="GST se pehle"
                                icon={<TrendingUp color="success" />}
                                color="success.main"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <SummaryCard
                                title="Total Tax"
                                value={fmt(summary.total_tax)}
                                subtitle="CGST + SGST + IGST"
                                icon={<AccountBalance color="warning" />}
                                color="warning.main"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <SummaryCard
                                title="Invoice Value"
                                value={fmt(summary.total_invoice_value)}
                                subtitle="Tax included total"
                                icon={<FileUpload color="info" />}
                                color="info.main"
                            />
                        </Grid>
                    </Grid>

                    {/* ── Row 2: Tax Breakup + Invoice Type ── */}
                    <Grid container spacing={2} mb={3}>

                        {/* Tax Breakup */}
                        <Grid item xs={12} md={6}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} mb={1}>
                                        Tax Breakup
                                    </Typography>
                                    <Divider sx={{ mb: 1 }} />
                                    <TaxRow
                                        label="CGST (Central)"
                                        value={summary.total_cgst}
                                        color="#1976d2"
                                    />
                                    <TaxRow
                                        label="SGST (State)"
                                        value={summary.total_sgst}
                                        color="#2e7d32"
                                    />
                                    <TaxRow
                                        label="IGST (Integrated)"
                                        value={summary.total_igst}
                                        color="#ed6c02"
                                    />
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        px={2}
                                        pt={1.5}
                                    >
                                        <Typography variant="body2" fontWeight={700}>
                                            Total Tax Liability
                                        </Typography>
                                        <Typography variant="body1" fontWeight={700} color="error.main">
                                            {fmt(summary.total_tax)}
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Invoice Type Breakup */}
                        <Grid item xs={12} md={6}>
                            <Card elevation={2} sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} mb={1}>
                                        Invoice Type Breakup
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />
                                    <Grid container spacing={2} textAlign="center">
                                        <Grid item xs={6}>
                                            <TypeChip
                                                label="B2B"
                                                count={summary.b2b_count}
                                                color="#1976d2"
                                            />
                                            <Typography variant="caption" display="block" mt={0.5} color="text.secondary">
                                                Registered Business
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TypeChip
                                                label="B2CS"
                                                count={summary.b2cs_count}
                                                color="#2e7d32"
                                            />
                                            <Typography variant="caption" display="block" mt={0.5} color="text.secondary">
                                                Consumer (Small)
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TypeChip
                                                label="B2CL"
                                                count={summary.b2cl_count}
                                                color="#ed6c02"
                                            />
                                            <Typography variant="caption" display="block" mt={0.5} color="text.secondary">
                                                Consumer (Large)
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TypeChip
                                                label="Export"
                                                count={summary.export_count}
                                                color="#9c27b0"
                                            />
                                            <Typography variant="caption" display="block" mt={0.5} color="text.secondary">
                                                Export Invoice
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* ── Row 3: Quick Actions ── */}
                    <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" mb={2}>
                            Quick Actions — {summary.period}
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Button
                                variant="outlined"
                                startIcon={<Receipt />}
                                href={`/gst/gstr1?period=${summary.period}`}
                                fullWidth
                            >
                                GSTR-1 Report Dekho
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<AccountBalance />}
                                href={`/gst/gstr3b?period=${summary.period}`}
                                fullWidth
                            >
                                GSTR-3B Report Dekho
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<FileUpload />}
                                href={`/gst/returns?period=${summary.period}`}
                                fullWidth
                            >
                                Return File Karo
                            </Button>
                        </Stack>
                    </Paper>
                </>
            )}

            {/* ── Empty State ── */}
            {!summaryLoading && !summary && !error && (
                <Box textAlign="center" py={8}>
                    <Typography color="text.secondary">
                        Period select karo aur Fetch karo
                    </Typography>
                </Box>
            )}

        </Box>
    );
};

export default GstDashboard;
