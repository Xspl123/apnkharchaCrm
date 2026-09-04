import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGstr1, saveReturnDraft, setSelectedPeriod } from '../state/gstSlice';
import {
    Box, Grid, Card, CardContent, Typography, TextField, Button,
    Chip, CircularProgress, Alert, Paper, Stack, Tab, Tabs,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Collapse, IconButton, Tooltip, Snackbar,
} from '@mui/material';
import {
    ExpandMore, ExpandLess, SaveAlt,
    Business, Person, LocalShipping, Inventory,
} from '@mui/icons-material';

// ── Reusable Table Header ─────────────────────────────────

const THead = ({ cols }) => (
    <TableHead>
        <TableRow sx={{ bgcolor: 'primary.main' }}>
            {cols.map((col, i) => (
                <TableCell
                    key={i}
                    sx={{ color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}
                    align={col.align || 'left'}
                >
                    {col}
                </TableCell>
            ))}
        </TableRow>
    </TableHead>
);

// ── Currency Format ───────────────────────────────────────

const fmt = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ── Empty State ───────────────────────────────────────────

const EmptyRow = ({ cols, message }) => (
    <TableRow>
        <TableCell colSpan={cols} align="center" sx={{ py: 4, color: 'text.secondary' }}>
            {message || 'Koi data nahi'}
        </TableCell>
    </TableRow>
);

// ── Summary Strip ─────────────────────────────────────────

const SummaryStrip = ({ summary }) => (
    <Paper elevation={0} sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2, mb: 3 }}>
        <Grid container spacing={2} textAlign="center">
            {[
                { label: 'Taxable Value', value: fmt(summary?.total_taxable_value), color: 'text.primary' },
                { label: 'CGST', value: fmt(summary?.total_cgst), color: '#1976d2' },
                { label: 'SGST', value: fmt(summary?.total_sgst), color: '#2e7d32' },
                { label: 'IGST', value: fmt(summary?.total_igst), color: '#ed6c02' },
                { label: 'Total Tax', value: fmt(summary?.total_tax), color: 'error.main' },
                { label: 'Invoice Value', value: fmt(summary?.total_invoice_value), color: 'text.primary' },
            ].map((item, i) => (
                <Grid item xs={6} sm={4} md={2} key={i}>
                    <Typography variant="caption" color="text.secondary" display="block">
                        {item.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color={item.color}>
                        {item.value}
                    </Typography>
                </Grid>
            ))}
        </Grid>
    </Paper>
);

// ── B2B Tab ───────────────────────────────────────────────

