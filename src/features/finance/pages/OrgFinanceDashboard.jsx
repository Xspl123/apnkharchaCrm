import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Container, Grid, Card, CardContent, Typography, Box, Stack,
    Button, Chip, Paper, Avatar, Table, TableHead, TableRow, TableCell,
    TableBody, TableContainer, LinearProgress, useTheme
} from '@mui/material';
import {
    TrendingUp as InflowIcon,
    TrendingDown as OutflowIcon,
    AccountBalanceWallet as WalletIcon,
    AccountBalance as BankIcon,
    ArrowForward as ArrowIcon,
    Assessment as PnlIcon,
    ReceiptLong as CashbookIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip,
    CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    getOrgAccounts,
    getOrgTransactions,
    getOrgCashflowSummary,
} from '../state/orgFinanceSlice';

const GlassCard = styled(Card)(({ theme }) => ({
    background: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.06)',
    border: `1px solid ${theme.palette.divider}`,
}));

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PIE_COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#0ea5e9', '#10b981', '#ec4899', '#8b5cf6'];

export default function OrgFinanceDashboard() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        accounts = [],
        transactions = [],
        cashflowSummary: rawSummary,
        isLoading,
    } = useSelector((s) => s.orgFinance || {});

    const cashflowSummary = rawSummary || {};

    useEffect(() => {
        dispatch(getOrgAccounts());
        dispatch(getOrgTransactions({ per_page: 500 }));
        dispatch(getOrgCashflowSummary());
    }, [dispatch]);

    // 1. Total Liquid Cash
    const totalLiquidCash = useMemo(() => {
        return (accounts || []).reduce((sum, a) => sum + (parseFloat(a.current_balance) || 0), 0);
    }, [accounts]);

    // 2. Monthly Inflow vs Outflow Data (For Bar Chart)
    const monthlyCashflowData = useMemo(() => {
        const map = {};
        (transactions || []).forEach((t) => {
            if (!t.transaction_date || t.category === 'transfer') return;
            const date = new Date(t.transaction_date);
            if (isNaN(date.getTime())) return;

            const monthKey = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
            if (!map[monthKey]) {
                map[monthKey] = { name: monthKey, Inflow: 0, Outflow: 0, timestamp: date.getTime() };
            }

            const amt = parseFloat(t.amount) || 0;
            if (t.type === 'credit') {
                map[monthKey].Inflow += amt;
            } else if (t.type === 'debit') {
                map[monthKey].Outflow += amt;
            }
        });

        return Object.values(map)
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-6);
    }, [transactions]);

    // 3. Operating Expense Breakdown (For Donut Chart)
    const expenseDonutData = useMemo(() => {
        const catMap = {};
        (transactions || []).forEach((t) => {
            if (t.type !== 'debit' || ['transfer', 'vendor_payment', 'sales_return'].includes(t.category)) {
                return;
            }
            const name = String(t.category || 'Other').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            catMap[name] = (catMap[name] || 0) + (parseFloat(t.amount) || 0);
        });

        return Object.entries(catMap)
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

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
                            📊 Executive Finance Dashboard
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            Real-time Treasury Liquidity, Monthly Cashflow, and Expense Distribution.
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        <Button
                            variant="outlined"
                            startIcon={<CashbookIcon />}
                            onClick={() => navigate('/org/cashbook')}
                            sx={{
                                color: '#ffffff',
                                borderColor: 'rgba(255,255,255,0.3)',
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            Open Cashbook
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<PnlIcon />}
                            onClick={() => navigate('/org/profit-loss')}
                            sx={{
                                bgcolor: '#6366f1',
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontWeight: 700,
                                '&:hover': { bgcolor: '#4f46e5' },
                            }}
                        >
                            View Business P&L
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {isLoading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

            {/* 4 KPI Metric Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard>
                        <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                        Total Liquid Cash
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="#0ea5e9" sx={{ my: 0.5 }}>
                                        {fmt(totalLiquidCash)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Across {(accounts || []).length} active bank & cash accounts
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', width: 44, height: 44 }}>
                                    <WalletIcon />
                                </Avatar>
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard>
                        <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                        Total Money In (Credit)
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="#10b981" sx={{ my: 0.5 }}>
                                        {fmt(cashflowSummary?.total_inflow || 0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Receipts, direct deposits & returns
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: 44, height: 44 }}>
                                    <InflowIcon />
                                </Avatar>
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard>
                        <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                        Total Money Out (Debit)
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="#ef4444" sx={{ my: 0.5 }}>
                                        {fmt(cashflowSummary?.total_outflow || 0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Vendor payouts & operating expenses
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', width: 44, height: 44 }}>
                                    <OutflowIcon />
                                </Avatar>
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard sx={{ border: `2px solid ${Number(cashflowSummary?.net_flow || 0) >= 0 ? '#10b981' : '#ef4444'}` }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                        Net Cashflow Surplus
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        fontWeight={800}
                                        sx={{ my: 0.5, color: Number(cashflowSummary?.net_flow || 0) >= 0 ? '#10b981' : '#ef4444' }}
                                    >
                                        {fmt(cashflowSummary?.net_flow || 0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Net treasury surplus for the period
                                    </Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', width: 44, height: 44 }}>
                                    <BankIcon />
                                </Avatar>
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* Visual Charts Grid */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {/* Chart 1: Monthly Cashflow Bar Chart */}
                <Grid item xs={12} md={7}>
                    <GlassCard sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                📊 Monthly Cashflow Comparison (Inflow vs Outflow)
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                                Comparison of Money Received (+) vs Money Paid Out (−) across months.
                            </Typography>

                            {monthlyCashflowData.length === 0 ? (
                                <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                                    <Typography variant="body2">No monthly transactions recorded yet.</Typography>
                                </Box>
                            ) : (
                                <Box sx={{ width: '100%', height: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyCashflowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                            <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={12} />
                                            <YAxis
                                                stroke={theme.palette.text.secondary}
                                                fontSize={12}
                                                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                                            />
                                            <ChartTooltip
                                                formatter={(value) => [fmt(value)]}
                                                contentStyle={{
                                                    borderRadius: 12,
                                                    background: isDark ? '#1e293b' : '#ffffff',
                                                    border: '1px solid #cbd5e1',
                                                }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: 10 }} />
                                            <Bar dataKey="Inflow" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                                            <Bar dataKey="Outflow" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            )}
                        </CardContent>
                    </GlassCard>
                </Grid>

                {/* Chart 2: Operating Expenses Donut Chart */}
                <Grid item xs={12} md={5}>
                    <GlassCard sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                🍩 Operating Expense Breakdown
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                                Distribution of business overheads (Rent, Salaries, Utilities, etc.)
                            </Typography>

                            {expenseDonutData.length === 0 ? (
                                <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                                    <Typography variant="body2">No operating expenses recorded yet.</Typography>
                                </Box>
                            ) : (
                                <Box sx={{ width: '100%', height: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={expenseDonutData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={95}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {expenseDonutData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <ChartTooltip
                                                formatter={(value) => [fmt(value)]}
                                                contentStyle={{
                                                    borderRadius: 12,
                                                    background: isDark ? '#1e293b' : '#ffffff',
                                                    border: '1px solid #cbd5e1',
                                                }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            )}
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* Bottom Row: Liquid Accounts Strip & Recent Activity */}
            <Grid container spacing={2.5}>
                {/* Account Balances Card */}
                <Grid item xs={12} md={4}>
                    <GlassCard sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                🏦 Account Balances
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                                Live funds available in bank and cash drawers
                            </Typography>

                            <Stack spacing={1.5}>
                                {(accounts || []).map((acc) => (
                                    <Paper
                                        key={acc.id}
                                        variant="outlined"
                                        sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'background.default' }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="body2" fontWeight={700}>
                                                    {acc.account_type === 'cash' ? '💵 ' : '🏦 '}
                                                    {acc.account_name || acc.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {acc.bank_name ? `${acc.bank_name} · ` : ''}
                                                    {acc.account_number ? `A/C: ••••${acc.account_number.slice(-4)}` : 'Cash Drawer'}
                                                </Typography>
                                            </Box>
                                            <Typography variant="subtitle2" fontWeight={800} color="#10b981">
                                                {fmt(acc.current_balance)}
                                            </Typography>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>

                {/* Recent Cashbook Entries Table */}
                <Grid item xs={12} md={8}>
                    <GlassCard sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        🕒 Recent Cashbook Transactions
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Last 5 transactions recorded across accounts
                                    </Typography>
                                </Box>
                                <Button
                                    size="small"
                                    endIcon={<ArrowIcon />}
                                    onClick={() => navigate('/org/cashbook')}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    Full Statement
                                </Button>
                            </Stack>

                            <TableContainer>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: isDark ? '#1e293b' : '#f8fafc' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Voucher #</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Particulars</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(transactions || []).slice(0, 5).map((t) => (
                                            <TableRow key={t.id} hover>
                                                <TableCell sx={{ fontSize: 12 }}>{t.transaction_date}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={t.voucher_no || `TX-${t.id}`}
                                                        size="small"
                                                        sx={{
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            bgcolor: t.type === 'credit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                            color: t.type === 'credit' ? '#059669' : '#dc2626',
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>
                                                    {t.description || 'Transaction'}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: t.type === 'credit' ? '#10b981' : '#ef4444',
                                                    }}
                                                >
                                                    {t.type === 'credit' ? `+${fmt(t.amount)}` : `-${fmt(t.amount)}`}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>
        </Container>
    );
}