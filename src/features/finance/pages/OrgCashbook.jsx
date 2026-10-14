import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    getOrgAccounts,
    getOrgTransactions,
    getOrgCashflowSummary,
    createOrgTransaction,
} from '../state/orgFinanceSlice';
import {
    Box, Container, Grid, Card, CardContent, Typography, Paper, Stack,
    Button, IconButton, Chip, Avatar, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
    InputAdornment, Tooltip, Table, TableHead, TableRow, TableCell,
    TableBody, TableContainer, Snackbar, Alert, CircularProgress,
} from '@mui/material';
import {
    TrendingUp as InflowIcon,
    TrendingDown as OutflowIcon,
    AccountBalanceWallet as BalanceIcon,
    Remove as ExpenseIcon,
    SwapHoriz as TransferIcon,
    Paid as IncomeIcon,
    Print as PrintIcon,
    Refresh as RefreshIcon,
    Close as CloseIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';

const GlassCard = styled(Card)(({ theme }) => ({
    background: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.06)',
    border: `1px solid ${theme.palette.divider}`,
}));

const GradientButton = styled(Button)(({ gradient }) => ({
    background: gradient || 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    color: 'white',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(17,153,142,0.25)',
    '&:hover': { transform: 'scale(1.02)', opacity: 0.95 },
}));

const fmt = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const CATEGORY_LABELS = {
    client_payment:   { label: 'Client Receipt', color: 'success' },
    vendor_payment:   { label: 'Vendor Payment', color: 'error' },
    office_expense:   { label: 'Office Expense', color: 'warning' },
    owner_capital:    { label: 'Capital In',     color: 'info' },
    transfer:         { label: 'Transfer (Contra)', color: 'secondary' },
    opening_balance:  { label: 'Opening Balance', color: 'default' },
    other_income:     { label: 'Other Income',   color: 'success' },
    other_expense:    { label: 'Other Expense',  color: 'error' },
    refund:           { label: 'Refund',         color: 'warning' },
};

