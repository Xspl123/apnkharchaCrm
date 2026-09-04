// src/components/ClientLedger.jsx - COMPLETE FIXED VERSION with Print/Download

import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    Paper,
    Chip,
    Avatar,
    Stack,
    Grid,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Drawer,
    CircularProgress,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Receipt as ReceiptIcon,
    Payment as PaymentIcon,
    AccountBalance as AccountBalanceIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    PictureAsPdf as PictureAsPdfIcon,
    Search as SearchIcon,
    MenuBook as LedgerIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { getClientLedger, setLedgerClose } from '../redux/features/clientSlice';

// ==================== STYLED COMPONENTS ====================

const GlassCard = styled(Card)(() => ({
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
}));

const StyledTableCell = styled(TableCell)(() => ({
    fontWeight: 600,
    padding: '16px',
    borderBottom: '2px solid #f0f2f5',
}));

const BalanceChip = styled(Chip)(({ balance }) => ({
    fontWeight: 700,
    borderRadius: '8px',
    backgroundColor: balance >= 0 ? '#e8f5e9' : '#ffebee',
    color: balance >= 0 ? '#2e7d32' : '#c62828',
}));

// ==================== LEDGER COMPONENT ====================

const ClientLedger = ({ open, onClose, clientId, clientName }) => {
    const dispatch = useDispatch();
    const { ledger } = useSelector((state) => state.clients);
    const fetchedRef = useRef(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('date_desc');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success"
    });

    // ========== FIXED: Access data correctly ==========
    const responseData = ledger?.data?.data || ledger?.data;
    const ledgerData = responseData?.ledger || [];
    const closingBalance = responseData?.closing_balance || 0;
    const clientNameFromData = responseData?.client || clientName;

    // Fetch ledger data when drawer opens
    useEffect(() => {
        if (open && clientId) {
            const currentClientId = parseInt(clientId);
            
            const hasDataForThisClient = ledger?.openClientId === currentClientId && ledgerData.length > 0;
            
            if (!hasDataForThisClient && !fetchedRef.current) {
                dispatch(getClientLedger(currentClientId));
                fetchedRef.current = true;
            }
        }
        
        if (!open) {
            fetchedRef.current = false;
        }
    }, [open, clientId, dispatch, ledger?.openClientId, ledgerData.length]);

    // Handle close
    const handleClose = () => {
        dispatch(setLedgerClose());
        fetchedRef.current = false;
        onClose();
    };

    // Handle refresh
    const handleRefresh = () => {
        if (clientId) {
            dispatch(getClientLedger(parseInt(clientId)));
            fetchedRef.current = true;
        }
    };

    // ==================== PRINT FUNCTION ====================
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const styles = `
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 40px; 
                    margin: 0;
                    background: white;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #667eea;
                }
                .header h1 { 
                    color: #667eea; 
                    margin: 0;
                    font-size: 28px;
                }
                .header h3 { 
                    color: #333; 
                    margin: 10px 0 0;
                    font-size: 20px;
                }
                .summary-cards { 
                    display: grid; 
                    grid-template-columns: repeat(4, 1fr); 
                    gap: 15px; 
                    margin-bottom: 30px; 
                }
                .card { 
                    border: 1px solid #e0e0e0; 
                    padding: 15px; 
                    border-radius: 8px; 
                    background: #f8fafc;
                }
                .card-title { 
                    color: #666; 
                    font-size: 12px; 
                    margin-bottom: 5px; 
                    text-transform: uppercase;
                }
                .card-value { 
                    font-size: 18px; 
                    font-weight: bold; 
                    color: #333;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0; 
                    font-size: 14px;
                }
                th { 
                    background: #667eea; 
                    color: white; 
                    padding: 12px; 
                    text-align: left; 
                    font-size: 13px;
                }
                td { 
                    padding: 10px; 
                    border: 1px solid #ddd; 
                }
                .text-right { text-align: right; }
                .summary-row { 
                    background: #f1f5f9; 
                    font-weight: bold; 
                }
                .footer { 
                    margin-top: 40px; 
                    text-align: center; 
                    color: #666;
                    font-size: 12px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }
                .success { color: #10b981; }
                .danger { color: #ef4444; }
            </style>
        `;

        const printHTML = `
            <html>
                <head>
                    <title>Ledger - ${clientNameFromData || clientName}</title>
                    ${styles}
                </head>
                <body>
                    <div class="header">
                        <h1>Client Ledger</h1>
                        <h3>${clientNameFromData || clientName}</h3>
                    </div>
                    
                    <div class="summary-cards">
                        <div class="card">
                            <div class="card-title">Opening Balance</div>
                            <div class="card-value">${formatCurrency(openingBalance)}</div>
                        </div>
                        <div class="card">
                            <div class="card-title">Total Invoiced</div>
                            <div class="card-value">${formatCurrency(totals.invoiced)}</div>
                        </div>
                        <div class="card">
                            <div class="card-title">Total Paid</div>
                            <div class="card-value">${formatCurrency(totals.paid)}</div>
                        </div>
                        <div class="card">
                            <div class="card-title">Closing Balance</div>
                            <div class="card-value ${closingBalance >= 0 ? 'success' : 'danger'}">
                                ${formatCurrency(closingBalance)}
                            </div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th class="text-right">Debit (₹)</th>
                                <th class="text-right">Credit (₹)</th>
                                <th class="text-right">Balance (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ledgerData.map(entry => `
                                <tr>
                                    <td>${entry.date || '-'}</td>
                                    <td>${entry.type}</td>
                                    <td class="text-right">${entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                                    <td class="text-right">${entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                                    <td class="text-right"><strong>${formatCurrency(entry.balance)}</strong></td>
                                </tr>
                            `).join('')}
                            <tr class="summary-row">
                                <td colspan="2"><strong>Current Balance</strong></td>
                                <td class="text-right"><strong>${formatCurrency(totals.invoiced)}</strong></td>
                                <td class="text-right"><strong>${formatCurrency(totals.paid)}</strong></td>
                                <td class="text-right">
                                    <strong class="${closingBalance >= 0 ? 'success' : 'danger'}">
                                        ${formatCurrency(closingBalance)}
                                    </strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="footer">
                        <p>Generated on ${new Date().toLocaleDateString('en-IN', { 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                        <p>This is a computer generated statement</p>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    // ==================== PDF DOWNLOAD FUNCTION ====================
    const handleDownloadPDF = async () => {
        const element = document.getElementById('ledger-print-content');
        if (!element) return;

        setSnackbar({
            open: true,
            message: "Generating PDF...",
            severity: "info"
        });

        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `Ledger_${clientNameFromData || clientName}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, letterRendering: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        try {
            const { default: html2pdf } = await import('html2pdf.js');
            await html2pdf().set(opt).from(element).save();
            setSnackbar({
                open: true,
                message: "PDF downloaded successfully!",
                severity: "success"
            });
        } catch {
            setSnackbar({
                open: true,
                message: "Failed to generate PDF",
                severity: "error"
            });
        }
    };

    // ==================== CSV EXPORT FUNCTION ====================
    const handleExportCSV = () => {
        if (!ledgerData || ledgerData.length === 0) return;

        const headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance'];
        const csvData = ledgerData.map(entry => [
            entry.date || '',
            entry.type,
            entry.debit || 0,
            entry.credit || 0,
            entry.balance || 0
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ledger_${clientNameFromData || clientName}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        setSnackbar({
            open: true,
            message: "CSV downloaded successfully!",
            severity: "success"
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Filter and sort ledger entries
    const getFilteredLedger = () => {
        if (!ledgerData || ledgerData.length === 0) return [];

        return ledgerData
            .filter(entry => {
                if (entry.type === 'Opening Balance' && filterType !== 'all') return false;
                
                const matchesSearch = entry.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                     (entry.date || '').toLowerCase().includes(searchTerm.toLowerCase());
                
                const matchesType = filterType === 'all' ||
                                   (filterType === 'invoice' && entry.type?.includes('Invoice')) ||
                                   (filterType === 'payment' && entry.type?.includes('Payment'));
                
                return matchesSearch && matchesType;
            })
            .sort((a, b) => {
                if (sortBy === 'date_desc') {
                    if (!a.date) return 1;
                    if (!b.date) return -1;
                    return new Date(b.date) - new Date(a.date);
                }
                if (sortBy === 'date_asc') {
                    if (!a.date) return 1;
                    if (!b.date) return -1;
                    return new Date(a.date) - new Date(b.date);
                }
                if (sortBy === 'amount_desc') {
                    return (b.debit + b.credit) - (a.debit + a.credit);
                }
                if (sortBy === 'amount_asc') {
                    return (a.debit + a.credit) - (b.debit + b.credit);
                }
                return 0;
            });
    };

    // Calculate totals
    const calculateTotals = () => {
        if (!ledgerData || ledgerData.length === 0) return { invoiced: 0, paid: 0 };
        
        const invoiced = ledgerData
            .filter(e => e.type?.includes('Invoice'))
            .reduce((sum, e) => sum + (e.debit || 0), 0);
        
        const paid = ledgerData
            .filter(e => e.type?.includes('Payment'))
            .reduce((sum, e) => sum + (e.credit || 0), 0);
        
        return { invoiced, paid };
    };

    const filteredLedger = getFilteredLedger();
    const totals = calculateTotals();
    const openingBalance = ledgerData?.find(e => e.type === 'Opening Balance')?.balance || 0;

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        width: '90%',
                        maxWidth: '1200px',
                        borderTopLeftRadius: '24px',
                        borderBottomLeftRadius: '24px',
                        bgcolor: '#f8fafc'
                    }
                }}
            >
                <Box sx={{ height: '100%', overflow: 'auto' }}>
                    {/* Header */}
                    <Box sx={{
                        p: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                    }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                                    <LedgerIcon sx={{ fontSize: 32 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        Client Ledger
                                    </Typography>
                                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                        {clientNameFromData || clientName || 'Loading...'}
                                    </Typography>
                                </Box>
                            </Stack>
                            <Stack direction="row" spacing={1}>
                                <Tooltip title="Refresh">
                                    <IconButton 
                                        onClick={handleRefresh} 
                                        sx={{ color: 'white' }}
                                        disabled={ledger?.isLoading}
                                    >
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Close">
                                    <IconButton onClick={handleClose} sx={{ color: 'white' }}>
                                        <CloseIcon />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Stack>
                    </Box>

                    {/* Loading State */}
                    {ledger?.isLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {/* Error State */}
                    {ledger?.isError && !ledger?.isLoading && (
                        <Box sx={{ p: 3 }}>
                            <Alert 
                                severity="error" 
                                action={
                                    <Button color="inherit" size="small" onClick={handleRefresh}>
                                        Retry
                                    </Button>
                                }
                            >
                                {ledger?.message || 'Failed to load ledger data'}
                            </Alert>
                        </Box>
                    )}

                    {/* Ledger Content */}
                    {!ledger?.isLoading && !ledger?.isError && ledgerData && (
                        <>
                            {/* Summary Cards */}
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={3}>
                                        <motion.div whileHover={{ y: -5 }}>
                                            <GlassCard>
                                                <CardContent>
                                                    <Stack spacing={1}>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Opening Balance
                                                        </Typography>
                                                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
                                                            {formatCurrency(openingBalance)}
                                                        </Typography>
                                                    </Stack>
                                                </CardContent>
                                            </GlassCard>
                                        </motion.div>
                                    </Grid>

                                    <Grid item xs={12} md={3}>
                                        <motion.div whileHover={{ y: -5 }}>
                                            <GlassCard>
                                                <CardContent>
                                                    <Stack spacing={1}>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Total Invoiced
                                                        </Typography>
                                                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>
                                                            {formatCurrency(totals.invoiced)}
                                                        </Typography>
                                                    </Stack>
                                                </CardContent>
                                            </GlassCard>
                                        </motion.div>
                                    </Grid>

                                    <Grid item xs={12} md={3}>
                                        <motion.div whileHover={{ y: -5 }}>
                                            <GlassCard>
                                                <CardContent>
                                                    <Stack spacing={1}>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Total Paid
                                                        </Typography>
                                                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                                                            {formatCurrency(totals.paid)}
                                                        </Typography>
                                                    </Stack>
                                                </CardContent>
                                            </GlassCard>
                                        </motion.div>
                                    </Grid>

                                    <Grid item xs={12} md={3}>
                                        <motion.div whileHover={{ y: -5 }}>
                                            <GlassCard>
                                                <CardContent>
                                                    <Stack spacing={1}>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Closing Balance
                                                        </Typography>
                                                        <Typography 
                                                            variant="h5" 
                                                            sx={{ 
                                                                fontWeight: 700, 
                                                                color: closingBalance >= 0 ? '#10b981' : '#ef4444'
                                                            }}
                                                        >
                                                            {formatCurrency(closingBalance)}
                                                        </Typography>
                                                    </Stack>
                                                </CardContent>
                                            </GlassCard>
                                        </motion.div>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Filters */}
                            <Box sx={{ px: 3, pb: 2 }}>
                                <Paper sx={{ p: 2, borderRadius: '16px' }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Search transactions..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <SearchIcon />
                                                        </InputAdornment>
                                                    ),
                                                    sx: { borderRadius: '10px' }
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={3}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Type</InputLabel>
                                                <Select
                                                    value={filterType}
                                                    onChange={(e) => setFilterType(e.target.value)}
                                                    label="Type"
                                                    sx={{ borderRadius: '10px' }}
                                                >
                                                    <MenuItem value="all">All Transactions</MenuItem>
                                                    <MenuItem value="invoice">Invoices Only</MenuItem>
                                                    <MenuItem value="payment">Payments Only</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12} md={3}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Sort By</InputLabel>
                                                <Select
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                    label="Sort By"
                                                    sx={{ borderRadius: '10px' }}
                                                >
                                                    <MenuItem value="date_desc">Latest First</MenuItem>
                                                    <MenuItem value="date_asc">Oldest First</MenuItem>
                                                    <MenuItem value="amount_desc">Amount (High to Low)</MenuItem>
                                                    <MenuItem value="amount_asc">Amount (Low to High)</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12} md={2}>
                                            <Stack direction="row" spacing={1}>
                                                <Tooltip title="Print Ledger">
                                                    <IconButton 
                                                        onClick={handlePrint}
                                                        sx={{ 
                                                            bgcolor: '#f1f5f9',
                                                            '&:hover': { bgcolor: '#e2e8f0' }
                                                        }}
                                                    >
                                                        <PrintIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Download PDF">
                                                    <IconButton 
                                                        onClick={handleDownloadPDF}
                                                        sx={{ 
                                                            bgcolor: '#f1f5f9',
                                                            '&:hover': { bgcolor: '#e2e8f0' }
                                                        }}
                                                    >
                                                        <PictureAsPdfIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Export CSV">
                                                    <IconButton 
                                                        onClick={handleExportCSV}
                                                        sx={{ 
                                                            bgcolor: '#f1f5f9',
                                                            '&:hover': { bgcolor: '#e2e8f0' }
                                                        }}
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Box>

                            {/* Ledger Table */}
                            <Box sx={{ px: 3, pb: 4 }}>
                                <TableContainer component={Paper} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                <StyledTableCell>Date</StyledTableCell>
                                                <StyledTableCell>Description</StyledTableCell>
                                                <StyledTableCell align="right">Debit (₹)</StyledTableCell>
                                                <StyledTableCell align="right">Credit (₹)</StyledTableCell>
                                                <StyledTableCell align="right">Balance (₹)</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredLedger.length > 0 ? (
                                                filteredLedger.map((entry, index) => (
                                                    <TableRow 
                                                        key={index}
                                                        sx={{
                                                            '&:hover': { bgcolor: '#f8fafc' },
                                                            bgcolor: entry.type === 'Opening Balance' ? '#f1f5f9' : 'inherit'
                                                        }}
                                                    >
                                                        <TableCell>
                                                            {entry.date || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                                {entry.type?.includes('Invoice') ? (
                                                                    <ReceiptIcon sx={{ fontSize: 20, color: '#667eea' }} />
                                                                ) : entry.type?.includes('Payment') ? (
                                                                    <PaymentIcon sx={{ fontSize: 20, color: '#10b981' }} />
                                                                ) : (
                                                                    <AccountBalanceIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
                                                                )}
                                                                <Typography variant="body2">
                                                                    {entry.type}
                                                                </Typography>
                                                                {entry.type?.includes('Invoice') && (
                                                                    <Chip 
                                                                        label="Invoice" 
                                                                        size="small" 
                                                                        color="primary"
                                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                                    />
                                                                )}
                                                                {entry.type?.includes('Payment') && (
                                                                    <Chip 
                                                                        label="Payment" 
                                                                        size="small" 
                                                                        color="success"
                                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                                    />
                                                                )}
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {entry.debit > 0 ? (
                                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#ef4444' }}>
                                                                    {formatCurrency(entry.debit)}
                                                                </Typography>
                                                            ) : '-'}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {entry.credit > 0 ? (
                                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981' }}>
                                                                    {formatCurrency(entry.credit)}
                                                                </Typography>
                                                            ) : '-'}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <BalanceChip
                                                                label={formatCurrency(entry.balance)}
                                                                balance={entry.balance}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                        <Typography variant="body1" color="textSecondary">
                                                            No transactions found for this client
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {/* Summary Row */}
                                            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                                <TableCell colSpan={2}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                        Current Balance
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#ef4444' }}>
                                                        {formatCurrency(totals.invoiced)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981' }}>
                                                        {formatCurrency(totals.paid)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={formatCurrency(closingBalance)}
                                                        color={closingBalance >= 0 ? 'success' : 'error'}
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </>
                    )}
                </Box>
            </Drawer>

            {/* Hidden Print Content */}
            <Box sx={{ display: 'none' }}>
                <div id="ledger-print-content">
                    <Box sx={{ p: 4, bgcolor: 'white' }}>
                        {/* Header */}
                        <Box sx={{ textAlign: 'center', mb: 4, pb: 2, borderBottom: '2px solid #667eea' }}>
                            <Typography variant="h4" sx={{ color: '#667eea', fontWeight: 700 }}>
                                Client Ledger
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 1 }}>
                                {clientNameFromData || clientName}
                            </Typography>
                        </Box>

                        {/* Summary Cards for Print */}
                        <Grid container spacing={2} sx={{ mb: 4 }}>
                            <Grid item xs={3}>
                                <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                    <Typography variant="caption" color="textSecondary">
                                        Opening Balance
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        {formatCurrency(openingBalance)}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={3}>
                                <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                    <Typography variant="caption" color="textSecondary">
                                        Total Invoiced
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                                        {formatCurrency(totals.invoiced)}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={3}>
                                <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                    <Typography variant="caption" color="textSecondary">
                                        Total Paid
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                                        {formatCurrency(totals.paid)}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={3}>
                                <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                    <Typography variant="caption" color="textSecondary">
                                        Closing Balance
                                    </Typography>
                                    <Typography 
                                        variant="h6" 
                                        sx={{ 
                                            fontWeight: 700,
                                            color: closingBalance >= 0 ? '#10b981' : '#ef4444'
                                        }}
                                    >
                                        {formatCurrency(closingBalance)}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Table for Print */}
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#667eea' }}>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Description</TableCell>
                                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Debit (₹)</TableCell>
                                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Credit (₹)</TableCell>
                                        <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Balance (₹)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ledgerData.map((entry, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{entry.date || '-'}</TableCell>
                                            <TableCell>{entry.type}</TableCell>
                                            <TableCell align="right">
                                                {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <strong>{formatCurrency(entry.balance)}</strong>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                        <TableCell colSpan={2}>
                                            <strong>Current Balance</strong>
                                        </TableCell>
                                        <TableCell align="right">
                                            <strong>{formatCurrency(totals.invoiced)}</strong>
                                        </TableCell>
                                        <TableCell align="right">
                                            <strong>{formatCurrency(totals.paid)}</strong>
                                        </TableCell>
                                        <TableCell align="right">
                                            <strong style={{ color: closingBalance >= 0 ? '#10b981' : '#ef4444' }}>
                                                {formatCurrency(closingBalance)}
                                            </strong>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Footer for Print */}
                        <Box sx={{ mt: 4, textAlign: 'center', color: '#666', fontSize: '12px' }}>
                            <Typography variant="caption">
                                Generated on {new Date().toLocaleDateString('en-IN', { 
                                    day: '2-digit', 
                                    month: 'long', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Typography>
                            <br />
                            <Typography variant="caption">
                                This is a computer generated statement
                            </Typography>
                        </Box>
                    </Box>
                </div>
            </Box>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ClientLedger;
