import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Card,
    CardContent,
    Typography,
    Stack,
    Button,
    TextField,
    Chip,
    Divider,
    CircularProgress,
    Alert,
    Snackbar,
    Paper,
    Grid,
    IconButton,
    Tooltip,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
} from '@mui/material';
import {
    Assignment as TrialBalanceIcon,
    Print as PrintIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    WarningAmber as WarningIcon,
    ArrowBack as BackIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const GlassCard = styled(Card)(({ theme }) => ({
    background: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0',
}));

const fmt = (v) => {
    const num = Number(v || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Robust helper to extract ledger name across all backend key variations
const getLedgerName = (row) => {
    if (!row) return '';
    if (typeof row === 'string') return row;
    if (row.ledger) return row.ledger;
    if (row.particulars) return row.particulars;
    if (row.account) return row.account;
    if (row.account_head) return row.account_head;
    if (row.ledger_name) return row.ledger_name;
    if (row.account_name) return row.account_name;
    if (row.head) return row.head;
    if (row.name) return row.name;
    if (row.title) return row.title;
    if (row.label) return row.label;
    if (row.ledger_head) return row.ledger_head;

    const strEntry = Object.entries(row).find(
        ([k, v]) =>
            !['debit', 'credit', 'id', 'type', 'amount', 'balance', 'created_at', 'updated_at'].includes(k.toLowerCase()) &&
            typeof v === 'string' &&
            v.trim() !== ''
    );
    return strEntry ? strEntry[1] : '';
};

export default function OrgTrialBalance() {
    const navigate = useNavigate();

    const getTodayDate = () => new Date().toISOString().split('T')[0];
    const [asOfDate, setAsOfDate] = useState(getTodayDate());
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const [reportData, setReportData] = useState({
        company_name: 'KRUDRACX (APNA KHARCHA SERVICES)',
        as_of_date: getTodayDate(),
        currency: 'INR',
        records: [],
        totals: {
            debit: 0,
            credit: 0,
            difference: 0,
            is_balanced: true,
        },
    });

    const fetchTrialBalance = useCallback(async (targetDate) => {
        setLoading(true);
        setError(null);
        try {
            const dateToFetch = targetDate || asOfDate;
            const res = await axiosClient.get('/reports/trial-balance', {
                params: { as_of_date: dateToFetch },
            });
            const data = res.data?.data || res.data;
            if (data) {
                setReportData(data);
            }
        } catch (err) {
            console.error('Failed to load trial balance:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch Trial Balance data');
            setSnackbar({
                open: true,
                message: 'Failed to fetch Trial Balance data. Please try again.',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [asOfDate]);

    useEffect(() => {
        fetchTrialBalance(asOfDate);
    }, []);

    const handlePresetDate = (type) => {
        const now = new Date();
        let target = '';
        if (type === 'today') {
            target = now.toISOString().split('T')[0];
        } else if (type === 'last_month') {
            const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastOfPrevMonth = new Date(firstOfThisMonth - 1);
            target = lastOfPrevMonth.toISOString().split('T')[0];
        } else if (type === 'fy_end') {
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const fyYear = currentMonth >= 4 ? currentYear : currentYear - 1;
            target = `${fyYear}-03-31`;
        } else if (type === 'half_year') {
            const currentYear = now.getFullYear();
            target = `${currentYear}-09-30`;
        }
        if (target) {
            setAsOfDate(target);
            fetchTrialBalance(target);
        }
    };

    const records = reportData.records || reportData.rows || reportData.ledgers || [];
    const computedTotalDebit = records.reduce((sum, r) => sum + Number(r.debit || 0), 0);
    const computedTotalCredit = records.reduce((sum, r) => sum + Number(r.credit || 0), 0);

    const totalDebit = reportData?.totals?.debit !== undefined ? Number(reportData.totals.debit) : computedTotalDebit;
    const totalCredit = reportData?.totals?.credit !== undefined ? Number(reportData.totals.credit) : computedTotalCredit;

    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01;

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        try {
            const { default: html2pdf } = await import('html2pdf.js');
            const element = document.getElementById('trial-balance-printable');
            if (!element) return;

            const opt = {
                margin: [10, 10, 10, 10],
                filename: `Trial_Balance_${asOfDate}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            };

            await html2pdf().set(opt).from(element).save();
            setSnackbar({ open: true, message: 'Trial Balance PDF downloaded successfully!', severity: 'success' });
        } catch (err) {
            console.error('PDF Export Error:', err);
            setSnackbar({ open: true, message: 'Failed to generate PDF. Use Print button as fallback.', severity: 'error' });
        } finally {
            setPdfLoading(false);
        }
    };

    const handleExportExcel = async () => {
        setExcelLoading(true);
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'ApnaKharcha';
            workbook.created = new Date();

            const worksheet = workbook.addWorksheet('Trial Balance', {
                views: [{ showGridLines: true }],
            });

            worksheet.columns = [
                { width: 48 },
                { width: 22 },
                { width: 22 },
            ];

            worksheet.mergeCells('A1:C1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = reportData.company_name || 'KRUDRACX (APNA KHARCHA SERVICES)';
            titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getRow(1).height = 34;

            worksheet.mergeCells('A2:C2');
            const subCell = worksheet.getCell('A2');
            subCell.value = 'TRIAL BALANCE (तलपट)';
            subCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E293B' } };
            subCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getRow(2).height = 22;

            worksheet.mergeCells('A3:C3');
            const metaCell = worksheet.getCell('A3');
            metaCell.value = `Ledger Balance Summary As on ${asOfDate}  |  Amounts in Indian Rupees (INR ₹)`;
            metaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
            metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getRow(3).height = 18;

            worksheet.addRow([]);

            const headerRow = worksheet.addRow(['Ledger Account Head', 'Debit (Dr ₹)', 'Credit (Cr ₹)']);
            headerRow.height = 26;
            headerRow.eachCell((cell, colNumber) => {
                cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
                cell.alignment = { horizontal: colNumber === 1 ? 'left' : 'right', vertical: 'middle' };
            });

            records.forEach((row, index) => {
                const head = getLedgerName(row);
                const dr = Number(row.debit || 0);
                const cr = Number(row.credit || 0);

                const dataRow = worksheet.addRow([
                    head,
                    dr > 0 ? dr : null,
                    cr > 0 ? cr : null,
                ]);
                dataRow.height = 20;

                const bg = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';

                dataRow.getCell(1).font = { name: 'Arial', size: 10, color: { argb: 'FF1E293B' } };
                dataRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                dataRow.getCell(1).border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };

                dataRow.getCell(2).font = { name: 'Arial', size: 10, color: { argb: dr > 0 ? 'FFDC2626' : 'FF94A3B8' } };
                dataRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                dataRow.getCell(2).numFmt = '₹#,##0.00;[Red]-₹#,##0.00;"—"';
                dataRow.getCell(2).alignment = { horizontal: 'right' };
                dataRow.getCell(2).border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };

                dataRow.getCell(3).font = { name: 'Arial', size: 10, color: { argb: cr > 0 ? 'FF059669' : 'FF94A3B8' } };
                dataRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                dataRow.getCell(3).numFmt = '₹#,##0.00;[Green]-₹#,##0.00;"—"';
                dataRow.getCell(3).alignment = { horizontal: 'right' };
                dataRow.getCell(3).border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
            });

            worksheet.addRow([]);

            const totalRow = worksheet.addRow(['TOTALS', totalDebit, totalCredit]);
            totalRow.height = 26;
            totalRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } };
            totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

            totalRow.getCell(2).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFDC2626' } };
            totalRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
            totalRow.getCell(2).numFmt = '₹#,##0.00;[Red]-₹#,##0.00;"₹0.00"';
            totalRow.getCell(2).alignment = { horizontal: 'right' };

            totalRow.getCell(3).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF059669' } };
            totalRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
            totalRow.getCell(3).numFmt = '₹#,##0.00;[Green]-₹#,##0.00;"₹0.00"';
            totalRow.getCell(3).alignment = { horizontal: 'right' };

            [1, 2, 3].forEach((c) => {
                totalRow.getCell(c).border = {
                    top: { style: 'medium', color: { argb: 'FF94A3B8' } },
                    bottom: { style: 'double', color: { argb: 'FF0F172A' } },
                };
            });

            worksheet.addRow([]);
            const statusRow = worksheet.addRow([
                isBalanced
                    ? 'STATUS: BALANCED (Total Debit = Total Credit)'
                    : `STATUS: UNBALANCED (Difference: ₹${difference.toFixed(2)})`,
            ]);
            statusRow.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: isBalanced ? { argb: 'FF059669' } : { argb: 'FFDC2626' } };

            worksheet.addRow([]);
            worksheet.addRow([]);
            const signRow = worksheet.addRow([
                'Prepared By',
                'Verified By Auditor',
                'Authorized Signatory',
            ]);
            signRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF475569' } };
            signRow.alignment = { horizontal: 'center' };

            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(
                new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
                `Trial_Balance_${asOfDate}.xlsx`
            );
            setSnackbar({ open: true, message: 'Trial Balance Excel exported successfully!', severity: 'success' });
        } catch (err) {
            console.error('Excel Export Error:', err);
            setSnackbar({ open: true, message: 'Failed to export Excel. Please try again.', severity: 'error' });
        } finally {
            setExcelLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }} className="page-shell">
            <style>
                {`
                    @media print {
                        body { background: #ffffff !important; color: #000000 !important; margin: 0 !important; padding: 0 !important; }
                        .no-print, header, nav, aside, .MuiDrawer-root, .sidebar, .navbar, .page-header-banner, .filter-bar, .action-buttons, .MuiSnackbar-root { display: none !important; }
                        .print-area { box-shadow: none !important; border: 1px solid #cbd5e1 !important; margin: 0 !important; padding: 16px !important; width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
                        @page { size: A4 portrait; margin: 8mm; }
                    }
                `}
            </style>

            {/* Header Banner */}
            <Box
                className="page-header-banner no-print"
                sx={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: '16px',
                    p: 3,
                    mb: 2.5,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <Tooltip title="Back to Finance Dashboard">
                        <IconButton
                            onClick={() => navigate('/org/finance')}
                            sx={{ color: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' } }}
                        >
                            <BackIcon />
                        </IconButton>
                    </Tooltip>
                    <Box sx={{ p: 1.2, borderRadius: '12px', bgcolor: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center' }}>
                        <TrialBalanceIcon sx={{ fontSize: 32, color: '#60a5fa' }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Trial Balance (तलपट)
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.3 }}>
                            Debit = Credit Ledger Reconciliation Statement
                        </Typography>
                    </Box>
                </Stack>

                <Chip
                    icon={isBalanced ? <CheckCircleIcon sx={{ '&&': { color: '#10b981' } }} /> : <WarningIcon sx={{ '&&': { color: '#f59e0b' } }} />}
                    label={isBalanced ? 'Trial Balanced (Dr = Cr)' : `Dr - Cr Diff: ${fmt(difference)}`}
                    sx={{
                        bgcolor: isBalanced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isBalanced ? '#34d399' : '#fbbf24',
                        fontWeight: 600,
                        border: `1px solid ${isBalanced ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    }}
                />
            </Box>

            {/* Dedicated Filter & Export Bar */}
            <GlassCard className="filter-bar no-print" sx={{ mb: 3 }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Stack
                        direction={{ xs: 'column', lg: 'row' }}
                        spacing={2.5}
                        alignItems={{ xs: 'stretch', lg: 'center' }}
                        justifyContent="space-between"
                    >
                        {/* Presets */}
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mr: 0.5 }}>
                                Presets:
                            </Typography>
                            <Chip
                                label="Today"
                                size="small"
                                onClick={() => handlePresetDate('today')}
                                variant={asOfDate === getTodayDate() ? 'filled' : 'outlined'}
                                color={asOfDate === getTodayDate() ? 'primary' : 'default'}
                                sx={{ fontWeight: 600, cursor: 'pointer' }}
                            />
                            <Chip
                                label="End of Last Month"
                                size="small"
                                onClick={() => handlePresetDate('last_month')}
                                variant="outlined"
                                sx={{ fontWeight: 500, cursor: 'pointer' }}
                            />
                            <Chip
                                label="FY End (31 Mar)"
                                size="small"
                                onClick={() => handlePresetDate('fy_end')}
                                variant="outlined"
                                sx={{ fontWeight: 500, cursor: 'pointer' }}
                            />
                            <Chip
                                label="Half Year (30 Sep)"
                                size="small"
                                onClick={() => handlePresetDate('half_year')}
                                variant="outlined"
                                sx={{ fontWeight: 500, cursor: 'pointer' }}
                            />
                        </Stack>

                        {/* Date Field + Apply + 3 Export Buttons */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" flexWrap="wrap">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                                    As on Date:
                                </Typography>
                                <TextField
                                    type="date"
                                    size="small"
                                    value={asOfDate}
                                    onChange={(e) => setAsOfDate(e.target.value)}
                                    sx={{
                                        minWidth: 160,
                                        bgcolor: '#ffffff',
                                        borderRadius: '8px',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '8px',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            color: '#0f172a',
                                            '& fieldset': { borderColor: '#cbd5e1' },
                                            '&:hover fieldset': { borderColor: '#3b82f6' },
                                            '&.Mui-focused fieldset': { borderColor: '#2563eb' },
                                        },
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => fetchTrialBalance(asOfDate)}
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                                    sx={{
                                        bgcolor: '#2563eb',
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        px: 2,
                                        py: 0.9,
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        boxShadow: 'none',
                                        '&:hover': { bgcolor: '#1d4ed8' },
                                    }}
                                >
                                    Apply
                                </Button>
                            </Box>

                            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, mx: 0.5 }} />

                            <Stack direction="row" spacing={1} className="action-buttons">
                                <Tooltip title="Print Statement (Ctrl + P)">
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={handlePrint}
                                        startIcon={<PrintIcon />}
                                        sx={{
                                            borderColor: '#cbd5e1',
                                            color: '#1e293b',
                                            fontWeight: 600,
                                            borderRadius: '8px',
                                            textTransform: 'none',
                                            px: 1.8,
                                            py: 0.8,
                                            bgcolor: '#f8fafc',
                                            '&:hover': { borderColor: '#94a3b8', bgcolor: '#f1f5f9' },
                                        }}
                                    >
                                        Print
                                    </Button>
                                </Tooltip>

                                <Tooltip title="Download PDF File">
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={handleDownloadPDF}
                                        disabled={pdfLoading}
                                        startIcon={pdfLoading ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />}
                                        sx={{
                                            borderColor: '#fca5a5',
                                            color: '#dc2626',
                                            fontWeight: 600,
                                            borderRadius: '8px',
                                            textTransform: 'none',
                                            px: 1.8,
                                            py: 0.8,
                                            bgcolor: '#fef2f2',
                                            '&:hover': { borderColor: '#f87171', bgcolor: '#fee2e2' },
                                        }}
                                    >
                                        PDF
                                    </Button>
                                </Tooltip>

                                <Tooltip title="Download Excel (.xlsx) Spreadsheet">
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={handleExportExcel}
                                        disabled={excelLoading}
                                        startIcon={excelLoading ? <CircularProgress size={16} color="inherit" /> : <ExcelIcon />}
                                        sx={{
                                            borderColor: '#86efac',
                                            color: '#15803d',
                                            fontWeight: 600,
                                            borderRadius: '8px',
                                            textTransform: 'none',
                                            px: 1.8,
                                            py: 0.8,
                                            bgcolor: '#f0fdf4',
                                            '&:hover': { borderColor: '#4ade80', bgcolor: '#dcfce7' },
                                        }}
                                    >
                                        Excel
                                    </Button>
                                </Tooltip>
                            </Stack>
                        </Stack>
                    </Stack>
                </CardContent>
            </GlassCard>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                    <CircularProgress size={48} sx={{ color: '#2563eb', mb: 2 }} />
                    <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Reconciling Trial Balance ledgers...
                    </Typography>
                </Box>
            ) : (
                <Paper
                    id="trial-balance-printable"
                    className="print-area"
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 4 },
                        borderRadius: '16px',
                        border: '1px solid #cbd5e1',
                        bgcolor: '#ffffff',
                    }}
                >
                    <Box sx={{ textAlign: 'center', pb: 2.5, borderBottom: '2px solid #e2e8f0', mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                            {reportData.company_name || 'KRUDRACX (APNA KHARCHA SERVICES)'}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2563eb', letterSpacing: '0.05em', mt: 0.3 }}>
                            TRIAL BALANCE (तलपट)
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.4 }}>
                            Ledger Balance Summary As on {asOfDate} — (Amounts in INR ₹)
                        </Typography>
                    </Box>

                    <TableContainer sx={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#2563eb' }}>
                                    <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.2, fontSize: '0.9rem' }}>
                                        Ledger Account Head
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 700, py: 1.2, fontSize: '0.9rem', width: 200 }}>
                                        Debit (Dr ₹)
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 700, py: 1.2, fontSize: '0.9rem', width: 200 }}>
                                        Credit (Cr ₹)
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {records.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 4, color: '#64748b' }}>
                                            No ledger transactions found up to {asOfDate}.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    records.map((row, index) => {
                                        const head = getLedgerName(row);
                                        const dr = Number(row.debit || 0);
                                        const cr = Number(row.credit || 0);

                                        return (
                                            <TableRow
                                                key={index}
                                                sx={{
                                                    bgcolor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                                                    '&:hover': { bgcolor: '#f1f5f9' },
                                                }}
                                            >
                                                <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 1 }}>
                                                    {head}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        color: dr > 0 ? '#dc2626' : '#94a3b8',
                                                        fontWeight: dr > 0 ? 600 : 400,
                                                        py: 1,
                                                    }}
                                                >
                                                    {dr > 0 ? fmt(dr) : '—'}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        color: cr > 0 ? '#059669' : '#94a3b8',
                                                        fontWeight: cr > 0 ? 600 : 400,
                                                        py: 1,
                                                    }}
                                                >
                                                    {cr > 0 ? fmt(cr) : '—'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}

                                <TableRow
                                    sx={{
                                        bgcolor: '#e2e8f0',
                                        borderTop: '2px solid #94a3b8',
                                        borderBottom: '2px double #0f172a',
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 800, color: '#0f172a', py: 1.4, fontSize: '0.95rem' }}>
                                        TOTALS
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontWeight: 800,
                                            color: '#dc2626',
                                            py: 1.4,
                                            fontSize: '0.95rem',
                                        }}
                                    >
                                        {fmt(totalDebit)}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontWeight: 800,
                                            color: '#059669',
                                            py: 1.4,
                                            fontSize: '0.95rem',
                                        }}
                                    >
                                        {fmt(totalCredit)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ mt: 6, pt: 3, borderTop: '1px dashed #cbd5e1' }}>
                        <Grid container spacing={2} justifyContent="space-between" sx={{ textAlign: 'center' }}>
                            <Grid item xs={4}>
                                <Box sx={{ borderBottom: '1px dotted #94a3b8', width: '80%', mx: 'auto', mb: 1, height: 35 }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>Prepared By</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Box sx={{ borderBottom: '1px dotted #94a3b8', width: '80%', mx: 'auto', mb: 1, height: 35 }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>Verified By Auditor</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Box sx={{ borderBottom: '1px dotted #94a3b8', width: '80%', mx: 'auto', mb: 1, height: 35 }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>Authorized Signatory</Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '10px' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}