const B2BTab = ({ data }) => {
    const [expanded, setExpanded] = useState({});

    const toggle = (gstin) =>
        setExpanded((prev) => ({ ...prev, [gstin]: !prev[gstin] }));

    if (!data?.length)
        return <EmptyRow cols={1} message="Is period mein koi B2B invoice nahi" />;

    return (
        <>
            {data.map((group) => (
                <Box key={group.gstin} mb={2}>
                    {/* Group Header */}
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            bgcolor: expanded[group.gstin] ? 'primary.lighter' : 'background.paper',
                            '&:hover': { bgcolor: 'grey.50' },
                        }}
                        onClick={() => toggle(group.gstin)}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Business color="primary" />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    {group.receiver_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    GSTIN: {group.gstin}
                                </Typography>
                            </Box>
                            <Chip
                                label={`${group.invoices?.length} invoice${group.invoices?.length > 1 ? 's' : ''}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        </Stack>
                        <Stack direction="row" spacing={3} alignItems="center">
                            <Box textAlign="right">
                                <Typography variant="caption" color="text.secondary">
                                    Taxable
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                    {fmt(group.total_taxable)}
                                </Typography>
                            </Box>
                            <Box textAlign="right">
                                <Typography variant="caption" color="text.secondary">
                                    Tax
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color="error.main">
                                    {fmt(
                                        (group.total_cgst || 0) +
                                        (group.total_sgst || 0) +
                                        (group.total_igst || 0)
                                    )}
                                </Typography>
                            </Box>
                            <IconButton size="small">
                                {expanded[group.gstin] ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        </Stack>
                    </Paper>

                    {/* Invoices Table */}
                    <Collapse in={!!expanded[group.gstin]}>
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderTop: 0 }}>
                            <Table size="small">
                                <THead cols={['Invoice No', 'Date', 'Type', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total', 'RCM']} />
                                <TableBody>
                                    {group.invoices?.map((inv) => (
                                        <TableRow key={inv.invoice_no} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} color="primary.main">
                                                    {inv.invoice_no}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{inv.invoice_date}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={inv.supply_type?.toUpperCase()}
                                                    size="small"
                                                    color={inv.supply_type === 'intra' ? 'success' : 'warning'}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="right">{fmt(inv.taxable_value)}</TableCell>
                                            <TableCell align="right">{fmt(inv.cgst)}</TableCell>
                                            <TableCell align="right">{fmt(inv.sgst)}</TableCell>
                                            <TableCell align="right">{fmt(inv.igst)}</TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight={700}>
                                                    {fmt(inv.invoice_value)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={inv.is_reverse_charge}
                                                    size="small"
                                                    color={inv.is_reverse_charge === 'Y' ? 'error' : 'default'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Collapse>
                </Box>
            ))}
        </>
    );
};

// ── B2CS Tab ──────────────────────────────────────────────

const B2CSTab = ({ data }) => {
    if (!data?.length)
        return (
            <Box py={4} textAlign="center">
                <Typography color="text.secondary">Is period mein koi B2CS invoice nahi</Typography>
            </Box>
        );

    return (
        <TableContainer component={Paper} elevation={1}>
            <Table>
                <THead cols={['Place of Supply', 'State', 'Supply Type', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Invoices']} />
                <TableBody>
                    {data.map((row, i) => (
                        <TableRow key={i} hover>
                            <TableCell>
                                <Chip label={row.place_of_supply} size="small" />
                            </TableCell>
                            <TableCell>{row.place_of_supply_name}</TableCell>
                            <TableCell>
                                <Chip
                                    label={row.supply_type?.toUpperCase()}
                                    size="small"
                                    color={row.supply_type === 'intra' ? 'success' : 'warning'}
                                    variant="outlined"
                                />
                            </TableCell>
                            <TableCell align="right">{fmt(row.total_taxable_value)}</TableCell>
                            <TableCell align="right">{fmt(row.total_cgst)}</TableCell>
                            <TableCell align="right">{fmt(row.total_sgst)}</TableCell>
                            <TableCell align="right">{fmt(row.total_igst)}</TableCell>
                            <TableCell align="center">
                                <Chip label={row.invoice_count} size="small" color="primary" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

// ── B2CL Tab ──────────────────────────────────────────────

const B2CLTab = ({ data }) => {
    if (!data?.length)
        return (
            <Box py={4} textAlign="center">
                <Typography color="text.secondary">Is period mein koi B2CL invoice nahi</Typography>
            </Box>
        );

    return (
        <TableContainer component={Paper} elevation={1}>
            <Table>
                <THead cols={['Invoice No', 'Date', 'Place of Supply', 'Taxable', 'IGST', 'Total', 'RCM']} />
                <TableBody>
                    {data.map((inv, i) => (
                        <TableRow key={i} hover>
                            <TableCell>
                                <Typography variant="body2" fontWeight={600} color="primary.main">
                                    {inv.invoice_no}
                                </Typography>
                            </TableCell>
                            <TableCell>{inv.invoice_date}</TableCell>
                            <TableCell>
                                <Chip label={inv.place_of_supply || 'NA'} size="small" />
                            </TableCell>
                            <TableCell align="right">{fmt(inv.taxable_value)}</TableCell>
                            <TableCell align="right">{fmt(inv.igst)}</TableCell>
                            <TableCell align="right">
                                <Typography fontWeight={700}>{fmt(inv.invoice_value)}</Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Chip
                                    label={inv.is_reverse_charge}
                                    size="small"
                                    color={inv.is_reverse_charge === 'Y' ? 'error' : 'default'}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

// ── Exports Tab ───────────────────────────────────────────

const ExportsTab = ({ data }) => {
    if (!data?.length)
        return (
            <Box py={4} textAlign="center">
                <Typography color="text.secondary">Is period mein koi Export invoice nahi</Typography>
            </Box>
        );

    return (
        <TableContainer component={Paper} elevation={1}>
            <Table>
                <THead cols={['Invoice No', 'Date', 'Client', 'Taxable', 'IGST', 'Total']} />
                <TableBody>
                    {data.map((inv, i) => (
                        <TableRow key={i} hover>
                            <TableCell>
                                <Typography variant="body2" fontWeight={600} color="primary.main">
                                    {inv.invoice_no}
                                </Typography>
                            </TableCell>
                            <TableCell>{inv.invoice_date}</TableCell>
                            <TableCell>{inv.client_name}</TableCell>
                            <TableCell align="right">{fmt(inv.taxable_value)}</TableCell>
                            <TableCell align="right">{fmt(inv.igst)}</TableCell>
                            <TableCell align="right">
                                <Typography fontWeight={700}>{fmt(inv.invoice_value)}</Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

// ── HSN Tab ───────────────────────────────────────────────

const HSNTab = ({ data }) => {
    if (!data?.length)
        return (
            <Box py={4} textAlign="center">
                <Typography color="text.secondary">HSN data nahi mila</Typography>
            </Box>
        );

    return (
        <TableContainer component={Paper} elevation={1}>
            <Table>
                <THead cols={['HSN Code', 'Description', 'UQC', 'Qty', 'Taxable Value', 'CGST', 'SGST', 'IGST']} />
                <TableBody>
                    {data.map((row, i) => (
                        <TableRow key={i} hover>
                            <TableCell>
                                <Chip label={row.hsn_code} size="small" color="secondary" />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 200 }}>
                                <Typography variant="body2" noWrap>
                                    {row.description}
                                </Typography>
                            </TableCell>
                            <TableCell>{row.uqc}</TableCell>
                            <TableCell align="right">{row.total_qty}</TableCell>
                            <TableCell align="right">{fmt(row.taxable_value)}</TableCell>
                            <TableCell align="right">{fmt(row.total_cgst)}</TableCell>
                            <TableCell align="right">{fmt(row.total_sgst)}</TableCell>
                            <TableCell align="right">{fmt(row.total_igst)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

// ── Main Page ─────────────────────────────────────────────

const Gstr1Page = () => {
    const dispatch = useDispatch();
    const { gstr1, gstr1Loading, error, selectedPeriod, actionLoading } =
        useSelector((s) => s.gst);

    const [period, setPeriod]   = useState(selectedPeriod);
    const [tab, setTab]         = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        dispatch(fetchGstr1(selectedPeriod));
    }, [dispatch, selectedPeriod]);

    const handleFetch = () => {
        dispatch(setSelectedPeriod(period));
        dispatch(fetchGstr1(period));
        setTab(0);
    };

    const handleSaveDraft = async () => {
        const result = await dispatch(saveReturnDraft({
            return_type: 'GSTR1',
            period: gstr1.period,
        }));
        if (saveReturnDraft.fulfilled.match(result)) {
            setSnackbar({ open: true, message: 'GSTR-1 draft saved!', severity: 'success' });
        } else {
            setSnackbar({ open: true, message: result.payload || 'Error saving draft', severity: 'error' });
        }
    };

    const tabs = [
        { label: 'B2B', icon: <Business fontSize="small" />, count: gstr1?.b2b?.length },
        { label: 'B2CS', icon: <Person fontSize="small" />, count: gstr1?.b2cs?.length },
        { label: 'B2CL', icon: <Person fontSize="small" />, count: gstr1?.b2cl?.length },
        { label: 'Exports', icon: <LocalShipping fontSize="small" />, count: gstr1?.exports?.length },
        { label: 'HSN Summary', icon: <Inventory fontSize="small" />, count: gstr1?.hsn_summary?.length },
    ];

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
                        GSTR-1 Report
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Outward supplies ka detail — B2B, B2CS, B2CL, Exports, HSN
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
                        disabled={gstr1Loading}
                    >
                        {gstr1Loading ? <CircularProgress size={20} color="inherit" /> : 'Fetch'}
                    </Button>
                    {gstr1 && (
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

            {/* ── Error ── */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* ── Loading ── */}
            {gstr1Loading && (
                <Box display="flex" justifyContent="center" py={8}>
                    <CircularProgress />
                </Box>
            )}

            {/* ── Data ── */}
            {!gstr1Loading && gstr1 && (
                <>
                    {/* Period + Summary */}
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                        <Typography variant="body2" color="text.secondary">Period:</Typography>
                        <Chip label={gstr1.period} color="primary" size="small" variant="outlined" />
                    </Stack>

                    <SummaryStrip summary={gstr1.summary} />

                    {/* Tabs */}
                    <Card elevation={2}>
                        <Tabs
                            value={tab}
                            onChange={(_, v) => setTab(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
                        >
                            {tabs.map((t, i) => (
                                <Tab
                                    key={i}
                                    icon={t.icon}
                                    iconPosition="start"
                                    label={
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <span>{t.label}</span>
                                            {t.count > 0 && (
                                                <Chip
                                                    label={t.count}
                                                    size="small"
                                                    color="primary"
                                                    sx={{ height: 18, fontSize: 10 }}
                                                />
                                            )}
                                        </Stack>
                                    }
                                />
                            ))}
                        </Tabs>

                        <CardContent>
                            {tab === 0 && <B2BTab data={gstr1.b2b} />}
                            {tab === 1 && <B2CSTab data={gstr1.b2cs} />}
                            {tab === 2 && <B2CLTab data={gstr1.b2cl} />}
                            {tab === 3 && <ExportsTab data={gstr1.exports} />}
                            {tab === 4 && <HSNTab data={gstr1.hsn_summary} />}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* ── Empty ── */}
            {!gstr1Loading && !gstr1 && !error && (
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

export default Gstr1Page;
