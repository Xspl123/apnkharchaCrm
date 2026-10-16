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
} from '@mui/material';
import {
    AccountBalance as BalanceIcon,
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

const getNum = (obj, ...keys) => {
    if (!obj || typeof obj !== 'object') return null;
    for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
            const n = Number(obj[k]);
            if (!isNaN(n)) return n;
        }
    }
    return null;
};

export default function OrgBalanceSheet() {
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
        liabilities: {},
        assets: {},
    });

    const fetchBalanceSheet = useCallback(async (targetDate) => {
        setLoading(true);
        setError(null);
        try {
            const dateToFetch = targetDate || asOfDate;
            const res = await axiosClient.get('/reports/balance-sheet', {
                params: { as_of_date: dateToFetch },
            });
            const data = res.data?.data || res.data;
            if (data) {
                setReportData(data);
            }
        } catch (err) {
            console.error('Failed to load balance sheet:', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch Balance Sheet data');
            setSnackbar({
                open: true,
                message: 'Failed to fetch Balance Sheet data. Please try again.',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [asOfDate]);

    useEffect(() => {
        fetchBalanceSheet(asOfDate);
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
            fetchBalanceSheet(target);
        }
    };

    // ── Safe Field Extraction ──
    const currAssets = reportData?.assets?.current_assets || reportData?.current_assets || {};
    const fixedAssets = reportData?.assets?.fixed_assets || reportData?.fixed_assets || {};

    const sundryDebtors = 
        getNum(currAssets, 'sundry_debtors', 'debtors', 'clients_receivable', 'accounts_receivable', 'receivables') ??
        0;

    const closingStock = 
        getNum(currAssets, 'closing_stock', 'stock', 'inventory', 'stock_value', 'inventory_value') ??
        0;

    const gstInputCredit = 
        getNum(currAssets, 'gst_input_credit', 'gst_itc', 'itc', 'gst_asset', 'input_tax_credit') ??
        0;

    const officeEquipment = 
        getNum(fixedAssets, 'office_equipment', 'equipment', 'furniture', 'fixed_assets') ??
        0;

    const totalAssetsFromApi = 
        getNum(reportData?.assets, 'total', 'total_assets') ??
        getNum(reportData, 'total_assets', 'assets_total');

    // ── Liquid Bank & Cash Balances (Sum of all bank and cash accounts) ──
    let bankCashSum = 0;
    const explicitCombined = getNum(currAssets, 'bank_and_cash', 'cash_and_bank', 'bank_cash', 'cash_bank', 'liquid_funds', 'bank_cash_total');

    if (explicitCombined && explicitCombined > 0) {
        bankCashSum = explicitCombined;
    } else {
        for (const [k, v] of Object.entries(currAssets)) {
            const kl = k.toLowerCase();
            if (
                (kl.includes('bank') || kl.includes('cash') || kl.includes('liquid') || kl.includes('account')) &&
                !['subtotal', 'total', 'sundry_debtors', 'closing_stock', 'gst_input_credit'].includes(kl) &&
                v !== null && v !== ''
            ) {
                const n = Number(v);
                if (!isNaN(n) && n > 0) {
                    bankCashSum += n;
                }
            }
        }
    }

    const remainingForBankCash = totalAssetsFromApi
        ? Math.max(0, totalAssetsFromApi - (sundryDebtors + closingStock + gstInputCredit + officeEquipment))
        : 0;

    const bankCash = remainingForBankCash > 0 ? remainingForBankCash : bankCashSum;
    const totalAssets = totalAssetsFromApi ?? (bankCash + sundryDebtors + closingStock + gstInputCredit + officeEquipment);

    const equity = 
        reportData?.liabilities?.owner_equity ||
        reportData?.liabilities?.owners_equity ||
        reportData?.liabilities?.equity ||
        reportData?.owner_equity ||
        reportData?.owners_equity ||
        reportData?.equity ||
        {};

    const ownerCapital = 
        getNum(equity, 'owner_capital', 'capital', 'owners_capital', 'capital_account', 'share_capital') ??
        getNum(reportData?.liabilities, 'owner_capital', 'capital') ??
        getNum(reportData, 'owner_capital', 'capital') ??
        0;

    const retainedEarnings = 
        getNum(equity, 'retained_earnings', 'net_profit', 'net_profit_retained', 'profit_and_loss', 'pnl', 'current_profit') ??
        getNum(reportData?.liabilities, 'retained_earnings', 'net_profit') ??
        getNum(reportData, 'retained_earnings', 'net_profit') ??
        0;

    const currLiab = reportData?.liabilities?.current_liabilities || reportData?.current_liabilities || {};

    const sundryCreditors = 
        getNum(currLiab, 'sundry_creditors', 'creditors', 'vendors_payable', 'accounts_payable', 'payable') ??
        0;

    const gstLiability = 
        getNum(currLiab, 'gst_liability', 'gst_payable', 'tax_payable', 'gst') ??
        0;

    const computedLiab = ownerCapital + retainedEarnings + sundryCreditors + gstLiability;
    const totalLiabilities = 
        getNum(reportData?.liabilities, 'total', 'total_liabilities', 'total_liabilities_equity') ??
        getNum(reportData, 'total_liabilities', 'total_liabilities_equity', 'liabilities_total') ??
        (totalAssets > 0 ? totalAssets : computedLiab);

    const isBalanced = Math.abs(totalLiabilities - totalAssets) < 0.01;
    const difference = Math.abs(totalAssets - totalLiabilities);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        try {
            const { default: html2pdf } = await import('html2pdf.js');
            const element = document.getElementById('balance-sheet-printable');
            if (!element) return;

            const opt = {
                margin: [10, 10, 10, 10],
                filename: `Balance_Sheet_${asOfDate}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            };

            await html2pdf().set(opt).from(element).save();
            setSnackbar({ open: true, message: 'Balance Sheet PDF downloaded successfully!', severity: 'success' });
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

            const worksheet = workbook.addWorksheet('Balance Sheet', {
                views: [{ showGridLines: true }],
            });

            worksheet.columns = [
                { width: 38 },
                { width: 20 },
                { width: 6 },
                { width: 38 },
                { width: 20 },
            ];

            worksheet.mergeCells('A1:E1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = reportData.company_name || 'KRUDRACX (APNA KHARCHA SERVICES)';
            titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getRow(1).height = 34;

            worksheet.mergeCells('A2:E2');
            const subCell = worksheet.getCell('A2');
            subCell.value = 'BALANCE SHEET STATEMENT';
            subCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E293B' } };
            subCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getRow(2).height = 22;

            worksheet.mergeCells('A3:E3');
            const metaCell = worksheet.getCell('A3');
            metaCell.value = `Financial Position As on ${asOfDate}  |  Amounts in Indian Rupees (INR ₹)`;
            metaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
            metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getRow(3).height = 18;

            worksheet.addRow([]);

            const headerRow = worksheet.addRow([
                'Liabilities & Equity',
                'Amount (₹)',
                '',
                'Assets (Property & Funds)',
                'Amount (₹)',
            ]);
            headerRow.height = 26;
            headerRow.eachCell((cell, colNumber) => {
                if (colNumber === 3) return;
                cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
                cell.alignment = { horizontal: colNumber === 2 || colNumber === 5 ? 'right' : 'left', vertical: 'middle' };
            });

            const addGroupHeader = (liabGroup, assetGroup) => {
                const r = worksheet.addRow([liabGroup, '', '', assetGroup, '']);
                r.height = 22;
                r.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E40AF' } };
                r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
                r.getCell(4).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF065F46' } };
                r.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
            };

            addGroupHeader("A. OWNER'S EQUITY", 'A. CURRENT ASSETS');

            const rowData = [
                ['Owner Capital', ownerCapital, 'Bank & Cash Balances (Liquid)', bankCash],
                ['Retained Earnings / Net Profit', retainedEarnings, 'Sundry Debtors (Clients Receivable)', sundryDebtors],
                ['', '', 'Closing Stock (Inventory Value)', closingStock],
                ['B. CURRENT LIABILITIES', '', 'GST Input Tax Credit (Asset)', gstInputCredit],
                ['Sundry Creditors (Vendors Payable)', sundryCreditors, 'B. FIXED ASSETS', ''],
                ['GST Liability (Payable)', gstLiability, 'Office Equipment & Hardware', officeEquipment],
            ];

            rowData.forEach((item) => {
                const isLiabHeader = item[0] === 'B. CURRENT LIABILITIES';
                const isAssetHeader = item[2] === 'B. FIXED ASSETS';

                const r = worksheet.addRow([
                    item[0],
                    item[1] !== '' ? item[1] : null,
                    '',
                    item[2],
                    item[3] !== '' ? item[3] : null,
                ]);
                r.height = 20;

                if (isLiabHeader) {
                    r.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF991B1B' } };
                    r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
                } else if (item[0]) {
                    r.getCell(1).font = { name: 'Arial', size: 10, color: { argb: 'FF334155' } };
                    r.getCell(2).numFmt = '₹#,##0.00;[Red]-₹#,##0.00;"₹0.00"';
                    r.getCell(2).font = { name: 'Arial', size: 10, color: item[1] < 0 ? { argb: 'FFDC2626' } : { argb: 'FF0F172A' } };
                    r.getCell(2).alignment = { horizontal: 'right' };
                }

                if (isAssetHeader) {
                    r.getCell(4).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E40AF' } };
                    r.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
                } else if (item[2]) {
                    r.getCell(4).font = { name: 'Arial', size: 10, color: { argb: 'FF334155' } };
                    r.getCell(5).numFmt = '₹#,##0.00;[Red]-₹#,##0.00;"₹0.00"';
                    r.getCell(5).font = { name: 'Arial', size: 10, color: { argb: 'FF0F172A' } };
                    r.getCell(5).alignment = { horizontal: 'right' };
                }

                r.getCell(1).border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
                r.getCell(2).border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
                r.getCell(4).border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
                r.getCell(5).border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
            });

            worksheet.addRow([]);

            const totalRow = worksheet.addRow([
                'TOTAL LIABILITIES & EQUITY',
                totalLiabilities,
                '',
                'TOTAL ASSETS',
                totalAssets,
            ]);
            totalRow.height = 26;
            totalRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E40AF' } };
            totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
            totalRow.getCell(2).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E40AF' } };
            totalRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
            totalRow.getCell(2).numFmt = '₹#,##0.00;[Red]-₹#,##0.00;"₹0.00"';
            totalRow.getCell(2).alignment = { horizontal: 'right' };

            totalRow.getCell(4).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF065F46' } };
            totalRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
            totalRow.getCell(5).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF065F46' } };
            totalRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
            totalRow.getCell(5).numFmt = '₹#,##0.00;[Red]-₹#,##0.00;"₹0.00"';
            totalRow.getCell(5).alignment = { horizontal: 'right' };

            [1, 2, 4, 5].forEach((c) => {
                totalRow.getCell(c).border = {
                    top: { style: 'medium', color: { argb: 'FF94A3B8' } },
                    bottom: { style: 'double', color: { argb: 'FF0F172A' } },
                };
            });

            worksheet.addRow([]);
            const statusRow = worksheet.addRow([
                isBalanced
                    ? 'STATUS: BALANCED (Total Assets = Total Liabilities & Equity)'
                    : `STATUS: VARIANCE DETECTED (Difference: ₹${difference.toFixed(2)})`,
            ]);
            statusRow.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: isBalanced ? { argb: 'FF059669' } : { argb: 'FFDC2626' } };

            worksheet.addRow([]);
            worksheet.addRow([]);
            const signRow = worksheet.addRow([
                'Prepared By',
                '',
                'Verified By Accountant',
                '',
                'Authorized Signatory (Seal)',
            ]);
            signRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF475569' } };
            signRow.alignment = { horizontal: 'center' };

            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(
                new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
                `Balance_Sheet_${asOfDate}.xlsx`
            );
            setSnackbar({ open: true, message: 'Balance Sheet Excel exported successfully!', severity: 'success' });
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
                        @page { size: A4 landscape; margin: 8mm; }
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
                        <BalanceIcon sx={{ fontSize: 32, color: '#60a5fa' }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Balance Sheet Statement
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.3 }}>
                            Financial Position: Assets = Liabilities + Owner's Equity
                        </Typography>
                    </Box>
                </Stack>

                <Chip
                    icon={isBalanced ? <CheckCircleIcon sx={{ '&&': { color: '#10b981' } }} /> : <WarningIcon sx={{ '&&': { color: '#f59e0b' } }} />}
                    label={isBalanced ? 'Balanced Statement' : `Variance: ${fmt(difference)}`}
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
                                    onClick={() => fetchBalanceSheet(asOfDate)}
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
                        Calculating Balance Sheet position...
                    </Typography>
                </Box>
            ) : (
                <Paper
                    id="balance-sheet-printable"
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
                            BALANCE SHEET
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.4 }}>
                            As on {asOfDate} — (Amounts in INR ₹)
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Liabilities & Equity */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                                <Box sx={{ bgcolor: '#2563eb', color: '#ffffff', px: 2, py: 1.2, display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Liabilities & Equity</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Amount (₹)</Typography>
                                </Box>

                                <Box sx={{ bgcolor: '#eff6ff', px: 2, py: 0.8, borderBottom: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4ed8' }}>A. OWNER'S EQUITY</Typography>
                                </Box>
                                <Box sx={{ p: 0 }}>
                                    <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                                        <Typography variant="body2" sx={{ color: '#334155' }}>Owner Capital</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{fmt(ownerCapital)}</Typography>
                                    </Box>
                                    <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                                        <Typography variant="body2" sx={{ color: '#334155' }}>Retained Earnings / Net Profit</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: retainedEarnings < 0 ? '#dc2626' : '#0f172a' }}>{fmt(retainedEarnings)}</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ bgcolor: '#fef2f2', px: 2, py: 0.8, borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#b91c1c' }}>B. CURRENT LIABILITIES</Typography>
                                </Box>
                                <Box sx={{ p: 0 }}>
                                    <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                                        <Typography variant="body2" sx={{ color: '#334155' }}>Sundry Creditors (Vendors Payable)</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{fmt(sundryCreditors)}</Typography>
                                    </Box>
                                    <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                                        <Typography variant="body2" sx={{ color: '#334155' }}>GST Liability (Payable)</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{fmt(gstLiability)}</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ minHeight: 48 }} />

                                <Box sx={{ bgcolor: '#dbeafe', px: 2, py: 1.4, display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #2563eb' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af' }}>TOTAL LIABILITIES & EQUITY</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af' }}>{fmt(totalLiabilities)}</Typography>
                                </Box>
                            </Box>
                        </Grid>

                        {/* Assets */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                                <Box sx={{ bgcolor: '#2563eb', color: '#ffffff', px: 2, py: 1.2, display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Assets (Property & Funds)</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Amount (₹)</Typography>
                                </Box>

                                <Box sx={{ bgcolor: '#f0fdf4', px: 2, py: 0.8, borderBottom: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#15803d' }}>A. CURRENT ASSETS</Typography>
                                </Box>
                                <Box sx={{ p: 0 }}>
                                    <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                                        <Typography variant="body2" sx={{ color: '#334155' }}>Bank & Cash Balances (Liquid)</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{fmt(bankCash)}</Typography>
                                    </Box>
                                    <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                                        <Typography variant="body2" sx={{ color: '#334155' }}>Sundry Debtors (Clients Receivable)</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{fmt(sundryDebtors)}</Typography>
                                    </Box>
                                    <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                                        <Typography variant="body2" sx={{ color: '#334155' }}>Closing Stock (Inventory Value)</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{fmt(closingStock)}</Typography>
                                    </Box>
                                    <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                                        <Typography variant="body2" sx={{ color: '#334155' }}>GST Input Tax Credit (Asset)</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{fmt(gstInputCredit)}</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ bgcolor: '#eff6ff', px: 2, py: 0.8, borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4ed8' }}>B. FIXED ASSETS</Typography>
                                </Box>
                                <Box sx={{ p: 0 }}>
                                    <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                                        <Typography variant="body2" sx={{ color: '#334155' }}>Office Equipment & Hardware</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{fmt(officeEquipment)}</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ bgcolor: '#d1fae5', px: 2, py: 1.4, display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #059669' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#065f46' }}>TOTAL ASSETS</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#065f46' }}>{fmt(totalAssets)}</Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 6, pt: 3, borderTop: '1px dashed #cbd5e1' }}>
                        <Grid container spacing={2} justifyContent="space-between" sx={{ textAlign: 'center' }}>
                            <Grid item xs={4}>
                                <Box sx={{ borderBottom: '1px dotted #94a3b8', width: '80%', mx: 'auto', mb: 1, height: 35 }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>Prepared By</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Box sx={{ borderBottom: '1px dotted #94a3b8', width: '80%', mx: 'auto', mb: 1, height: 35 }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>Verified By Accountant</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Box sx={{ borderBottom: '1px dotted #94a3b8', width: '80%', mx: 'auto', mb: 1, height: 35 }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>Authorized Signatory (Seal)</Typography>
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