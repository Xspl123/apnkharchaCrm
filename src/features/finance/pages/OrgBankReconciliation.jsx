import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
    getOrgAccounts,
    getOrgTransactions,
} from '../state/orgFinanceSlice';
import {
    Box, Container, Grid, Card, CardContent, Typography, Paper, Stack,
    Button, IconButton, Chip, TextField, MenuItem, Select,
    FormControl, InputLabel, InputAdornment, Table, TableHead,
    TableRow, TableCell, TableBody, TableContainer, Snackbar, Alert,
    Checkbox,
} from '@mui/material';
import {
    Print as PrintIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    ArrowBack as BackIcon,
    Search as SearchIcon,
    DoneAll as DoneAllIcon,
    RemoveDone as RemoveDoneIcon,
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';

const GlassCard = styled(Card)(({ theme }) => ({
    background: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.06)',
    border: `1px solid ${theme.palette.divider}`,
}));

const MetricBox = styled(Box)(({ theme, bgcolor, bordercolor }) => ({
    padding: '16px 20px',
    borderRadius: '14px',
    backgroundColor: bgcolor || (theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc'),
    border: `1px solid ${bordercolor || theme.palette.divider}`,
}));

export default function OrgBankReconciliation() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    const { accounts = [], transactions = [] } = useSelector((s) => s.orgFinance || {});

    const bankAccounts = useMemo(() => {
        return (accounts || []).filter((acc) => acc.type === 'bank' || acc.bank_name);
    }, [accounts]);

    const defaultAccountId = location.state?.selectedAccountId || bankAccounts[0]?.id || accounts[0]?.id || '';

    const [selectedAccountId, setSelectedAccountId] = useState(defaultAccountId);
    const [statementDate, setStatementDate] = useState(new Date().toISOString().slice(0, 10));
    const [statementBalanceInput, setStatementBalanceInput] = useState('');
    const [clearedMap, setClearedMap] = useState({});
    const [clearanceDates, setClearanceDates] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    useEffect(() => {
        dispatch(getOrgAccounts());
        dispatch(getOrgTransactions({ per_page: 500 }));
    }, [dispatch]);

    useEffect(() => {
        if (!selectedAccountId && accounts.length > 0) {
            const firstBank = bankAccounts[0] || accounts[0];
            setSelectedAccountId(firstBank.id);
        }
    }, [accounts, bankAccounts, selectedAccountId]);

    const selectedAccount = useMemo(() => {
        return (accounts || []).find((acc) => String(acc.id) === String(selectedAccountId));
    }, [accounts, selectedAccountId]);

    const accountTransactions = useMemo(() => {
        if (!selectedAccountId) return [];
        return (transactions || []).filter((tx) => {
            const matchAccount = String(tx.account_id) === String(selectedAccountId) ||
                                 String(tx.transfer_account_id) === String(selectedAccountId);
            if (!matchAccount) return false;
            if (statementDate && tx.transaction_date && tx.transaction_date > statementDate) return false;
            return true;
        });
    }, [transactions, selectedAccountId, statementDate]);

    useEffect(() => {
        if (accountTransactions.length > 0) {
            setClearedMap((prev) => {
                const updated = { ...prev };
                accountTransactions.forEach((tx) => {
                    if (updated[tx.id] === undefined) updated[tx.id] = true;
                });
                return updated;
            });

            setClearanceDates((prev) => {
                const updated = { ...prev };
                accountTransactions.forEach((tx) => {
                    if (!updated[tx.id]) updated[tx.id] = tx.transaction_date || statementDate;
                });
                return updated;
            });
        }
    }, [accountTransactions, statementDate]);

    const bookBalance = useMemo(() => {
        return Number(selectedAccount?.current_balance ?? selectedAccount?.balance ?? 0);
    }, [selectedAccount]);

    useEffect(() => {
        if (selectedAccount) {
            const bal = Number(selectedAccount.current_balance ?? selectedAccount.balance ?? 0);
            setStatementBalanceInput(String(bal));
        }
    }, [selectedAccountId, selectedAccount]);

    const { unclearedDebits, unclearedCredits } = useMemo(() => {
        let debits = 0;
        let credits = 0;
        accountTransactions.forEach((tx) => {
            const isCleared = clearedMap[tx.id] !== false;
            if (!isCleared) {
                const amt = Number(tx.amount || 0);
                if (tx.type === 'debit' || tx.type === 'expense') debits += amt;
                else if (tx.type === 'credit' || tx.type === 'income') credits += amt;
            }
        });
        return { unclearedDebits: debits, unclearedCredits: credits };
    }, [accountTransactions, clearedMap]);

    const calculatedStatementBalance = bookBalance + unclearedDebits - unclearedCredits;
    const actualStatementBalance = parseFloat(statementBalanceInput) || 0;
    const difference = Math.abs(calculatedStatementBalance - actualStatementBalance);
    const isReconciled = difference < 0.01;

    const handleToggleClearance = (txId) => {
        setClearedMap((prev) => ({ ...prev, [txId]: !prev[txId] }));
    };

    const handleMarkAll = (status) => {
        const next = {};
        accountTransactions.forEach((tx) => { next[tx.id] = status; });
        setClearedMap(next);
        setSnackbar({
            open: true,
            message: status ? 'All transactions marked as Cleared in Bank!' : 'All transactions marked as Uncleared!',
            severity: 'info',
        });
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', minimumFractionDigits: 2,
        }).format(val || 0);
    };

    // Dedicated Clean A4 HTML Generator (Zero Sidebar, Full Width Letterhead)
    const generateBRSHTML = () => {
        const accName = selectedAccount?.name || 'Bank Account';
        const bankName = selectedAccount?.bank_name || 'Bank';
        const accNo = selectedAccount?.account_number || 'N/A';
        const ifsc = selectedAccount?.ifsc_code || 'N/A';

        const statusHtml = isReconciled
            ? '<span style="color:#16a34a;font-weight:800;background:#dcfce7;padding:4px 10px;border-radius:6px;border:1px solid #86efac;">RECONCILED & BALANCED &#10004;</span>'
            : `<span style="color:#dc2626;font-weight:800;background:#fee2e2;padding:4px 10px;border-radius:6px;border:1px solid #fca5a5;">DISCREPANCY: ${formatCurrency(difference)} &#9888;</span>`;

        let rowsHtml = '';
        accountTransactions.forEach((tx, idx) => {
            const isCleared = clearedMap[tx.id] !== false;
            const isDebit = tx.type === 'debit' || tx.type === 'expense';
            const isCredit = tx.type === 'credit' || tx.type === 'income';
            const vDate = clearanceDates[tx.id] || tx.transaction_date || statementDate;

            rowsHtml += `
            <tr style="background:${isCleared ? (idx % 2 === 0 ? '#ffffff' : '#f8fafc') : '#fffbeb'};">
                <td style="text-align:center;font-weight:700;color:${isCleared ? '#16a34a' : '#b45309'};">${isCleared ? 'CLEARED &#10004;' : 'UNPRESENTED &#9203;'}</td>
                <td>${tx.transaction_date || 'N/A'}</td>
                <td style="font-weight:700;">${tx.reference_no || 'TX-' + tx.id}</td>
                <td>${tx.category || 'General'}</td>
                <td style="color:#475569;">${tx.description || '—'}</td>
                <td style="text-align:right;color:#dc2626;font-weight:${isDebit ? 700 : 400};">${isDebit ? formatCurrency(tx.amount) : '—'}</td>
                <td style="text-align:right;color:#16a34a;font-weight:${isCredit ? 700 : 400};">${isCredit ? formatCurrency(tx.amount) : '—'}</td>
                <td style="text-align:center;">${vDate}</td>
            </tr>`;
        });

        return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>BRS - ${accName}</title>
<style>
  @page { size: A4 portrait; margin: 12mm 15mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 15px; }
  .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 15px; }
  .org-title { font-size: 20px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 0; }
  .report-title { font-size: 13px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-top: 4px; }
  .meta-grid { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #cbd5e1; background: #f8fafc; }
  .meta-grid td { padding: 6px 12px; font-size: 11px; border: 1px solid #e2e8f0; }
  .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; border: 1px solid #cbd5e1; }
  .summary-table th { background: #1e3a8a; color: #ffffff; padding: 8px 12px; font-size: 11px; text-align: left; }
  .summary-table td { padding: 7px 12px; border: 1px solid #e2e8f0; font-size: 11px; }
  .amount { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .tx-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #cbd5e1; }
  .tx-table th { background: #2563eb; color: #ffffff; padding: 7px 8px; font-size: 10px; text-align: left; border: 1px solid #3b82f6; }
  .tx-table td { padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 10px; }
  .footer-sig { margin-top: 35px; width: 100%; display: flex; justify-content: space-between; page-break-inside: avoid; }
  .sig-col { text-align: center; width: 220px; }
  .sig-line { border-top: 1px solid #0f172a; margin-top: 40px; padding-top: 5px; font-weight: 700; font-size: 11px; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="org-title">APNAKHARCHA SERVICES</div>
    <div class="report-title">BRS</div>
  </div>

  <table class="meta-grid">
    <tr>
      <td><strong>Bank Account:</strong> ${accName} (${bankName})</td>
      <td><strong>Cutoff / Statement Date:</strong> ${statementDate}</td>
    </tr>
    <tr>
      <td><strong>Account No:</strong> ${accNo} | <strong>IFSC:</strong> ${ifsc}</td>
      <td><strong>Audit Status:</strong> ${statusHtml}</td>
    </tr>
  </table>

  <table class="summary-table">
    <thead>
      <tr>
        <th>BRS Particulars</th>
        <th class="amount" style="width: 150px;">Amount (INR)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Balance as per Cash Book / Company Books</strong></td>
        <td class="amount"><strong>${formatCurrency(bookBalance)}</strong></td>
      </tr>
      <tr>
        <td>2. (+) Add: Cheques / Payments Issued but not Cleared by Bank (Unpresented)</td>
        <td class="amount">${formatCurrency(unclearedDebits)}</td>
      </tr>
      <tr>
        <td>3. (-) Less: Deposits / Receipts In-Transit (Not Credited by Bank)</td>
        <td class="amount">${formatCurrency(unclearedCredits)}</td>
      </tr>
      <tr style="background:#f1f5f9;">
        <td><strong>4. Reconciled Calculated Bank Statement Balance</strong></td>
        <td class="amount"><strong>${formatCurrency(calculatedStatementBalance)}</strong></td>
      </tr>
      <tr>
        <td>5. Balance as per Actual Bank Passbook / Statement</td>
        <td class="amount">${formatCurrency(actualStatementBalance)}</td>
      </tr>
      <tr style="background:${isReconciled ? '#f0fdf4' : '#fef2f2'};">
        <td><strong>6. Net Difference / Discrepancy</strong></td>
        <td class="amount" style="color:${isReconciled ? '#16a34a' : '#dc2626'};font-size:12px;"><strong>${isReconciled ? '₹0.00 (MATCHED &#10004;)' : formatCurrency(difference) + ' &#9888;'}</strong></td>
      </tr>
    </tbody>
  </table>

  <div style="font-weight: 800; font-size: 12px; margin-bottom: 6px; color: #1e3a8a;">Itemized Transactions Clearance Details:</div>
  <table class="tx-table">
    <thead>
      <tr>
        <th style="width: 75px; text-align: center;">Status</th>
        <th style="width: 70px;">Date</th>
        <th style="width: 120px;">Voucher / Ref</th>
        <th style="width: 90px;">Category</th>
        <th>Description</th>
        <th class="amount" style="width: 95px;">Debit (- Out)</th>
        <th class="amount" style="width: 95px;">Credit (+ In)</th>
        <th style="width: 80px; text-align: center;">Value Date</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer-sig">
    <div class="sig-col">
      <div class="sig-line">Prepared By (Accounts Executive)</div>
    </div>
    <div class="sig-col">
      <div class="sig-line">Audited By (Chartered Accountant / CFO)</div>
    </div>
  </div>
</body>
</html>`;
    };

    // 1. Separate Print: Clean popup window without sidebar/navbar
    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=1100,height=800,scrollbars=yes');
        if (!printWindow) {
            setSnackbar({ open: true, message: 'Pop-up blocked! Please allow popups.', severity: 'error' });
            return;
        }
        printWindow.document.write(generateBRSHTML());
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    };

    // 2. Separate Download PDF: Direct .pdf file export
    const handleDownloadPDF = async () => {
        try {
            setIsExportingPdf(true);
            let html2pdfLib;
            try {
                const mod = await import('html2pdf.js');
                html2pdfLib = mod.default || mod;
            } catch {
                handlePrint();
                return;
            }

            const element = document.createElement('div');
            element.innerHTML = generateBRSHTML();
            document.body.appendChild(element);

            const accName = (selectedAccount?.name || 'Bank').replace(/[^a-zA-Z0-9]/g, '_');
            const opt = {
                margin: [0.3, 0.4, 0.3, 0.4],
                filename: `BRS_${accName}_${statementDate}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
            };

            await html2pdfLib().from(element).set(opt).save();
            document.body.removeChild(element);

            setSnackbar({ open: true, message: 'PDF BRS Statement downloaded successfully! 📄', severity: 'success' });
        } catch (err) {
            console.error('PDF Export Error:', err);
            handlePrint();
        } finally {
            setIsExportingPdf(false);
        }
    };

    // 3. Separate Export Excel (.xlsx)
    const handleExportExcel = async () => {
        try {
            setIsExportingExcel(true);
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'ApnaKharcha ERP';
            workbook.created = new Date();

            const sheet = workbook.addWorksheet('Bank Reconciliation');
            sheet.columns = [
                { width: 14 }, { width: 14 }, { width: 28 }, { width: 22 },
                { width: 38 }, { width: 18 }, { width: 18 }, { width: 18 },
            ];

            sheet.mergeCells('A1:H1');
            const titleCell = sheet.getCell('A1');
            titleCell.value = 'APNAKHARCHA — BRS';
            titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
            sheet.getRow(1).height = 30;

            sheet.addRow(['Bank Account:', selectedAccount?.name || 'Bank Account', '', '', 'Statement Date:', statementDate]);
            sheet.addRow(['Bank Name:', selectedAccount?.bank_name || 'N/A', '', '', 'Audit Status:', isReconciled ? 'RECONCILED & BALANCED' : 'UNRECONCILED DIFFERENCE']);
            sheet.addRow(['Account Number:', selectedAccount?.account_number || 'N/A', '', '', 'Generated On:', new Date().toLocaleDateString('en-IN')]);
            sheet.addRow([]);

            sheet.addRow(['BRS AUDIT SUMMARY', '', '', '', 'AMOUNT (INR)']);
            const summHeaderRow = sheet.lastRow;
            summHeaderRow.font = { bold: true };
            summHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

            sheet.addRow(['1. Balance as per Cash Book / Company Books', '', '', '', bookBalance]);
            sheet.addRow(['2. (+) Uncleared Cheques Issued (Not presented to bank)', '', '', '', unclearedDebits]);
            sheet.addRow(['3. (-) Uncleared Deposits In-Transit (Not credited by bank)', '', '', '', unclearedCredits]);
            sheet.addRow(['4. Calculated Balance as per Bank Statement', '', '', '', calculatedStatementBalance]);
            sheet.addRow(['5. Balance as per Actual Bank Passbook / Statement', '', '', '', actualStatementBalance]);
            sheet.addRow(['6. Net Difference / Discrepancy', '', '', '', difference]);
            sheet.addRow([]);

            for (let r = 7; r <= 12; r++) {
                const cell = sheet.getCell(`E${r}`);
                cell.numFmt = '₹#,##0.00';
                cell.font = { bold: r === 7 || r === 12 };
            }

            sheet.addRow(['Clearance', 'Date', 'Voucher / Ref', 'Category', 'Description', 'Debit (- Out)', 'Credit (+ In)', 'Bank Value Date']);
            const txHeaderRow = sheet.lastRow;
            txHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            txHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
            txHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
            sheet.getRow(txHeaderRow.number).height = 24;

            accountTransactions.forEach((tx) => {
                const isCleared = clearedMap[tx.id] !== false;
                const isDebit = tx.type === 'debit' || tx.type === 'expense';
                const isCredit = tx.type === 'credit' || tx.type === 'income';
                const amt = Number(tx.amount || 0);

                const row = sheet.addRow([
                    isCleared ? 'CLEARED' : 'UNPRESENTED',
                    tx.transaction_date || 'N/A',
                    tx.reference_no || `TX-${tx.id}`,
                    tx.category || 'General',
                    tx.description || '',
                    isDebit ? amt : null,
                    isCredit ? amt : null,
                    clearanceDates[tx.id] || tx.transaction_date || statementDate,
                ]);

                row.getCell(6).numFmt = '₹#,##0.00';
                row.getCell(7).numFmt = '₹#,##0.00';

                if (!isCleared) {
                    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
                }
            });

            sheet.addRow([]);
            sheet.addRow([]);
            sheet.addRow(['Prepared By: ___________________________', '', '', '', 'Audited & Verified By: ___________________________']);
            sheet.lastRow.font = { bold: true };

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const accName = (selectedAccount?.name || 'Bank').replace(/[^a-zA-Z0-9]/g, '_');
            saveAs(blob, `BRS_${accName}_${statementDate}.xlsx`);

            setSnackbar({
                open: true,
                message: 'Excel BRS Statement exported successfully! 📊',
                severity: 'success',
            });
        } catch (err) {
            console.error('Excel Export Error:', err);
            setSnackbar({ open: true, message: 'Failed to export Excel report', severity: 'error' });
        } finally {
            setIsExportingExcel(false);
        }
    };

    const filteredList = useMemo(() => {
        return accountTransactions.filter((tx) => {
            const isCleared = clearedMap[tx.id] !== false;
            if (filterStatus === 'cleared' && !isCleared) return false;
            if (filterStatus === 'uncleared' && isCleared) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const desc = (tx.description || '').toLowerCase();
                const ref = (tx.reference_no || '').toLowerCase();
                return desc.includes(q) || ref.includes(q);
            }
            return true;
        });
    }, [accountTransactions, clearedMap, filterStatus, searchQuery]);

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Hide sidebar/navbar in print & expand to full width A4 */}
            <style>{`
                @media print {
                    .MuiDrawer-root, .app-sidebar__drawer, .MuiAppBar-root, header, nav, .no-print, button, input {
                        display: none !important;
                    }
                    body, main, .MuiContainer-root {
                        margin: 0 !important;
                        padding: 10px !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        background: #fff !important;
                    }
                    .MuiPaper-root, .MuiCard-root {
                        box-shadow: none !important;
                        border: 1px solid #cbd5e1 !important;
                    }
                }
            `}</style>
            {/* Top Action Bar with 3 Distinct Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
                <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <IconButton onClick={() => navigate('/org/cashbook')} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                            <BackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                BRS)
                                {isReconciled ? (
                                    <Chip label="RECONCILED & BALANCED ✅" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 800 }} />
                                ) : (
                                    <Chip label={`DIFF: ${formatCurrency(difference)} ⚠️`} size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 800 }} />
                                )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Reconcile organisation bank book with official bank passbook / statement
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button variant="outlined" startIcon={<DoneAllIcon />} onClick={() => handleMarkAll(true)} sx={{ borderRadius: '10px', textTransform: 'none' }}>
                        Mark All Cleared
                    </Button>
                    <Button variant="outlined" startIcon={<RemoveDoneIcon />} onClick={() => handleMarkAll(false)} sx={{ borderRadius: '10px', textTransform: 'none' }}>
                        Uncheck All
                    </Button>
                    
                    {/* Button 1: Dedicated Clean Window Print */}
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={handlePrint}
                        sx={{ borderRadius: '10px', textTransform: 'none', bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, fontWeight: 700 }}
                    >
                        Print Statement
                    </Button>

                    {/* Button 2: Dedicated PDF Download */}
                    <Button
                        variant="contained"
                        startIcon={<PdfIcon />}
                        onClick={handleDownloadPDF}
                        disabled={isExportingPdf}
                        sx={{ borderRadius: '10px', textTransform: 'none', bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, fontWeight: 700 }}
                    >
                        {isExportingPdf ? 'Generating PDF...' : 'Download PDF'}
                    </Button>

                    {/* Button 3: Dedicated Excel Download */}
                    <Button
                        variant="contained"
                        startIcon={<ExcelIcon />}
                        onClick={handleExportExcel}
                        disabled={isExportingExcel}
                        sx={{ borderRadius: '10px', textTransform: 'none', bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontWeight: 700 }}
                    >
                        {isExportingExcel ? 'Exporting...' : 'Export Excel (.xlsx)'}
                    </Button>
                </Stack>
            </Stack>

            {/* Config & Account Selector Card */}
            <GlassCard sx={{ mb: 3, p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Bank Account</InputLabel>
                            <Select
                                value={selectedAccountId}
                                label="Select Bank Account"
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                sx={{ borderRadius: '10px' }}
                            >
                                {(accounts || []).map((acc) => (
                                    <MenuItem key={acc.id} value={acc.id}>
                                        <Stack direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
                                            <span>{acc.name} ({acc.bank_name || acc.type?.toUpperCase()})</span>
                                            <span style={{ fontWeight: 700, color: '#16a34a' }}>
                                                {formatCurrency(acc.current_balance ?? acc.balance ?? 0)}
                                            </span>
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth size="small" type="date"
                            label="Statement / Cutoff Date"
                            value={statementDate}
                            onChange={(e) => setStatementDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth size="small" type="number"
                            label="Bank Statement Closing Balance"
                            value={statementBalanceInput}
                            onChange={(e) => setStatementBalanceInput(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <Button
                            fullWidth variant="outlined"
                            onClick={() => { setStatementBalanceInput(String(bookBalance)); handleMarkAll(true); }}
                            sx={{ borderRadius: '10px', textTransform: 'none', height: 40 }}
                        >
                            Sync with Book
                        </Button>
                    </Grid>
                </Grid>
            </GlassCard>

            {/* BRS Audit Scoreboard */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricBox bordercolor="#93c5fd" bgcolor="#eff6ff">
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>1. Balance as per Cash Book</Typography>
                        <Typography variant="h5" fontWeight={800} sx={{ color: '#1d4ed8', mt: 0.5 }}>{formatCurrency(bookBalance)}</Typography>
                        <Typography variant="caption" color="text.secondary">{selectedAccount?.name || 'Selected Account'}</Typography>
                    </MetricBox>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricBox bordercolor="#fde047" bgcolor="#fefce8">
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>2. (+) Uncleared Cheques Issued</Typography>
                        <Typography variant="h5" fontWeight={800} sx={{ color: '#ca8a04', mt: 0.5 }}>{formatCurrency(unclearedDebits)}</Typography>
                        <Typography variant="caption" color="text.secondary">Issued but not debited by bank</Typography>
                    </MetricBox>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricBox bordercolor="#fca5a5" bgcolor="#fef2f2">
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>3. (-) Uncleared Deposits In-Transit</Typography>
                        <Typography variant="h5" fontWeight={800} sx={{ color: '#dc2626', mt: 0.5 }}>{formatCurrency(unclearedCredits)}</Typography>
                        <Typography variant="caption" color="text.secondary">Deposited but not credited by bank</Typography>
                    </MetricBox>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricBox bordercolor={isReconciled ? '#86efac' : '#f87171'} bgcolor={isReconciled ? '#f0fdf4' : '#fff1f2'}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>4. Net Difference (Discrepancy)</Typography>
                        <Typography variant="h5" fontWeight={900} sx={{ color: isReconciled ? '#16a34a' : '#b91c1c', mt: 0.5 }}>
                            {isReconciled ? '₹0.00 (MATCHED ✅)' : `${formatCurrency(difference)} ⚠️`}
                        </Typography>
                        <Typography variant="caption" color={isReconciled ? '#15803d' : '#991b1b'} fontWeight={600}>
                            {isReconciled ? 'Passbook exactly matches Books' : 'Requires adjustment'}
                        </Typography>
                    </MetricBox>
                </Grid>
            </Grid>

            {/* Transactions Clearance Table */}
            <GlassCard>
                <CardContent sx={{ pb: 1 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>Transactions for Clearance</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Check off entries that have appeared on your physical bank statement / passbook
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center">
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ borderRadius: '10px' }}>
                                    <MenuItem value="all">All Entries ({accountTransactions.length})</MenuItem>
                                    <MenuItem value="cleared">Cleared Only</MenuItem>
                                    <MenuItem value="uncleared">Uncleared Only</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                size="small" placeholder="Search note / ref..." value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        </Stack>
                    </Stack>

                    <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, width: 60 }} align="center">Cleared</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Voucher / Ref</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Category & Description</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="right">Debit (- Out)</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="right">Credit (+ In)</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Bank Value Date</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="center">Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                            No transactions found for the selected account.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredList.map((tx) => {
                                        const isCleared = clearedMap[tx.id] !== false;
                                        const isDebit = tx.type === 'debit' || tx.type === 'expense';
                                        const isCredit = tx.type === 'credit' || tx.type === 'income';

                                        return (
                                            <TableRow key={tx.id} hover sx={{ bgcolor: isCleared ? 'transparent' : '#fffbeb' }}>
                                                <TableCell align="center">
                                                    <Checkbox checked={isCleared} onChange={() => handleToggleClearance(tx.id)} color="success" />
                                                </TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{tx.transaction_date || 'N/A'}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    <Typography variant="body2" fontWeight={700}>{tx.reference_no || `TX-${tx.id}`}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>{tx.category || 'General'}</Typography>
                                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 280, display: 'block' }}>
                                                        {tx.description || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#dc2626', fontWeight: isDebit ? 800 : 400 }}>
                                                    {isDebit ? formatCurrency(tx.amount) : '—'}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#16a34a', fontWeight: isCredit ? 800 : 400 }}>
                                                    {isCredit ? formatCurrency(tx.amount) : '—'}
                                                </TableCell>
                                                <TableCell sx={{ width: 140 }}>
                                                    <TextField
                                                        size="small" type="date"
                                                        value={clearanceDates[tx.id] || tx.transaction_date || statementDate}
                                                        onChange={(e) => setClearanceDates((p) => ({ ...p, [tx.id]: e.target.value }))}
                                                        disabled={!isCleared}
                                                        InputLabelProps={{ shrink: true }}
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 11 } }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    {isCleared ? (
                                                        <Chip label="CLEARED ✅" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 800, fontSize: 10 }} />
                                                    ) : (
                                                        <Chip label="UNPRESENTED ⏳" size="small" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 800, fontSize: 10 }} />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </GlassCard>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))}>
                <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Container>
    );
}
