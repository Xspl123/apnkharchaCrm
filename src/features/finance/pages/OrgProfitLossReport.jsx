import React, { useState, useEffect } from 'react';
import {
    Container, Grid, Card, CardContent, Typography, Box, Stack,
    Button, Chip, Table, TableHead, TableRow, TableCell,
    TableBody, TableContainer, TextField, Paper,
    IconButton, LinearProgress, useTheme
} from '@mui/material';
import {
    Print as PrintIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axiosClient from '../../../api/axiosClient';

const GlassCard = styled(Card)(({ theme }) => ({
    background: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.06)',
    border: `1px solid ${theme.palette.divider}`,
}));

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrgProfitLossReport() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [loading, setLoading] = useState(false);
    const [pnlData, setPnlData] = useState(null);

    // Filter Dates
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate]     = useState('');
    const [activePreset, setActivePreset] = useState('all');

    const fetchPnL = async (from = fromDate, to = toDate) => {
        setLoading(true);
        try {
            const params = {};
            if (from) params.from_date = from;
            if (to)   params.to_date   = to;

            const res = await axiosClient.get('/reports/profit-loss', { params });
            setPnlData(res.data?.data || null);
        } catch (err) {
            console.error('Failed to load P&L data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPnL();
    }, []);

    // Quick Date Presets
    const handlePresetChange = (preset) => {
        setActivePreset(preset);
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        let f = '';
        let t = now.toISOString().split('T')[0];

        if (preset === 'this_month') {
            f = new Date(year, month, 1).toISOString().split('T')[0];
        } else if (preset === 'last_month') {
            f = new Date(year, month - 1, 1).toISOString().split('T')[0];
            t = new Date(year, month, 0).toISOString().split('T')[0];
        } else if (preset === 'this_fy') {
            const fyStartYear = month >= 3 ? year : year - 1;
            f = `${fyStartYear}-04-01`;
            t = `${fyStartYear + 1}-03-31`;
        } else {
            f = '';
            t = '';
        }

        setFromDate(f);
        setToDate(t);
        fetchPnL(f, t);
    };

    const handlePrint = () => {
        window.print();
    };

    const revenue   = pnlData?.revenue || {};
    const cogs      = pnlData?.cogs || {};
    const gp        = pnlData?.gross_profit || {};
    const opExpense = pnlData?.operating_expenses || {};
    const otherInc  = pnlData?.other_income || {};
    const np        = pnlData?.net_profit || {};

    const isNetProfit = Number(np.amount || 0) >= 0;

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #pnl-statement-print, #pnl-statement-print * { visibility: visible !important; }
                    #pnl-statement-print {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 16px !important;
                    }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* Header Banner */}
            <Paper
                elevation={0}
                className="no-print"
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
                            📈 Business Profit & Loss Statement (P&L)
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            Company Trading, COGS, Gross Margin & Net Profit Summary from Invoices & Purchases.
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                        <Button
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={handlePrint}
                            sx={{
                                color: '#ffffff',
                                borderColor: 'rgba(255,255,255,0.3)',
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            Print / Save PDF
                        </Button>
                        <IconButton
                            onClick={() => fetchPnL(fromDate, toDate)}
                            sx={{ color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Stack>
                </Stack>
            </Paper>

            {/* Date Filters & Presets Bar */}
            <GlassCard sx={{ mb: 3 }} className="no-print">
                <CardContent sx={{ p: 2 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {[
                                { key: 'all',        label: 'All Time' },
                                { key: 'this_month', label: 'This Month' },
                                { key: 'last_month', label: 'Last Month' },
                                { key: 'this_fy',    label: 'FY 2026-27' },
                            ].map(p => (
                                <Chip
                                    key={p.key}
                                    label={p.label}
                                    onClick={() => handlePresetChange(p.key)}
                                    color={activePreset === p.key ? 'primary' : 'default'}
                                    variant={activePreset === p.key ? 'filled' : 'outlined'}
                                    sx={{ fontWeight: 600, cursor: 'pointer' }}
                                />
                            ))}
                        </Stack>

                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <TextField
                                size="small"
                                type="date"
                                label="From Date"
                                value={fromDate}
                                onChange={(e) => { setFromDate(e.target.value); setActivePreset('custom'); }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 145 }}
                            />
                            <TextField
                                size="small"
                                type="date"
                                label="To Date"
                                value={toDate}
                                onChange={(e) => { setToDate(e.target.value); setActivePreset('custom'); }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 145 }}
                            />
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => fetchPnL(fromDate, toDate)}
                                sx={{ borderRadius: '10px', height: 40 }}
                            >
                                Apply
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </GlassCard>

            {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

            {/* Executive 4-KPI Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                Net Sales Revenue
                            </Typography>
                            <Typography variant="h5" fontWeight={800} color="#10b981" sx={{ my: 0.5 }}>
                                {fmt(revenue.net_sales_taxable)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {revenue.gross_sales_count || 0} Invoices (Gross: {fmt(revenue.gross_sales_taxable)})
                            </Typography>
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                Cost of Goods (COGS)
                            </Typography>
                            <Typography variant="h5" fontWeight={800} color="#f59e0b" sx={{ my: 0.5 }}>
                                {fmt(cogs.net_purchases_taxable)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {cogs.gross_purchases_count || 0} Purchases (Gross: {fmt(cogs.gross_purchases_taxable)})
                            </Typography>
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                Gross Profit (Margin)
                            </Typography>
                            <Typography variant="h5" fontWeight={800} color="#6366f1" sx={{ my: 0.5 }}>
                                {fmt(gp.amount)}
                            </Typography>
                            <Typography variant="caption" fontWeight={700} color="#6366f1">
                                Gross Margin: {gp.margin_percent || 0}%
                            </Typography>
                        </CardContent>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <GlassCard sx={{ border: `2px solid ${isNetProfit ? '#10b981' : '#ef4444'}` }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                Net Profit / (Loss)
                            </Typography>
                            <Typography variant="h5" fontWeight={800} sx={{ my: 0.5, color: isNetProfit ? '#10b981' : '#ef4444' }}>
                                {fmt(np.amount)}
                            </Typography>
                            <Typography variant="caption" fontWeight={700} sx={{ color: isNetProfit ? '#10b981' : '#ef4444' }}>
                                Net Margin: {np.margin_percent || 0}%
                            </Typography>
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* Printable Formal P&L Statement Table */}
            <div id="pnl-statement-print">
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 4 },
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                    }}
                >
                    <Box sx={{ textAlign: 'center', pb: 2.5, mb: 3, borderBottom: '2px solid #334155' }}>
                        <Typography variant="h5" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                            Krudracx (Apna Kharcha Services)
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mt: 0.5 }}>
                            BUSINESS PROFIT & LOSS STATEMENT
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            For Period: {pnlData?.period?.from_date || 'Inception'} to {pnlData?.period?.to_date || 'Today'} · (Figures in INR ₹)
                        </Typography>
                    </Box>

                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: isDark ? '#1e293b' : '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Particulars / Ledger Head</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="right">Details (₹)</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="right">Amount (₹)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* PART I: REVENUE FROM OPERATIONS */}
                                <TableRow sx={{ bgcolor: 'rgba(16, 185, 129, 0.05)' }}>
                                    <TableCell colSpan={3} sx={{ fontWeight: 800, color: '#10b981', fontSize: 13 }}>
                                        I. REVENUE FROM OPERATIONS (SALES)
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ pl: 4 }}>Gross Sales (Taxable Invoice Turnover)</TableCell>
                                    <TableCell align="right">{fmt(revenue.gross_sales_taxable)}</TableCell>
                                    <TableCell align="right">—</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ pl: 4, color: 'text.secondary' }}>Less: Sales Returns & Credit Allowances</TableCell>
                                    <TableCell align="right" sx={{ color: '#ef4444' }}>({fmt(revenue.sales_returns_taxable)})</TableCell>
                                    <TableCell align="right">—</TableCell>
                                </TableRow>
                                <TableRow sx={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <TableCell sx={{ pl: 4, fontWeight: 700 }}>Total Net Revenue from Operations (A)</TableCell>
                                    <TableCell align="right">—</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: '#10b981' }}>{fmt(revenue.net_sales_taxable)}</TableCell>
                                </TableRow>

                                {/* PART II: COST OF GOODS SOLD */}
                                <TableRow sx={{ bgcolor: 'rgba(245, 158, 11, 0.05)' }}>
                                    <TableCell colSpan={3} sx={{ fontWeight: 800, color: '#f59e0b', fontSize: 13, pt: 2 }}>
                                        II. COST OF GOODS SOLD (PURCHASES & DIRECT COSTS)
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ pl: 4 }}>Gross Purchases (Vendor Purchase Orders)</TableCell>
                                    <TableCell align="right">{fmt(cogs.gross_purchases_taxable)}</TableCell>
                                    <TableCell align="right">—</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ pl: 4, color: 'text.secondary' }}>Less: Purchase Returns & Debit Allowances</TableCell>
                                    <TableCell align="right" sx={{ color: '#10b981' }}>({fmt(cogs.purchase_returns_taxable)})</TableCell>
                                    <TableCell align="right">—</TableCell>
                                </TableRow>
                                <TableRow sx={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <TableCell sx={{ pl: 4, fontWeight: 700 }}>Total Cost of Sales (COGS) (B)</TableCell>
                                    <TableCell align="right">—</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: '#f59e0b' }}>{fmt(cogs.net_purchases_taxable)}</TableCell>
                                </TableRow>

                                {/* GROSS PROFIT */}
                                <TableRow sx={{ bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff' }}>
                                    <TableCell sx={{ fontWeight: 800, fontSize: 14 }}>
                                        GROSS PROFIT / (LOSS) (A − B)
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Margin: {gp.margin_percent || 0}%</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: 15, color: '#6366f1' }}>
                                        {fmt(gp.amount)}
                                    </TableCell>
                                </TableRow>

                                {/* PART III: OPERATING EXPENSES */}
                                <TableRow sx={{ bgcolor: 'rgba(239, 68, 68, 0.05)' }}>
                                    <TableCell colSpan={3} sx={{ fontWeight: 800, color: '#ef4444', fontSize: 13, pt: 2 }}>
                                        III. OPERATING EXPENSES (INDIRECT OVERHEADS)
                                    </TableCell>
                                </TableRow>
                                {(opExpense.items || []).length === 0 ? (
                                    <TableRow>
                                        <TableCell sx={{ pl: 4, color: 'text.secondary' }}>No indirect expenses recorded</TableCell>
                                        <TableCell align="right">₹0.00</TableCell>
                                        <TableCell align="right">—</TableCell>
                                    </TableRow>
                                ) : (
                                    (opExpense.items || []).map((exp) => (
                                        <TableRow key={exp.category}>
                                            <TableCell sx={{ pl: 4 }}>{exp.name} ({exp.count} entries)</TableCell>
                                            <TableCell align="right">{fmt(exp.total_amount)}</TableCell>
                                            <TableCell align="right">—</TableCell>
                                        </TableRow>
                                    ))
                                )}
                                <TableRow sx={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <TableCell sx={{ pl: 4, fontWeight: 700 }}>Total Operating Expenses (C)</TableCell>
                                    <TableCell align="right">—</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: '#ef4444' }}>
                                        {fmt(opExpense.total)}
                                    </TableCell>
                                </TableRow>

                                {/* PART IV: OTHER INCOMES */}
                                <TableRow sx={{ bgcolor: 'rgba(14, 165, 233, 0.05)' }}>
                                    <TableCell colSpan={3} sx={{ fontWeight: 800, color: '#0ea5e9', fontSize: 13, pt: 2 }}>
                                        IV. OTHER INCOMES (INDIRECT INFLOWS)
                                    </TableCell>
                                </TableRow>
                                {(otherInc.items || []).length === 0 ? (
                                    <TableRow>
                                        <TableCell sx={{ pl: 4, color: 'text.secondary' }}>No other incomes recorded</TableCell>
                                        <TableCell align="right">₹0.00</TableCell>
                                        <TableCell align="right">—</TableCell>
                                    </TableRow>
                                ) : (
                                    (otherInc.items || []).map((inc) => (
                                        <TableRow key={inc.category}>
                                            <TableCell sx={{ pl: 4 }}>{inc.name} ({inc.count} entries)</TableCell>
                                            <TableCell align="right">{fmt(inc.total_amount)}</TableCell>
                                            <TableCell align="right">—</TableCell>
                                        </TableRow>
                                    ))
                                )}
                                <TableRow sx={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <TableCell sx={{ pl: 4, fontWeight: 700 }}>Total Other Incomes (D)</TableCell>
                                    <TableCell align="right">—</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: '#0ea5e9' }}>
                                        {fmt(otherInc.total)}
                                    </TableCell>
                                </TableRow>

                                {/* PART V: NET PROFIT */}
                                <TableRow sx={{ bgcolor: isNetProfit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
                                    <TableCell sx={{ fontWeight: 900, fontSize: 15 }}>
                                        NET PROFIT / (NET LOSS) FOR THE PERIOD (Gross Profit − C + D)
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>Net Margin: {np.margin_percent || 0}%</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 900, fontSize: 16, color: isNetProfit ? '#10b981' : '#ef4444' }}>
                                        {fmt(np.amount)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Signatures */}
                    <Box sx={{ pt: 6, pb: 2 }}>
                        <Stack direction="row" justifyContent="space-between" spacing={4} sx={{ textAlign: 'center' }}>
                            <Box sx={{ flex: 1, borderTop: '1px dashed #64748b', pt: 1 }}>
                                <Typography variant="caption" fontWeight={700} display="block">Prepared By</Typography>
                                <Typography variant="caption" color="text.secondary">Accountant / Staff</Typography>
                            </Box>
                            <Box sx={{ flex: 1, borderTop: '1px dashed #64748b', pt: 1 }}>
                                <Typography variant="caption" fontWeight={700} display="block">Verified By</Typography>
                                <Typography variant="caption" color="text.secondary">Internal Auditor / CA</Typography>
                            </Box>
                            <Box sx={{ flex: 1, borderTop: '1px dashed #64748b', pt: 1 }}>
                                <Typography variant="caption" fontWeight={700} display="block">Authorized Signatory</Typography>
                                <Typography variant="caption" color="text.secondary">Managing Director / Partner</Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Paper>
            </div>
        </Container>
    );
}