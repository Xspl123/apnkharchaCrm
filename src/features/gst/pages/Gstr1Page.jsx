import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { fetchGstr1, saveReturnDraft, setSelectedPeriod } from '../state/gstSlice';
import {
    Box, Grid, Card, CardContent, Typography, TextField, Button,
    Chip, CircularProgress, Alert, Paper, Stack, Tab, Tabs,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Collapse, IconButton, Tooltip, Snackbar,
} from '@mui/material';
import {
    ExpandMore, ExpandLess, SaveAlt, Download,
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
const num = (val) => Number(val) || 0;

const addWorkbookSheet = (workbook, name, columns, rows) => {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns;
    sheet.addRows(rows);
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: Math.max(1, sheet.rowCount), column: columns.length },
    };
    sheet.getRow(1).height = 24;
    sheet.getRow(1).eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', wrapText: true };
    });
    return sheet;
};

const buildGstr1Workbook = async (report, period) => {
    const b2bGroups = Array.isArray(report?.b2b) ? report.b2b : [];
    const b2cs = Array.isArray(report?.b2cs) ? report.b2cs : [];
    const b2cl = Array.isArray(report?.b2cl) ? report.b2cl : [];
    const exports = Array.isArray(report?.exports) ? report.exports : [];
    const hsnSummary = Array.isArray(report?.hsn_summary) ? report.hsn_summary : [];
    const issues = [];
    const checkRequired = (category, record, fields) => {
        fields.forEach(([key, label]) => {
            if (record[key] === null || record[key] === undefined || String(record[key]).trim() === '') {
                issues.push({ category, invoice: record.invoice_no || '', field: label, issue: 'Missing value' });
            }
        });
    };

    const b2bRows = b2bGroups.flatMap((group) => {
        const invoices = Array.isArray(group.invoices) ? group.invoices : [];
        return invoices.map((invoice) => {
            if (!group.gstin || String(group.gstin).trim().length !== 15) {
                issues.push({ category: 'B2B', invoice: invoice.invoice_no || '', field: 'Recipient GSTIN', issue: 'Missing or invalid GSTIN length' });
            }
            checkRequired('B2B', invoice, [
                ['invoice_no', 'Invoice number'], ['invoice_date', 'Invoice date'],
                ['supply_type', 'Supply type'], ['place_of_supply', 'Place of supply'],
            ]);
            return {
                'Recipient GSTIN': group.gstin || '',
                'Recipient Name': group.receiver_name || '',
                'Invoice Number': invoice.invoice_no || '',
                'Invoice Date': invoice.invoice_date || '',
                'Supply Type': invoice.supply_type || '',
                'Place of Supply': invoice.place_of_supply || '',
                'Taxable Value': num(invoice.taxable_value),
                CGST: num(invoice.cgst),
                SGST: num(invoice.sgst),
                IGST: num(invoice.igst),
                'Invoice Value': num(invoice.invoice_value),
                'Reverse Charge': invoice.is_reverse_charge || '',
            };
        });
    });
    const b2csRows = b2cs.map((row) => {
        checkRequired('B2CS', row, [['place_of_supply', 'Place of supply']]);
        return {
            'Place of Supply Code': row.place_of_supply || '',
            'Place of Supply': row.place_of_supply_name || '',
            'Supply Type': row.supply_type || '',
            'Taxable Value': num(row.total_taxable_value),
            CGST: num(row.total_cgst),
            SGST: num(row.total_sgst),
            IGST: num(row.total_igst),
            'Invoice Count': num(row.invoice_count),
        };
    });
    const b2clRows = b2cl.map((invoice) => {
        checkRequired('B2CL', invoice, [['invoice_no', 'Invoice number'], ['invoice_date', 'Invoice date'], ['place_of_supply', 'Place of supply']]);
        return {
            'Invoice Number': invoice.invoice_no || '',
            'Invoice Date': invoice.invoice_date || '',
            'Place of Supply': invoice.place_of_supply || '',
            'Taxable Value': num(invoice.taxable_value),
            IGST: num(invoice.igst),
            'Invoice Value': num(invoice.invoice_value),
            'Reverse Charge': invoice.is_reverse_charge || '',
        };
    });
    const exportRows = exports.map((invoice) => {
        checkRequired('Exports', invoice, [['invoice_no', 'Invoice number'], ['invoice_date', 'Invoice date']]);
        return {
            'Invoice Number': invoice.invoice_no || '',
            'Invoice Date': invoice.invoice_date || '',
            Client: invoice.client_name || '',
            'Taxable Value': num(invoice.taxable_value),
            IGST: num(invoice.igst),
            'Invoice Value': num(invoice.invoice_value),
        };
    });
    const hsnRows = hsnSummary.map((row) => {
        checkRequired('HSN Summary', row, [['hsn_code', 'HSN code']]);
        return {
            'HSN Code': row.hsn_code || '',
            Description: row.description || '',
            UQC: row.uqc || '',
            Quantity: num(row.total_qty),
            'Taxable Value': num(row.taxable_value),
            CGST: num(row.total_cgst),
            SGST: num(row.total_sgst),
            IGST: num(row.total_igst),
        };
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ApnaKharch';
    const summaryRows = [
        { Field: 'Return period', Value: period },
        { Field: 'B2B invoices', Value: b2bRows.length },
        { Field: 'B2CS summaries', Value: b2csRows.length },
        { Field: 'B2CL invoices', Value: b2clRows.length },
        { Field: 'Export invoices', Value: exportRows.length },
        { Field: 'HSN rows', Value: hsnRows.length },
        { Field: 'Validation issues', Value: issues.length },
        { Field: 'Coverage', Value: 'Includes only the sections currently present in this app report. Check other applicable GSTR-1 tables separately.' },
        { Field: 'Note', Value: 'Review this workbook and transfer supported data into the current GSTN Returns Offline Tool. This workbook is not an upload file or complete GST validation.' },
    ];
    addWorkbookSheet(workbook, 'Summary', [{ header: 'Field', key: 'Field', width: 26 }, { header: 'Value', key: 'Value', width: 90 }], summaryRows);
    addWorkbookSheet(workbook, 'B2B', [
        { header: 'Recipient GSTIN', key: 'Recipient GSTIN', width: 20 }, { header: 'Recipient Name', key: 'Recipient Name', width: 28 },
        { header: 'Invoice Number', key: 'Invoice Number', width: 20 }, { header: 'Invoice Date', key: 'Invoice Date', width: 16 },
        { header: 'Supply Type', key: 'Supply Type', width: 16 }, { header: 'Place of Supply', key: 'Place of Supply', width: 18 },
        { header: 'Taxable Value', key: 'Taxable Value', width: 18 }, { header: 'CGST', key: 'CGST', width: 16 },
        { header: 'SGST', key: 'SGST', width: 16 }, { header: 'IGST', key: 'IGST', width: 16 },
        { header: 'Invoice Value', key: 'Invoice Value', width: 18 }, { header: 'Reverse Charge', key: 'Reverse Charge', width: 18 },
    ], b2bRows);
    addWorkbookSheet(workbook, 'B2CS', Object.keys(b2csRows[0] || {
        'Place of Supply Code': '', 'Place of Supply': '', 'Supply Type': '', 'Taxable Value': '', CGST: '', SGST: '', IGST: '', 'Invoice Count': '',
    }).map((key) => ({ header: key, key, width: 22 })), b2csRows);
    addWorkbookSheet(workbook, 'B2CL', Object.keys(b2clRows[0] || {
        'Invoice Number': '', 'Invoice Date': '', 'Place of Supply': '', 'Taxable Value': '', IGST: '', 'Invoice Value': '', 'Reverse Charge': '',
    }).map((key) => ({ header: key, key, width: 22 })), b2clRows);
    addWorkbookSheet(workbook, 'Exports', Object.keys(exportRows[0] || {
        'Invoice Number': '', 'Invoice Date': '', Client: '', 'Taxable Value': '', IGST: '', 'Invoice Value': '',
    }).map((key) => ({ header: key, key, width: 22 })), exportRows);
    addWorkbookSheet(workbook, 'HSN Summary', Object.keys(hsnRows[0] || {
        'HSN Code': '', Description: '', UQC: '', Quantity: '', 'Taxable Value': '', CGST: '', SGST: '', IGST: '',
    }).map((key) => ({ header: key, key, width: 22 })), hsnRows);
    addWorkbookSheet(workbook, 'Validation', [
        { header: 'Section', key: 'category', width: 20 }, { header: 'Invoice Number', key: 'invoice', width: 22 },
        { header: 'Field', key: 'field', width: 24 }, { header: 'Issue', key: 'issue', width: 36 },
    ], issues);

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `GSTR1_review_${period}.xlsx`
    );
    return issues.length;
};

// ── Empty State ───────────────────────────────────────────

const EmptyRow = ({ cols, message }) => (
    <TableRow>
        <TableCell colSpan={cols} align="center" sx={{ py: 4, color: 'text.secondary' }}>
            {message || 'No data found.'}
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
        return <EmptyRow cols={1} message="No B2B invoices for this period" />;

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
                                        num(group.total_cgst) +
                                        num(group.total_sgst) +
                                        num(group.total_igst)
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
                <Typography color="text.secondary">No B2CS invoices for this period</Typography>
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
                <Typography color="text.secondary">No B2CL invoices for this period</Typography>
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
                <Typography color="text.secondary">No export invoices for this period</Typography>
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
                <Typography color="text.secondary">No HSN data found.</Typography>
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
    const [exportLoading, setExportLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        dispatch(fetchGstr1(selectedPeriod));
    }, [dispatch, selectedPeriod]);

    const handleFetch = () => {
        if (!period) return;
        if (period === selectedPeriod) dispatch(fetchGstr1(period));
        else dispatch(setSelectedPeriod(period));
        setTab(0);
    };

    const handleSaveDraft = async () => {
        const draftPeriod = gstr1?.period || selectedPeriod || period;
        if (!draftPeriod) {
            setSnackbar({ open: true, message: 'Please select a return period first.', severity: 'error' });
            return;
        }
        const result = await dispatch(saveReturnDraft({
            return_type: 'GSTR1',
            period: draftPeriod,
        }));
        if (saveReturnDraft.fulfilled.match(result)) {
            setSnackbar({ open: true, message: 'GSTR-1 draft saved!', severity: 'success' });
        } else {
            setSnackbar({ open: true, message: result.payload || 'Error saving draft', severity: 'error' });
        }
    };

    const handleExportWorkbook = async () => {
        setExportLoading(true);
        try {
            const issueCount = await buildGstr1Workbook(gstr1, gstr1?.period || selectedPeriod);
            setSnackbar({
                open: true,
                message: issueCount
                    ? `Workbook downloaded with ${issueCount} missing-field warning(s). Review the Validation sheet.`
                    : 'GSTR-1 review workbook downloaded.',
                severity: issueCount ? 'warning' : 'success',
            });
        } catch (downloadError) {
            setSnackbar({ open: true, message: downloadError.message || 'Could not create the workbook.', severity: 'error' });
        } finally {
            setExportLoading(false);
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
        <Box p={{ xs: 1.5, sm: 3 }}>

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

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <TextField
                        type="month"
                        size="small"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        sx={{ width: { xs: '100%', sm: 180 } }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleFetch}
                        disabled={gstr1Loading}
                    >
                        {gstr1Loading ? <CircularProgress size={20} color="inherit" /> : 'Fetch'}
                    </Button>
                    {gstr1 && (
                        <>
                            <Tooltip title="Download a section-wise workbook for review and transfer into the GSTN offline tool">
                                <span>
                                    <Button
                                        variant="outlined"
                                        startIcon={exportLoading ? <CircularProgress size={16} /> : <Download />}
                                        onClick={handleExportWorkbook}
                                        disabled={exportLoading}
                                    >
                                        {exportLoading ? 'Preparing…' : 'Download Excel'}
                                    </Button>
                                </span>
                            </Tooltip>
                            <Tooltip title="Save this return as a draft in the app">
                                <span>
                                    <Button
                                        variant="outlined"
                                        startIcon={<SaveAlt />}
                                        onClick={handleSaveDraft}
                                        disabled={actionLoading}
                                    >
                                        Save Draft
                                    </Button>
                                </span>
                            </Tooltip>
                        </>
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
                        Select a period and fetch the data
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
