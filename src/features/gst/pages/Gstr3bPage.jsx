import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGstr3b, saveReturnDraft, setSelectedPeriod } from '../state/gstSlice';
import {
    Box, Grid, Card, CardContent, Typography, TextField, Button,
    Chip, CircularProgress, Alert, Paper, Stack, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    Snackbar, Tooltip,
} from '@mui/material';
import {
    SaveAlt, AccountBalance, ArrowUpward, Info,
} from '@mui/icons-material';

// ── Helpers ───────────────────────────────────────────────

const fmt = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const THead = ({ cols }) => (
    <TableHead>
        <TableRow sx={{ bgcolor: 'primary.main' }}>
            {cols.map((col, i) => (
                <TableCell
                    key={i}
                    align={col.align || 'left'}
                    sx={{ color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                    {typeof col === 'object' ? col.label : col}
                </TableCell>
            ))}
        </TableRow>
    </TableHead>
);

// ── Section Header ────────────────────────────────────────

const SectionHeader = ({ number, title, subtitle, color = 'primary.main' }) => (
    <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
        <Box
            sx={{
                minWidth: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Typography variant="body2" fontWeight={700} color="#fff">
                {number}
            </Typography>
        </Box>
        <Box>
            <Typography variant="subtitle1" fontWeight={700}>
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="caption" color="text.secondary">
                    {subtitle}
                </Typography>
            )}
        </Box>
    </Stack>
);

// ── Tax Row ───────────────────────────────────────────────

const TaxRow = ({ label, taxable, cgst, sgst, igst, highlight }) => (
    <TableRow
        sx={{
            bgcolor: highlight ? 'error.lighter' : 'inherit',
            '&:hover': { bgcolor: 'grey.50' },
        }}
    >
        <TableCell>
            <Typography
                variant="body2"
                fontWeight={highlight ? 700 : 400}
                color={highlight ? 'error.main' : 'text.primary'}
            >
                {label}
            </Typography>
        </TableCell>
        <TableCell align="right">
            <Typography variant="body2" fontWeight={highlight ? 700 : 400}>
                {fmt(taxable)}
            </Typography>
        </TableCell>
        <TableCell align="right">
            <Typography variant="body2" color="#1976d2" fontWeight={highlight ? 700 : 400}>
                {fmt(cgst)}
            </Typography>
        </TableCell>
        <TableCell align="right">
            <Typography variant="body2" color="#2e7d32" fontWeight={highlight ? 700 : 400}>
                {fmt(sgst)}
            </Typography>
        </TableCell>
        <TableCell align="right">
            <Typography variant="body2" color="#ed6c02" fontWeight={highlight ? 700 : 400}>
                {fmt(igst)}
            </Typography>
        </TableCell>
        <TableCell align="right">
            <Typography
                variant="body2"
                fontWeight={700}
                color={highlight ? 'error.main' : 'text.primary'}
            >
                {fmt((cgst || 0) + (sgst || 0) + (igst || 0))}
            </Typography>
        </TableCell>
    </TableRow>
);

// ── Table 3.1 — Outward Supplies ──────────────────────────

const OutwardSuppliesSection = ({ data }) => {
    if (!data) return null;

    const { intra_taxable, inter_taxable, exports, reverse_charge } = data;

    return (
        <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
                <SectionHeader
                    number="3.1"
                    title="Details of Outward Supplies and Inward Supplies liable to Reverse Charge"
                    subtitle="Is period mein aapne jo becha uski GST detail"
                    color="primary.main"
                />
                <TableContainer>
                    <Table size="small">
                        <THead
                            cols={[
                                'Nature of Supplies',
                                { label: 'Taxable Value', align: 'right' },
                                { label: 'CGST', align: 'right' },
                                { label: 'SGST/UTGST', align: 'right' },
                                { label: 'IGST', align: 'right' },
                                { label: 'Total Tax', align: 'right' },
                            ]}
                        />
                        <TableBody>
                            {/* 3.1(a) Intra-state */}
                            <TaxRow
                                label="3.1(a) Outward taxable supplies — Intra-state"
                                taxable={intra_taxable?.taxable_value}
                                cgst={intra_taxable?.cgst}
                                sgst={intra_taxable?.sgst}
                                igst={0}
                            />
                            {/* 3.1(a) Inter-state */}
                            <TaxRow
                                label="3.1(a) Outward taxable supplies — Inter-state"
                                taxable={inter_taxable?.taxable_value}
                                cgst={0}
                                sgst={0}
                                igst={inter_taxable?.igst}
                            />
                            {/* 3.1(b) Exports */}
                            <TaxRow
                                label="3.1(b) Zero-rated supply (Exports)"
                                taxable={exports?.taxable_value}
                                cgst={0}
                                sgst={0}
                                igst={exports?.igst}
                            />
                            {/* 3.1(d) Reverse Charge */}
                            <TaxRow
                                label="3.1(d) Inward supplies liable to Reverse Charge (RCM)"
                                taxable={reverse_charge?.taxable_value}
                                cgst={reverse_charge?.cgst}
                                sgst={reverse_charge?.sgst}
                                igst={reverse_charge?.igst}
                            />
                            {/* Total Row */}
                            <TaxRow
                                label="Total Outward Tax Liability"
                                taxable={
                                    (intra_taxable?.taxable_value || 0) +
                                    (inter_taxable?.taxable_value || 0) +
                                    (exports?.taxable_value || 0)
                                }
                                cgst={
                                    (intra_taxable?.cgst || 0) +
                                    (reverse_charge?.cgst || 0)
                                }
                                sgst={
                                    (intra_taxable?.sgst || 0) +
                                    (reverse_charge?.sgst || 0)
                                }
                                igst={
                                    (inter_taxable?.igst || 0) +
                                    (exports?.igst || 0) +
                                    (reverse_charge?.igst || 0)
                                }
                                highlight
                            />
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

// ── Table 3.2 — Inter-state Breakup ──────────────────────

const InterStateSection = ({ data }) => {
    if (!data?.length) return null;

    return (
        <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
                <SectionHeader
                    number="3.2"
                    title="Inter-state Supplies — State-wise Breakup"
                    subtitle="Alag alag states ko ki gayi supply ka detail"
                    color="warning.main"
                />
                <TableContainer>
                    <Table size="small">
                        <THead
                            cols={[
                                'State Code',
                                'State Name',
                                { label: 'Taxable Value', align: 'right' },
                                { label: 'IGST', align: 'right' },
                            ]}
                        />
                        <TableBody>
                            {data.map((row, i) => (
                                <TableRow key={i} hover>
                                    <TableCell>
                                        <Chip label={row.place_of_supply} size="small" />
                                    </TableCell>
                                    <TableCell>{row.place_of_supply_name}</TableCell>
                                    <TableCell align="right">{fmt(row.taxable_value)}</TableCell>
                                    <TableCell align="right">
                                        <Typography fontWeight={600} color="#ed6c02">
                                            {fmt(row.igst)}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {/* Total */}
                            <TableRow sx={{ bgcolor: 'warning.lighter' }}>
                                <TableCell colSpan={2}>
                                    <Typography variant="body2" fontWeight={700}>
                                        Total
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={700}>
                                        {fmt(data.reduce((s, r) => s + (r.taxable_value || 0), 0))}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight={700} color="#ed6c02">
                                        {fmt(data.reduce((s, r) => s + (r.igst || 0), 0))}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

// ── Table 4 — ITC ─────────────────────────────────────────

const ITCSection = () => (
    <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
            <SectionHeader
                number="4"
                title="Eligible ITC (Input Tax Credit)"
                subtitle="Purchase bills se milne wala ITC — manually enter karo"
                color="success.main"
            />
            <Alert severity="info" icon={<Info />}>
                ITC details aapke purchase bills se aati hain. Yeh section abhi manually fill karna hoga.
                M8 (Vendors & Purchase Orders) module complete hone ke baad automatically calculate hoga.
            </Alert>
            <Grid container spacing={2} mt={1}>
                {[
                    { label: '4(A)(1) Import of Goods', color: '#1976d2' },
                    { label: '4(A)(2) Import of Services', color: '#1976d2' },
                    { label: '4(A)(3) Inward RCM Supplies', color: '#2e7d32' },
                    { label: '4(A)(5) All Other ITC', color: '#2e7d32' },
                ].map((item, i) => (
                    <Grid item xs={12} sm={6} key={i}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                border: '1px dashed',
                                borderColor: 'divider',
                                borderRadius: 2,
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                {item.label}
                            </Typography>
                            <Stack direction="row" spacing={1} mt={1}>
                                {['IGST', 'CGST', 'SGST'].map((tax) => (
                                    <TextField
                                        key={tax}
                                        label={tax}
                                        size="small"
                                        type="number"
                                        defaultValue={0}
                                        sx={{ flex: 1 }}
                                        inputProps={{ min: 0 }}
                                    />
                                ))}
                            </Stack>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </CardContent>
    </Card>
);

// ── Table 6 — Tax Liability Summary ──────────────────────

const TaxLiabilitySection = ({ data }) => {
    if (!data) return null;

    return (
        <Card elevation={2} sx={{ mb: 3, border: '2px solid', borderColor: 'error.main' }}>
            <CardContent>
                <SectionHeader
                    number="6"
                    title="Tax Liability Summary"
                    subtitle="Is period mein total GST pay karna hai"
                    color="error.main"
                />
                <Grid container spacing={2}>
                    {[
                        { label: 'CGST Payable', value: data.total_cgst, color: '#1976d2', icon: <ArrowUpward /> },
                        { label: 'SGST/UTGST Payable', value: data.total_sgst, color: '#2e7d32', icon: <ArrowUpward /> },
                        { label: 'IGST Payable', value: data.total_igst, color: '#ed6c02', icon: <ArrowUpward /> },
                    ].map((item, i) => (
                        <Grid item xs={12} sm={4} key={i}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    bgcolor: 'grey.50',
                                    borderRadius: 2,
                                    borderLeft: '4px solid',
                                    borderColor: item.color,
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    {item.label}
                                </Typography>
                                <Typography variant="h5" fontWeight={700} color={item.color} mt={0.5}>
                                    {fmt(item.value)}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}

                    {/* Grand Total */}
                    <Grid item xs={12}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                bgcolor: 'error.main',
                                borderRadius: 2,
                            }}
                        >
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <AccountBalance sx={{ color: '#fff' }} />
                                    <Typography variant="subtitle1" fontWeight={700} color="#fff">
                                        Total GST Payable This Period
                                    </Typography>
                                </Stack>
                                <Typography variant="h4" fontWeight={700} color="#fff">
                                    {fmt(data.total_tax)}
                                </Typography>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

// ── Main Page ─────────────────────────────────────────────

const Gstr3bPage = () => {
    const dispatch = useDispatch();
    const { gstr3b, gstr3bLoading, error, selectedPeriod, actionLoading } =
        useSelector((s) => s.gst);

    const [period, setPeriod]     = useState(selectedPeriod);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        dispatch(fetchGstr3b(selectedPeriod));
    }, [dispatch, selectedPeriod]);

    const handleFetch = () => {
        dispatch(setSelectedPeriod(period));
        dispatch(fetchGstr3b(period));
    };

    const handleSaveDraft = async () => {
        const result = await dispatch(saveReturnDraft({
            return_type: 'GSTR3B',
            period: gstr3b.period,
        }));
        if (saveReturnDraft.fulfilled.match(result)) {
            setSnackbar({ open: true, message: 'GSTR-3B draft saved!', severity: 'success' });
        } else {
            setSnackbar({ open: true, message: result.payload || 'Error', severity: 'error' });
        }
    };

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
                        GSTR-3B Report
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Monthly tax summary — outward supplies, ITC aur tax liability
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        type="month"
                        size="small"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        sx={{ width: 180 }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleFetch}
                        disabled={gstr3bLoading}
                    >
                        {gstr3bLoading
                            ? <CircularProgress size={20} color="inherit" />
                            : 'Fetch'
                        }
                    </Button>
                    {gstr3b && (
                        <Tooltip title="Draft ke taur pe save karo">
                            <Button
                                variant="outlined"
                                startIcon={<SaveAlt />}
                                onClick={handleSaveDraft}
                                disabled={actionLoading}
                            >
                                Save Draft
                            </Button>
                        </Tooltip>
                    )}
                </Stack>
            </Stack>

            {/* ── GSTR-1 vs 3B info ── */}
            <Alert severity="info" sx={{ mb: 3 }} icon={<Info />}>
                <strong>GSTR-3B</strong> mein sirf totals jaate hain (invoice-wise detail nahi).
                20 tarikh tak file karna hota hai. Tax liability yahan pay karni hoti hai.
            </Alert>

            {/* ── Error ── */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* ── Loading ── */}
            {gstr3bLoading && (
                <Box display="flex" justifyContent="center" py={8}>
                    <CircularProgress />
                </Box>
            )}

            {/* ── Data ── */}
            {!gstr3bLoading && gstr3b && (
                <>
                    <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                        <Typography variant="body2" color="text.secondary">Period:</Typography>
                        <Chip label={gstr3b.period} color="primary" size="small" variant="outlined" />
                        <Chip label="Deadline: 20th of next month" color="error" size="small" variant="outlined" />
                    </Stack>

                    {/* Table 3.1 */}
                    <OutwardSuppliesSection data={gstr3b.outward_supplies} />

                    {/* Table 3.2 */}
                    <InterStateSection data={gstr3b.inter_state_supplies} />

                    {/* Table 4 — ITC */}
                    <ITCSection />

                    {/* Table 6 — Tax Liability */}
                    <TaxLiabilitySection data={gstr3b.tax_liability} />
                </>
            )}

            {/* ── Empty ── */}
            {!gstr3bLoading && !gstr3b && !error && (
                <Box textAlign="center" py={8}>
                    <Typography color="text.secondary">
                        Period select karo aur Fetch karo
                    </Typography>
                </Box>
            )}

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

export default Gstr3bPage;
