import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import VoucherSlipModal from '../components/VoucherSlipModal';
import {
    getOrgAccounts,
    getOrgTransactions,
    getOrgCashflowSummary,
    createOrgTransaction,
    getOrgCategories,
    createOrgCategory,
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

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// Standard Out-of-the-Box Business Categories
const DEFAULT_INCOME_CATEGORIES = [
    { key: 'client_payment',   slug: 'client_payment',   name: 'Client Payment (Invoice)',       label: 'Client Receipt', color: 'success', icon: '💵' },
    { key: 'purchase_return',  slug: 'purchase_return',  name: 'Purchase Return Refund',         label: 'Purchase Return', color: 'success', icon: '↩️' },
    { key: 'owner_capital',    slug: 'owner_capital',    name: 'Owner Capital Infusion',         label: 'Capital In',     color: 'info',    icon: '💼' },
    { key: 'interest_income',  slug: 'interest_income',  name: 'Bank / FD Interest',             label: 'Bank Interest',  color: 'success', icon: '🏦' },
    { key: 'other_income',     slug: 'other_income',     name: 'Other Direct Income',            label: 'Other Income',   color: 'success', icon: '➕' },
];

const DEFAULT_EXPENSE_CATEGORIES = [
    { key: 'vendor_payment',   slug: 'vendor_payment',   name: 'Vendor Payout (PO)',             label: 'Vendor Payment', color: 'error',   icon: '🧾' },
    { key: 'sales_return',     slug: 'sales_return',     name: 'Sales Return Refund',            label: 'Sales Return',   color: 'error',   icon: '↩️' },
    { key: 'office_rent',      slug: 'office_rent',      name: 'Office / Shop Rent',             label: 'Office Rent',    color: 'warning', icon: '🏢' },
    { key: 'salary',           slug: 'salary',           name: 'Staff Salary & Wages',           label: 'Staff Salary',   color: 'info',    icon: '👥' },
    { key: 'electricity_bill', slug: 'electricity_bill', name: 'Electricity & Utilities',       label: 'Electricity',    color: 'warning', icon: '⚡' },
    { key: 'tea_snacks',       slug: 'tea_snacks',       name: 'Tea, Pantry & Refreshments',     label: 'Tea & Snacks',   color: 'warning', icon: '☕' },
    { key: 'office_expense',   slug: 'office_expense',   name: 'Office Supplies & Stationery',   label: 'Office Supplies',color: 'warning', icon: '📦' },
    { key: 'freight_logistics',slug: 'freight_logistics',name: 'Freight & Transportation',       label: 'Freight',        color: 'warning', icon: '🚚' },
    { key: 'marketing_ads',    slug: 'marketing_ads',    name: 'Marketing & Advertising',        label: 'Marketing',      color: 'warning', icon: '📢' },
    { key: 'repairs',          slug: 'repairs',          name: 'Repairs & Maintenance',          label: 'Repairs',        color: 'warning', icon: '🛠️' },
    { key: 'other_expense',    slug: 'other_expense',    name: 'Other Business Expense',         label: 'Other Expense',  color: 'error',   icon: '📌' },
];

const OrgCashbook = () => {
    const [voucherModal, setVoucherModal] = useState({ open: false, transaction: null });
    const companies = useSelector((s) => s.companies?.companies || []);
    const { user } = useSelector((s) => s.auth || {});
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // ── Safe Destructuring with Guaranteed Non-Null Fallbacks ────────
    const {
        accounts = [],
        transactions = [],
        categories: rawCategories,
        cashflowSummary: rawSummary,
        isLoading,
    } = useSelector((s) => s.orgFinance || {});

    const cashflowSummary = rawSummary || {};

    // Merge Backend Categories with Defaults dynamically
    const incomeCategories = useMemo(() => {
        const fromBackend = rawCategories?.income || [];
        const merged = [...DEFAULT_INCOME_CATEGORIES];
        fromBackend.forEach(cat => {
            if (!merged.some(m => (m.slug || m.key) === (cat.slug || cat.key || cat.name))) {
                merged.push({
                    key: cat.slug || cat.name,
                    slug: cat.slug || cat.name,
                    name: cat.name,
                    label: cat.name,
                    color: cat.color || 'success',
                    icon: cat.icon || '➕',
                });
            }
        });
        return merged;
    }, [rawCategories]);

    const expenseCategories = useMemo(() => {
        const fromBackend = rawCategories?.expense || [];
        const merged = [...DEFAULT_EXPENSE_CATEGORIES];
        fromBackend.forEach(cat => {
            if (!merged.some(m => (m.slug || m.key) === (cat.slug || cat.key || cat.name))) {
                merged.push({
                    key: cat.slug || cat.name,
                    slug: cat.slug || cat.name,
                    name: cat.name,
                    label: cat.name,
                    color: cat.color || 'warning',
                    icon: cat.icon || '📌',
                });
            }
        });
        return merged;
    }, [rawCategories]);

    // Quick Category Modal State (Zero Developer Dependency)
    const [quickCatModal, setQuickCatModal] = useState({ open: false, type: 'expense' });
    const [quickCatName, setQuickCatName] = useState('');
    const [savingCat, setSavingCat] = useState(false);

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
        account_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        type: 'debit',
        category: 'office_rent',
        amount: '',
        payment_method: 'bank_transfer',
        reference_no: '',
        description: '',
        transfer_account_id: '',
    });

    const loadData = () => {
        dispatch(getOrgAccounts());
        if (typeof getOrgCategories === 'function') {
            dispatch(getOrgCategories());
        }
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

    const defaultAccId = (accounts || []).find(a => a.is_default)?.id || accounts?.[0]?.id || '';

    const handleOpenExpense = () => {
        const defCat = expenseCategories[2]?.slug || 'office_rent';
        const defDesc = expenseCategories[2]?.name || 'Office / Shop Rent';
        setTrxForm({
            account_id: defaultAccId,
            transaction_date: new Date().toISOString().split('T')[0],
            type: 'debit',
            category: defCat,
            amount: '',
            payment_method: 'bank_transfer',
            reference_no: '',
            description: defDesc,
            transfer_account_id: '',
        });
        setExpenseDialog(true);
    };

    const handleOpenIncome = () => {
        const defCat = incomeCategories[4]?.slug || 'other_income';
        const defDesc = incomeCategories[4]?.name || 'Other Direct Income';
        setTrxForm({
            account_id: defaultAccId,
            transaction_date: new Date().toISOString().split('T')[0],
            type: 'credit',
            category: defCat,
            amount: '',
            payment_method: 'bank_transfer',
            reference_no: '',
            description: defDesc,
            transfer_account_id: '',
        });
        setIncomeDialog(true);
    };

    const handleOpenTransfer = () => {
        const destAccId = (accounts || []).find(a => a.id !== defaultAccId)?.id || '';
        setTrxForm({
            account_id: defaultAccId,
            transaction_date: new Date().toISOString().split('T')[0],
            type: 'debit',
            category: 'transfer',
            amount: '',
            payment_method: 'bank_transfer',
            reference_no: '',
            description: 'Internal Transfer / Contra',
            transfer_account_id: destAccId,
        });
        setTransferDialog(true);
    };

    // Quick Save Custom Category (On the fly in dialog)
    const handleSaveQuickCategory = async () => {
        if (!quickCatName.trim()) return;
        setSavingCat(true);
        try {
            if (typeof createOrgCategory === 'function') {
                const res = await dispatch(createOrgCategory({
                    name: quickCatName.trim(),
                    type: quickCatModal.type,
                })).unwrap();
                showSnackbar(`Category "${res.name}" created! 🎉`);
                const chosenKey = res.slug || res.name;
                setTrxForm(p => ({
                    ...p,
                    category: chosenKey,
                    description: res.name,
                }));
            } else {
                // Local fallback if redux action not hooked yet
                showSnackbar(`Category "${quickCatName}" selected!`);
                setTrxForm(p => ({
                    ...p,
                    category: quickCatName.toLowerCase().replace(/\\s+/g, '_'),
                    description: quickCatName.trim(),
                }));
            }
            setQuickCatName('');
            setQuickCatModal({ open: false, type: 'expense' });
        } catch (err) {
            showSnackbar(typeof err === 'string' ? err : 'Failed to create category', 'error');
        } finally {
            setSavingCat(false);
        }
    };

    const handleSubmitTrx = async (e, closeDialog) => {
        e.preventDefault();
        if (!trxForm.account_id || !trxForm.amount || parseFloat(trxForm.amount) <= 0) {
            showSnackbar('Please enter a valid account and positive amount', 'error');
            return;
        }

        // Auto-fill description if left blank by user
        let autoDesc = trxForm.description?.trim();
        if (!autoDesc) {
            const allCats = [...incomeCategories, ...expenseCategories];
            const matched = allCats.find(c => (c.slug || c.key) === trxForm.category);
            autoDesc = matched?.name || matched?.label || trxForm.category;
        }

        try {
            await dispatch(createOrgTransaction({
                ...trxForm,
                description: autoDesc,
                amount: parseFloat(trxForm.amount),
                transfer_account_id: trxForm.transfer_account_id ? Number(trxForm.transfer_account_id) : undefined,
            })).unwrap();

            showSnackbar('Transaction recorded successfully! 🎉');
            closeDialog(false);
            loadData();
        } catch (err) {
            showSnackbar(typeof err === 'string' ? err : 'Failed to record transaction', 'error');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Header Banner */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, md: 3 },
                    mb: 3,
                    borderRadius: '24px',
                    background: isDark
                        ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                        : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
                            📖 Company Cash & Bank Book
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            Paisa Kahan Se Aaya, Kahan Gaya — Complete organisation fund flow and bank statement.
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/org/reconciliation', { state: { selectedAccountId } })}
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)', borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.1)' }}
                        >
                            🏦 Bank Reconciliation (BRS)
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<TransferIcon />}
                            onClick={handleOpenTransfer}
                            sx={{
                                color: '#ffffff',
                                borderColor: 'rgba(255,255,255,0.3)',
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            ⇄ Transfer Funds
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<IncomeIcon />}
                            onClick={handleOpenIncome}
                            sx={{
                                bgcolor: '#10b981',
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontWeight: 700,
                                '&:hover': { bgcolor: '#059669' },
                            }}
                        >
                            + Add Income
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<ExpenseIcon />}
                            onClick={handleOpenExpense}
                            sx={{
                                bgcolor: '#ef4444',
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontWeight: 700,
                                '&:hover': { bgcolor: '#dc2626' },
                            }}
                        >
                            − Record Expense
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {/* Cashflow Summary Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <GlassCard>
                        <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Total Money In (Credit)
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="#10b981" sx={{ mt: 0.5 }}>
                                        {fmt(cashflowSummary?.total_inflow || 0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Client receipts & direct deposits
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: 44, height: 44 }}>
                                    <InflowIcon />
                                </Avatar>
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <GlassCard>
                        <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Total Money Out (Debit)
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="#ef4444" sx={{ mt: 0.5 }}>
                                        {fmt(cashflowSummary?.total_outflow || 0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Vendor payouts & office expenses
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', width: 44, height: 44 }}>
                                    <OutflowIcon />
                                </Avatar>
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <GlassCard>
                        <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Net Cashflow Period
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        fontWeight={800}
                                        sx={{ mt: 0.5, color: Number(cashflowSummary?.net_flow || 0) >= 0 ? '#10b981' : '#ef4444' }}
                                    >
                                        {fmt(cashflowSummary?.net_flow || 0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Net surplus / deficit
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', width: 44, height: 44 }}>
                                    <BalanceIcon />
                                </Avatar>
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* Filter Bar */}
            <GlassCard sx={{ mb: 3 }}>
                <CardContent sx={{ p: 2 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
                            <InputLabel>Account</InputLabel>
                            <Select
                                value={selectedAccountId}
                                label="Account"
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                            >
                                <MenuItem value="all">🌐 All Accounts Consolidated</MenuItem>
                                {(accounts || []).map(a => (
                                    <MenuItem key={a.id} value={a.id}>
                                        {a.account_type === 'cash' ? '💵 ' : '🏦 '}
                                        {a.account_name || a.name} ({fmt(a.current_balance)})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={filterType}
                                label="Type"
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="credit">Money In (Credit)</MenuItem>
                                <MenuItem value="debit">Money Out (Debit)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            size="small"
                            type="date"
                            label="From Date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 140 }}
                        />

                        <TextField
                            size="small"
                            type="date"
                            label="To Date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 140 }}
                        />

                        <TextField
                            size="small"
                            placeholder="Search note / ref..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadData()}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ flex: 1.5 }}
                        />

                        <Stack direction="row" spacing={1}>
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
                    </Stack>
                </CardContent>
            </GlassCard>

            {/* Statement Table */}
            <TableContainer component={GlassCard} sx={{ borderRadius: '16px' }}>
                <Table>
                    <TableHead sx={{ bgcolor: isDark ? '#1e293b' : '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Voucher #</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Account</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Description / Ref</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Debit (- Out)</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Credit (+ In)</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Running Balance</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                    <CircularProgress size={30} />
                                </TableCell>
                            </TableRow>
                        ) : (transactions || []).length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                    No transactions found matching criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            (transactions || []).map((t) => {
                                const isCredit = t.type === 'credit';
                                const allCats = [...incomeCategories, ...expenseCategories];
                                const matchedCat = allCats.find(c => (c.slug || c.key) === t.category);

                                const catLabel = matchedCat?.name || matchedCat?.label || t.category;
                                const catColor = matchedCat?.color || (t.category === 'transfer' ? 'secondary' : isCredit ? 'success' : 'warning');

                                return (
                                    <TableRow key={t.id} hover>
                                        <TableCell sx={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                                            {t.transaction_date_fmt || t.transaction_date}
                                        </TableCell>

                                        {/* Voucher # Tag */}
                                        <TableCell>
                                            <Chip
                                                label={t.voucher_no || ('TX-' + t.id)}
                                                size="small"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: 11,
                                                    bgcolor: t.category === 'transfer' ? 'rgba(99, 102, 241, 0.1)' : isCredit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: t.category === 'transfer' ? '#4f46e5' : isCredit ? '#059669' : '#dc2626',
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={t.account_name || t.account?.name || t.account?.account_name || 'Account'}
                                                sx={{ fontSize: 11, fontWeight: 600 }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={catLabel}
                                                color={catColor}
                                                variant="outlined"
                                                sx={{ fontSize: 11, fontWeight: 600 }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {t.description || catLabel}
                                            </Typography>
                                            {t.reference_no && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Ref: {t.reference_no} ({t.payment_method ? t.payment_method.toUpperCase() : 'N/A'})
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

                                        {/* Print Voucher Action */}
                                        <TableCell align="center">
                                            <Tooltip title="Print Signed Voucher Slip" arrow>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => setVoucherModal({ open: true, transaction: t })}
                                                >
                                                    <PrintIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal: Record Expense (Money Out) */}
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
                                    {(accounts || []).map(a => (
                                        <MenuItem key={a.id} value={a.id}>
                                            {a.account_type === 'cash' ? '💵 ' : '🏦 '}
                                            {a.account_name || a.name} ({fmt(a.current_balance)})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Dynamic Expense Categories with Quick Add */}
                            <FormControl fullWidth size="small">
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={trxForm.category}
                                    label="Category"
                                    onChange={(e) => {
                                        if (e.target.value === '__add_new__') {
                                            setQuickCatModal({ open: true, type: 'expense' });
                                        } else {
                                            const selected = expenseCategories.find(c => (c.slug || c.key) === e.target.value);
                                            setTrxForm(p => ({
                                                ...p,
                                                category: e.target.value,
                                                description: selected?.name || p.description,
                                            }));
                                        }
                                    }}
                                >
                                    {expenseCategories.map(cat => (
                                        <MenuItem key={cat.slug || cat.key} value={cat.slug || cat.key}>
                                            {cat.icon || '📌'} {cat.name}
                                        </MenuItem>
                                    ))}
                                    <MenuItem
                                        value="__add_new__"
                                        sx={{
                                            color: '#ef4444',
                                            fontWeight: 700,
                                            borderTop: '1px dashed #cbd5e1',
                                            mt: 1,
                                        }}
                                    >
                                        ➕ + Add Custom Expense Category...
                                    </MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                size="small"
                                label="Expense Amount (₹)"
                                type="number"
                                required
                                value={trxForm.amount}
                                onChange={(e) => setTrxForm(p => ({ ...p, amount: e.target.value }))}
                            />

                            <TextField
                                fullWidth
                                size="small"
                                label="Date"
                                type="date"
                                required
                                value={trxForm.transaction_date}
                                onChange={(e) => setTrxForm(p => ({ ...p, transaction_date: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />

                            <FormControl fullWidth size="small">
                                <InputLabel>Payment Mode</InputLabel>
                                <Select
                                    value={trxForm.payment_method}
                                    label="Payment Mode"
                                    onChange={(e) => setTrxForm(p => ({ ...p, payment_method: e.target.value }))}
                                >
                                    <MenuItem value="bank_transfer">🏦 Bank Transfer</MenuItem>
                                    <MenuItem value="upi">📱 UPI</MenuItem>
                                    <MenuItem value="cash">💵 Cash</MenuItem>
                                    <MenuItem value="cheque">📝 Cheque</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                size="small"
                                label="Description / Narration"
                                placeholder="e.g. October office rent, tea snacks"
                                value={trxForm.description}
                                onChange={(e) => setTrxForm(p => ({ ...p, description: e.target.value }))}
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setExpenseDialog(false)} variant="outlined">Cancel</Button>
                    <GradientButton type="submit" form="expense-form" gradient="linear-gradient(135deg, #ef4444, #dc2626)">
                        Save Expense
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Modal: Add Income (Money In) */}
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
                                    {(accounts || []).map(a => (
                                        <MenuItem key={a.id} value={a.id}>
                                            {a.account_type === 'cash' ? '💵 ' : '🏦 '}
                                            {a.account_name || a.name} ({fmt(a.current_balance)})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Dynamic Income Categories with Quick Add */}
                            <FormControl fullWidth size="small">
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={trxForm.category}
                                    label="Category"
                                    onChange={(e) => {
                                        if (e.target.value === '__add_new__') {
                                            setQuickCatModal({ open: true, type: 'income' });
                                        } else {
                                            const selected = incomeCategories.find(c => (c.slug || c.key) === e.target.value);
                                            setTrxForm(p => ({
                                                ...p,
                                                category: e.target.value,
                                                description: selected?.name || p.description,
                                            }));
                                        }
                                    }}
                                >
                                    {incomeCategories.map(cat => (
                                        <MenuItem key={cat.slug || cat.key} value={cat.slug || cat.key}>
                                            {cat.icon || '➕'} {cat.name}
                                        </MenuItem>
                                    ))}
                                    <MenuItem
                                        value="__add_new__"
                                        sx={{
                                            color: '#10b981',
                                            fontWeight: 700,
                                            borderTop: '1px dashed #cbd5e1',
                                            mt: 1,
                                        }}
                                    >
                                        ➕ + Add Custom Income Category...
                                    </MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                size="small"
                                label="Amount (₹)"
                                type="number"
                                required
                                value={trxForm.amount}
                                onChange={(e) => setTrxForm(p => ({ ...p, amount: e.target.value }))}
                            />

                            <TextField
                                fullWidth
                                size="small"
                                label="Date"
                                type="date"
                                required
                                value={trxForm.transaction_date}
                                onChange={(e) => setTrxForm(p => ({ ...p, transaction_date: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />

                            <FormControl fullWidth size="small">
                                <InputLabel>Deposit Mode</InputLabel>
                                <Select
                                    value={trxForm.payment_method}
                                    label="Deposit Mode"
                                    onChange={(e) => setTrxForm(p => ({ ...p, payment_method: e.target.value }))}
                                >
                                    <MenuItem value="bank_transfer">🏦 Bank Transfer</MenuItem>
                                    <MenuItem value="upi">📱 UPI</MenuItem>
                                    <MenuItem value="cash">💵 Cash</MenuItem>
                                    <MenuItem value="cheque">📝 Cheque</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                size="small"
                                label="Description / Narration"
                                placeholder="e.g. Interest received, capital added"
                                value={trxForm.description}
                                onChange={(e) => setTrxForm(p => ({ ...p, description: e.target.value }))}
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setIncomeDialog(false)} variant="outlined">Cancel</Button>
                    <GradientButton type="submit" form="income-form" gradient="linear-gradient(135deg, #10b981, #059669)">
                        Save Income
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* Modal: Transfer Funds (Contra) */}
            <Dialog open={transferDialog} onClose={() => setTransferDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={700} color="#8b5cf6">⇄ Transfer Funds (Contra)</Typography>
                        <IconButton onClick={() => setTransferDialog(false)}><CloseIcon /></IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" id="transfer-form" onSubmit={(e) => handleSubmitTrx(e, setTransferDialog)}>
                        <Stack spacing={2} mt={1}>
                            <FormControl fullWidth size="small">
                                <InputLabel>From Account (Deduct)</InputLabel>
                                <Select
                                    value={trxForm.account_id}
                                    label="From Account (Deduct)"
                                    onChange={(e) => setTrxForm(p => ({ ...p, account_id: e.target.value }))}
                                >
                                    {(accounts || []).map(a => (
                                        <MenuItem key={a.id} value={a.id}>
                                            {a.account_type === 'cash' ? '💵 ' : '🏦 '}
                                            {a.account_name || a.name} ({fmt(a.current_balance)})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <InputLabel>To Account (Deposit)</InputLabel>
                                <Select
                                    value={trxForm.transfer_account_id}
                                    label="To Account (Deposit)"
                                    onChange={(e) => setTrxForm(p => ({ ...p, transfer_account_id: e.target.value }))}
                                >
                                    {(accounts || [])
                                        .filter(a => a.id !== trxForm.account_id)
                                        .map(a => (
                                            <MenuItem key={a.id} value={a.id}>
                                                {a.account_type === 'cash' ? '💵 ' : '🏦 '}
                                                {a.account_name || a.name} ({fmt(a.current_balance)})
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                size="small"
                                label="Transfer Amount (₹)"
                                type="number"
                                required
                                value={trxForm.amount}
                                onChange={(e) => setTrxForm(p => ({ ...p, amount: e.target.value }))}
                            />

                            <TextField
                                fullWidth
                                size="small"
                                label="Date"
                                type="date"
                                required
                                value={trxForm.transaction_date}
                                onChange={(e) => setTrxForm(p => ({ ...p, transaction_date: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                fullWidth
                                size="small"
                                label="Remarks"
                                value={trxForm.description}
                                onChange={(e) => setTrxForm(p => ({ ...p, description: e.target.value }))}
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

            {/* Quick Add Custom Category Dialog (Zero Developer Dependency) */}
            <Dialog
                open={quickCatModal.open}
                onClose={() => setQuickCatModal({ open: false, type: 'expense' })}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                        Add New {quickCatModal.type === 'income' ? 'Income' : 'Expense'} Category
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        This category will be saved to your company accounts permanently.
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        size="small"
                        label="Category Name *"
                        placeholder="e.g. Factory Diesel, Legal Fees, Pooja Expense"
                        value={quickCatName}
                        onChange={(e) => setQuickCatName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveQuickCategory()}
                        sx={{ mt: 1.5 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setQuickCatModal({ open: false, type: 'expense' })}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveQuickCategory}
                        disabled={savingCat || !quickCatName.trim()}
                        sx={{
                            bgcolor: quickCatModal.type === 'income' ? '#10b981' : '#ef4444',
                            '&:hover': { opacity: 0.9 },
                        }}
                    >
                        {savingCat ? 'Saving...' : 'Create Category'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Voucher Slip Modal */}
            <VoucherSlipModal
                open={voucherModal.open}
                onClose={() => setVoucherModal({ open: false, transaction: null })}
                transaction={voucherModal.transaction}
                company={companies?.[0] || {}}
                user={user || {}}
            />

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