const OrgCashbook = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const { accounts = [], transactions = [], cashflowSummary, isLoading } =
        useSelector((s) => s.orgFinance || {});

    const [selectedAccountId, setSelectedAccountId] = useState(
        location.state?.selectedAccountId ? String(location.state.selectedAccountId) : 'all'
    );
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const [expenseDialog, setExpenseDialog]   = useState(false);
    const [incomeDialog, setIncomeDialog]     = useState(false);
    const [transferDialog, setTransferDialog] = useState(false);
    const [snackbar, setSnackbar]             = useState({ open: false, message: '', severity: 'success' });

    const [trxForm, setTrxForm] = useState({
        account_id:          '',
        transaction_date:    new Date().toISOString().split('T')[0],
        type:                'debit',
        category:            'office_expense',
        amount:              '',
        payment_method:      'bank_transfer',
        reference_no:        '',
        description:         '',
        transfer_account_id: '',
    });

    const loadData = () => {
        dispatch(getOrgAccounts());
        dispatch(getOrgTransactions({
            account_id: selectedAccountId !== 'all' ? selectedAccountId : undefined,
            type: filterType !== 'all' ? filterType : undefined,
            category: filterCategory !== 'all' ? filterCategory : undefined,
            from_date: fromDate || undefined,
            to_date: toDate || undefined,
            search: searchQuery || undefined,
        }));
        dispatch(getOrgCashflowSummary({
            from_date: fromDate || undefined,
            to_date: toDate || undefined,
        }));
    };

    useEffect(() => {
        loadData();
    }, [selectedAccountId, filterType, filterCategory, fromDate, toDate, dispatch]);

    const showSnackbar = (message, severity = 'success') =>
        setSnackbar({ open: true, message, severity });

    const defaultAccId = accounts.find(a => a.is_default)?.id || accounts[0]?.id || '';

    const handleOpenExpense = () => {
        setTrxForm({
            account_id:       selectedAccountId !== 'all' ? selectedAccountId : defaultAccId,
            transaction_date: new Date().toISOString().split('T')[0],
            type:             'debit',
            category:         'office_expense',
            amount:           '',
            payment_method:   'cash',
            reference_no:     '',
            description:      '',
            transfer_account_id: '',
        });
        setExpenseDialog(true);
    };

    const handleOpenIncome = () => {
        setTrxForm({
            account_id:       selectedAccountId !== 'all' ? selectedAccountId : defaultAccId,
            transaction_date: new Date().toISOString().split('T')[0],
            type:             'credit',
            category:         'owner_capital',
            amount:           '',
            payment_method:   'bank_transfer',
            reference_no:     '',
            description:      '',
            transfer_account_id: '',
        });
        setIncomeDialog(true);
    };

    const handleOpenTransfer = () => {
        setTrxForm({
            account_id:          accounts[0]?.id || '',
            transaction_date:    new Date().toISOString().split('T')[0],
            type:                'debit',
            category:            'transfer',
            amount:              '',
            payment_method:      'bank_transfer',
            reference_no:        '',
            description:         'Internal Transfer / Contra',
            transfer_account_id: accounts[1]?.id || '',
        });
        setTransferDialog(true);
    };

    const handleSubmitTrx = async (e, dialogSetter) => {
        e.preventDefault();
        const amt = parseFloat(trxForm.amount);
        if (!amt || amt <= 0) {
            showSnackbar('Enter a valid amount', 'error'); return;
        }
        if (!trxForm.account_id) {
            showSnackbar('Select an account', 'error'); return;
        }

        try {
            await dispatch(createOrgTransaction(trxForm)).unwrap();
            showSnackbar('Transaction recorded successfully!');
            dialogSetter(false);
            loadData();
        } catch (err) {
            showSnackbar(typeof err === 'string' ? err : 'Transaction failed!', 'error');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Paper elevation={0} sx={{
                p: 3, mb: 3, borderRadius: '16px',
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                    : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                color: 'white',
            }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} letterSpacing={0.5}>
                            📖 Company Cash & Bank Book
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                            Paisa Kahan Se Aaya, Kahan Gaya — Complete organisation fund flow and bank statement.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<TransferIcon />}
                            onClick={handleOpenTransfer}
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', borderRadius: '10px', textTransform: 'none' }}
                        >
                            Transfer Funds
                        </Button>
                        <GradientButton
                            startIcon={<IncomeIcon />}
                            onClick={handleOpenIncome}
                            gradient="linear-gradient(135deg, #10b981, #059669)"
                        >
                            + Add Income
                        </GradientButton>
                        <GradientButton
                            startIcon={<ExpenseIcon />}
                            onClick={handleOpenExpense}
                            gradient="linear-gradient(135deg, #ef4444, #dc2626)"
                        >
                            + Record Expense
                        </GradientButton>
                    </Stack>
                </Stack>
            </Paper>

            {/* Cashflow Summary Cards */}
            <Grid container spacing={2.5} mb={3}>
                <Grid item xs={12} sm={4}>
                    <GlassCard>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        TOTAL MONEY IN (CREDIT)
                                    </Typography>
                                    <Typography variant="h4" fontWeight={800} color="#10b981" mt={0.5}>
                                        {fmt(cashflowSummary?.total_inflow)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Client receipts & direct deposits
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: 48, height: 48 }}>
                                    <InflowIcon />
                                </Avatar>
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <GlassCard>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        TOTAL MONEY OUT (DEBIT)
                                    </Typography>
                                    <Typography variant="h4" fontWeight={800} color="#ef4444" mt={0.5}>
                                        {fmt(cashflowSummary?.total_outflow)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Vendor payouts & office expenses
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: 48, height: 48 }}>
                                    <OutflowIcon />
                                </Avatar>
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <GlassCard>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        NET CASHFLOW PERIOD
                                    </Typography>
                                    <Typography variant="h4" fontWeight={800} color={Number(cashflowSummary?.net_flow) >= 0 ? '#10b981' : '#ef4444'} mt={0.5}>
                                        {fmt(cashflowSummary?.net_flow)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Net surplus / deficit
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: 48, height: 48 }}>
                                    <BalanceIcon />
                                </Avatar>
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* Filter Bar */}
            <GlassCard sx={{ p: 2.5, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Account</InputLabel>
                            <Select
                                value={selectedAccountId}
                                label="Account"
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                            >
                                <MenuItem value="all">🌐 All Accounts Consolidated</MenuItem>
                                {accounts.map(a => (
                                    <MenuItem key={a.id} value={String(a.id)}>
                                        {a.account_type === 'cash' ? '💵 ' : '🏦 '}{a.account_name || a.name} ({fmt(a.current_balance)})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={filterType}
                                label="Type"
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="credit">Money In (+)</MenuItem>
                                <MenuItem value="debit">Money Out (-)</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                        <TextField
                            fullWidth size="small" type="date"
                            label="From Date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                        <TextField
                            fullWidth size="small" type="date"
                            label="To Date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={6} sm={3} md={3}>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                fullWidth size="small"
                                placeholder="Search note / ref..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} /> }}
                            />
                            <Tooltip title="Print Statement">
                                <IconButton onClick={handlePrint} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
                                    <PrintIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Refresh">
                                <IconButton onClick={loadData} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '10px' }}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Grid>
                </Grid>
            </GlassCard>

            {/* Statement Table */}
            <TableContainer component={GlassCard} sx={{ borderRadius: '16px' }}>
                <Table>
                    <TableHead sx={{ bgcolor: isDark ? '#1e293b' : '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Account</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Description / Ref</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Debit (- Out)</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Credit (+ In)</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Running Balance</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                    <CircularProgress size={30} />
                                </TableCell>
                            </TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    No transactions found matching criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((t) => {
                                const isCredit = t.type === 'credit';
                                const catInfo = CATEGORY_LABELS[t.category] || { label: t.category, color: 'default' };

                                return (
                                    <TableRow key={t.id} hover>
                                        <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>
                                            {t.transaction_date}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={t.account_name || t.account?.name || 'Account'}
                                                sx={{ fontSize: 11, fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={catInfo.label}
                                                color={catInfo.color}
                                                variant="outlined"
                                                sx={{ fontSize: 11, fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {t.description || '—'}
                                            </Typography>
                                            {t.reference_no && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Ref: {t.reference_no} ({t.payment_method})
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: '#ef4444' }}>
                                            {!isCredit ? fmt(t.amount) : '—'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: '#10b981' }}>
                                            {isCredit ? fmt(t.amount) : '—'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                                            {fmt(t.balance_after)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal: Record Expense */}
            <Dialog open={expenseDialog} onClose={() => setExpenseDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={700} color="#ef4444">Record Direct Expense</Typography>
                        <IconButton onClick={() => setExpenseDialog(false)}><CloseIcon /></IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" id="expense-form" onSubmit={(e) => handleSubmitTrx(e, setExpenseDialog)}>
                        <Stack spacing={2} mt={1}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Pay From Account</InputLabel>
                                <Select
                                    value={trxForm.account_id}
                                    label="Pay From Account"
                                    onChange={(e) => setTrxForm(p => ({ ...p, account_id: e.target.value }))}
                                >
                                    {accounts.map(a => (
                                        <MenuItem key={a.id} value={a.id}>
                                            {a.account_type === 'cash' ? '💵 ' : '🏦 '}{a.account_name || a.name} ({fmt(a.current_balance)})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth size="small">
                                <InputLabel>Expense Category</InputLabel>
                                <Select
                                    value={trxForm.category}
                                    label="Expense Category"
                                    onChange={(e) => setTrxForm(p => ({ ...p, category: e.target.value }))}
                                >
                                    <MenuItem value="office_expense">Office Expense</MenuItem>
                                    <MenuItem value="rent">Rent</MenuItem>
                                    <MenuItem value="salary">Staff Salary</MenuItem>
                                    <MenuItem value="utilities">Electricity / Internet Bill</MenuItem>
                                    <MenuItem value="tea_snacks">Tea & Refreshment</MenuItem>
                                    <MenuItem value="freight">Courier / Freight</MenuItem>
                                    <MenuItem value="other_expense">Other Expense</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth size="small" type="number" required
                                label="Amount"
                                value={trxForm.amount}
                                onChange={(e) => setTrxForm(p => ({ ...p, amount: e.target.value }))}
                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            />
                            <TextField
                                fullWidth size="small" type="date" required
                                label="Date"
                                value={trxForm.transaction_date}
                                onChange={(e) => setTrxForm(p => ({ ...p, transaction_date: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth size="small"
                                label="Description"
                                value={trxForm.description}
                                onChange={(e) => setTrxForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="e.g. October office rent, tea snacks"
                            />
                            <TextField
                                fullWidth size="small"
                                label="Reference / Bill No"
                                value={trxForm.reference_no}
                                onChange={(e) => setTrxForm(p => ({ ...p, reference_no: e.target.value }))}
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setExpenseDialog(false)} variant="outlined">Cancel</Button>
                    <GradientButton type="submit" form="expense-form" gradient="linear-gradient(135deg, #ef4444, #dc2626)">
                        Debit & Save
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Modal: Add Direct Income */}
            <Dialog open={incomeDialog} onClose={() => setIncomeDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={700} color="#10b981">Add Direct Income / Capital</Typography>
                        <IconButton onClick={() => setIncomeDialog(false)}><CloseIcon /></IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" id="income-form" onSubmit={(e) => handleSubmitTrx(e, setIncomeDialog)}>
                        <Stack spacing={2} mt={1}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Deposit To Account</InputLabel>
                                <Select
                                    value={trxForm.account_id}
                                    label="Deposit To Account"
                                    onChange={(e) => setTrxForm(p => ({ ...p, account_id: e.target.value }))}
                                >
                                    {accounts.map(a => (
                                        <MenuItem key={a.id} value={a.id}>
                                            {a.account_type === 'cash' ? '💵 ' : '🏦 '}{a.account_name || a.name} ({fmt(a.current_balance)})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth size="small">
                                <InputLabel>Income Category</InputLabel>
                                <Select
                                    value={trxForm.category}
                                    label="Income Category"
                                    onChange={(e) => setTrxForm(p => ({ ...p, category: e.target.value }))}
                                >
                                    <MenuItem value="owner_capital">Owner / Partner Capital</MenuItem>
                                    <MenuItem value="loan_receipt">Loan Disbursal</MenuItem>
                                    <MenuItem value="interest_income">Interest Received</MenuItem>
                                    <MenuItem value="other_income">Other Income</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth size="small" type="number" required
                                label="Amount"
                                value={trxForm.amount}
                                onChange={(e) => setTrxForm(p => ({ ...p, amount: e.target.value }))}
                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            />
                            <TextField
                                fullWidth size="small" type="date" required
                                label="Date"
                                value={trxForm.transaction_date}
                                onChange={(e) => setTrxForm(p => ({ ...p, transaction_date: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth size="small"
                                label="Description"
                                value={trxForm.description}
                                onChange={(e) => setTrxForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="e.g. Initial capital deposited"
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setIncomeDialog(false)} variant="outlined">Cancel</Button>
                    <GradientButton type="submit" form="income-form" gradient="linear-gradient(135deg, #10b981, #059669)">
                        Credit & Save
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Modal: Transfer Funds (Contra) */}
            <Dialog open={transferDialog} onClose={() => setTransferDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={700}>Transfer Between Accounts</Typography>
                        <IconButton onClick={() => setTransferDialog(false)}><CloseIcon /></IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" id="transfer-form" onSubmit={(e) => handleSubmitTrx(e, setTransferDialog)}>
                        <Stack spacing={2} mt={1}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Transfer From</InputLabel>
                                <Select
                                    value={trxForm.account_id}
                                    label="Transfer From"
                                    onChange={(e) => setTrxForm(p => ({ ...p, account_id: e.target.value }))}
                                >
                                    {accounts.map(a => (
                                        <MenuItem key={a.id} value={a.id}>
                                            {a.account_name || a.name} ({fmt(a.current_balance)})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth size="small">
                                <InputLabel>Transfer To</InputLabel>
                                <Select
                                    value={trxForm.transfer_account_id}
                                    label="Transfer To"
                                    onChange={(e) => setTrxForm(p => ({ ...p, transfer_account_id: e.target.value }))}
                                >
                                    {accounts.filter(a => a.id !== trxForm.account_id).map(a => (
                                        <MenuItem key={a.id} value={a.id}>
                                            {a.account_name || a.name} ({fmt(a.current_balance)})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth size="small" type="number" required
                                label="Transfer Amount"
                                value={trxForm.amount}
                                onChange={(e) => setTrxForm(p => ({ ...p, amount: e.target.value }))}
                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            />
                            <TextField
                                fullWidth size="small" type="date" required
                                label="Date"
                                value={trxForm.transaction_date}
                                onChange={(e) => setTrxForm(p => ({ ...p, transaction_date: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth size="small"
                                label="Note / Cheque / UTR"
                                value={trxForm.reference_no}
                                onChange={(e) => setTrxForm(p => ({ ...p, reference_no: e.target.value }))}
                                placeholder="e.g. ATM withdrawal for office cash"
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setTransferDialog(false)} variant="outlined">Cancel</Button>
                    <GradientButton type="submit" form="transfer-form" gradient="linear-gradient(135deg, #8b5cf6, #6d28d9)">
                        Confirm Transfer
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(p => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Container>
    );
};

export default OrgCashbook;