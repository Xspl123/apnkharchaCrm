import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
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
    FactCheck as FactCheckIcon,
    Print as PrintIcon,
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
        return Number(selectedAccount?.balance || 0);
    }, [selectedAccount]);

    useEffect(() => {
        if (statementBalanceInput === '' && bookBalance !== 0) {
            setStatementBalanceInput(String(bookBalance));
        }
    }, [bookBalance, statementBalanceInput]);

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
            message: status ? 'All transactions marked as Cleared!' : 'All transactions marked as Uncleared!',
            severity: 'info',
        });
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', minimumFractionDigits: 2,
        }).format(val || 0);
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
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
                <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <IconButton onClick={() => navigate('/org/cashbook')} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                            <BackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                Bank Reconciliation Statement (BRS)
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
                    <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ borderRadius: '10px', textTransform: 'none', bgcolor: '#0284c7' }}>
                        Print BRS Statement
                    </Button>
                </Stack>
            </Stack>

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
                                            <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(acc.balance)}</span>
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
