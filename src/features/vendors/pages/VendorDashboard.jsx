import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getVendorSummary, getPOSummary } from '../state/vendorSlice';
import {
    Box, Grid, Card, CardContent, Typography, Paper, Stack,
    CircularProgress, Divider, Chip, Avatar, LinearProgress,
} from '@mui/material';
import {
    Business, ShoppingCart, CheckCircle, HourglassEmpty,
    LocalShipping, Cancel, AccountBalance,
    Paid, MoneyOff, ReplyAll,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

// ── Styled Components ─────────────────────────────────────

const GlassCard = styled(Card)(() => ({
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.3)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
    },
}));

// ── Summary Card ──────────────────────────────────────────

const SummaryCard = ({ title, value, subtitle, icon, gradient, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
    >
        <GlassCard>
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="caption" color="text.secondary"
                            sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={800} mt={0.5}
                            sx={{ background: gradient, WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent' }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Avatar sx={{
                        width: 52, height: 52,
                        background: gradient,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}>
                        {icon}
                    </Avatar>
                </Stack>
            </CardContent>
        </GlassCard>
    </motion.div>
);

// ── PO Status Card (Updated for Returned) ─────────────────

const POStatusCard = ({ label, count, color, icon, total }) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    
    // Special styling for returned status
    const isReturned = label === 'Returned';
    const cardSx = isReturned ? {
        borderColor: '#ff9800',
        bgcolor: '#fff3e0',
    } : {};
    
    return (
        <Paper elevation={0} sx={{
            p: 2, borderRadius: '14px',
            border: '1.5px solid', 
            borderColor: `${color}.light`,
            bgcolor: `${color}.lighter`,
            ...cardSx
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32, bgcolor: `${color}.main` }}>
                        {icon}
                    </Avatar>
                    <Typography variant="body2" fontWeight={700} color={`${color}.dark`}>
                        {label}
                    </Typography>
                </Stack>
                <Typography variant="h5" fontWeight={800} color={`${color}.main`}>
                    {count}
                </Typography>
            </Stack>
            <LinearProgress
                variant="determinate"
                value={pct}
                color={color}
                sx={{ borderRadius: 4, height: 6 }}
            />
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                {pct}% of total orders
            </Typography>
        </Paper>
    );
};

// ── Currency Format ───────────────────────────────────────

const fmt = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ── Main Component ────────────────────────────────────────

const VendorDashboard = () => {
    const dispatch = useDispatch();
    const { vendorSummary, poSummary, isLoading } = useSelector((s) => s.vendors);

    useEffect(() => {
        dispatch(getVendorSummary());
        dispatch(getPOSummary());
    }, [dispatch]);

    if (isLoading && !vendorSummary) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={48} />
            </Box>
        );
    }

    const returnedCount = poSummary?.returned || poSummary?.return || 0;
    const returnedAmount = poSummary?.returned_amount || poSummary?.return_amount || 0;
    const totalPaid = poSummary?.total_paid ?? vendorSummary?.total_paid ?? 0;
    const rawTotalAmount = poSummary?.total_amount ?? vendorSummary?.total_purchases ?? 0;

    // Updated to include returned in total
    const totalPOs = poSummary
        ? (poSummary.pending + poSummary.approved + poSummary.received + 
           returnedCount + poSummary.cancelled)
        : 0;

    // Calculate net purchases after returns
    const netPurchases = rawTotalAmount
        ? (rawTotalAmount - returnedAmount)
        : 0;

    const adjustedBalance = Math.max(netPurchases - totalPaid, 0);
    const adjustedAdvance = Math.max(totalPaid - netPurchases, 0);

    // Payment progress percentage based on net purchases
    const paymentPct = netPurchases > 0
        ? Math.round((totalPaid / netPurchases) * 100)
        : 0;

    return (
        <Box p={3}>

            {/* ── Page Header ── */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Paper elevation={0} sx={{
                    p: 3, mb: 4, borderRadius: '20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h5" fontWeight={700}>
                                🏭 Vendor Dashboard
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                                Vendors, Purchase Orders aur Payments ka overview
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                            <Chip
                                label={`${vendorSummary?.active_vendors || 0} Active Vendors`}
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                            />
                            <Chip
                                label={`${totalPOs || poSummary?.total_orders || 0} Total POs`}
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                            />
                            {returnedCount > 0 && (
                                <Chip
                                    label={`${returnedCount} Returned`}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                                />
                            )}
                        </Stack>
                    </Stack>
                </Paper>
            </motion.div>

            {/* ── Vendor Summary Cards ── */}
            <Typography variant="subtitle1" fontWeight={700} mb={2} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 12 }}>
                Vendor Overview
            </Typography>

            <Grid container spacing={2.5} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                        title="Total Vendors"
                        value={vendorSummary?.total_vendors || 0}
                        subtitle={`${vendorSummary?.active_vendors || 0} active, ${vendorSummary?.inactive_vendors || 0} inactive`}
                        icon={<Business sx={{ fontSize: 26 }} />}
                        gradient="linear-gradient(135deg, #667eea, #764ba2)"
                        delay={0}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                        title="Net Purchases"
                        value={fmt(netPurchases)}
                        subtitle={returnedAmount > 0 ? `After ${fmt(returnedAmount)} returns` : 'Approved + Received POs'}
                        icon={<ShoppingCart sx={{ fontSize: 26 }} />}
                        gradient="linear-gradient(135deg, #11998e, #38ef7d)"
                        delay={0.1}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                        title="Total Paid"
                        value={fmt(totalPaid)}
                        subtitle="Vendors ko diya gaya"
                        icon={<Paid sx={{ fontSize: 26 }} />}
                        gradient="linear-gradient(135deg, #1976d2, #42a5f5)"
                        delay={0.2}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                        title="Balance Due"
                        value={fmt(adjustedBalance)}
                        subtitle={adjustedAdvance > 0 ? `Advance paid ${fmt(adjustedAdvance)}` : 'Vendors ko dena baaki'}
                        icon={<MoneyOff sx={{ fontSize: 26 }} />}
                        gradient="linear-gradient(135deg, #f43f5e, #fb7185)"
                        delay={0.3}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                        title="Returned Value"
                        value={fmt(returnedAmount)}
                        subtitle={`${returnedCount} returned PO${returnedCount === 1 ? '' : 's'}`}
                        icon={<ReplyAll sx={{ fontSize: 26 }} />}
                        gradient="linear-gradient(135deg, #f59e0b, #fbbf24)"
                        delay={0.4}
                    />
                </Grid>
            </Grid>

            {/* ── PO Summary + Status (Updated with Returned) ── */}
            <Grid container spacing={3} mb={4}>

                {/* PO Summary Cards - Now includes Returned */}
                <Grid item xs={12} md={7}>
                    <Typography variant="subtitle1" fontWeight={700} mb={2} color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 12 }}>
                        Purchase Orders Status
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <POStatusCard
                                label="Pending"
                                count={poSummary?.pending || 0}
                                color="warning"
                                icon={<HourglassEmpty sx={{ fontSize: 16 }} />}
                                total={totalPOs}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <POStatusCard
                                label="Approved"
                                count={poSummary?.approved || 0}
                                color="info"
                                icon={<CheckCircle sx={{ fontSize: 16 }} />}
                                total={totalPOs}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <POStatusCard
                                label="Received"
                                count={poSummary?.received || 0}
                                color="success"
                                icon={<LocalShipping sx={{ fontSize: 16 }} />}
                                total={totalPOs}
                            />
                        </Grid>
                        {/* NEW: Returned Status Card */}
                        <Grid item xs={12} sm={6} md={4}>
                            <POStatusCard
                                label="Returned"
                                count={returnedCount}
                                color="secondary"
                                icon={<ReplyAll sx={{ fontSize: 16 }} />}
                                total={totalPOs}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <POStatusCard
                                label="Cancelled"
                                count={poSummary?.cancelled || 0}
                                color="error"
                                icon={<Cancel sx={{ fontSize: 16 }} />}
                                total={totalPOs}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* Payment Progress - Updated with Returns Info */}
                <Grid item xs={12} md={5}>
                    <Typography variant="subtitle1" fontWeight={700} mb={2} color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 12 }}>
                        Payment & Returns Overview
                    </Typography>
                    <GlassCard sx={{ height: 'calc(100% - 32px)' }}>
                        <CardContent sx={{ p: 3 }}>

                            {/* Total PO Value */}
                            <Stack direction="row" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                    Total PO Value
                                </Typography>
                                    <Typography variant="body2" fontWeight={700}>
                                    {fmt(rawTotalAmount)}
                                </Typography>
                            </Stack>

                            {/* Show Returned Amount if any */}
                            {(returnedAmount > 0 || returnedCount > 0) && (
                                <>
                                    <Stack direction="row" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            Returned Value
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700} color="error.main">
                                            -{fmt(returnedAmount)}
                                        </Typography>
                                    </Stack>
                                    <Divider sx={{ my: 1 }} />
                                    <Stack direction="row" justifyContent="space-between" mb={2}>
                                        <Typography variant="body2" fontWeight={600}>
                                            Net Purchases
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700} color="primary.main">
                                            {fmt(netPurchases)}
                                        </Typography>
                                    </Stack>
                                </>
                            )}

                            {/* Progress Bar */}
                            <Box sx={{ position: 'relative', mb: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={paymentPct}
                                    sx={{
                                        height: 14, borderRadius: 7,
                                        bgcolor: '#fee2e2',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 7,
                                            background: 'linear-gradient(90deg, #11998e, #38ef7d)',
                                        },
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: 'absolute',
                                        top: '50%', left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        fontWeight: 700, fontSize: 10, color: '#0f172a',
                                    }}
                                >
                                    {paymentPct}% Paid
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Paid */}
                            <Stack direction="row" justifyContent="space-between" mb={1.5}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Box sx={{
                                        width: 10, height: 10, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #11998e, #38ef7d)',
                                    }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Total Paid
                                    </Typography>
                                </Stack>
                                <Typography variant="body2" fontWeight={700} color="success.main">
                                    {fmt(totalPaid)}
                                </Typography>
                            </Stack>

                            {/* Balance */}
                            <Stack direction="row" justifyContent="space-between" mb={1.5}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Box sx={{
                                        width: 10, height: 10, borderRadius: '50%',
                                        bgcolor: '#fee2e2',
                                        border: '2px solid #f43f5e',
                                    }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Balance Due
                                    </Typography>
                                </Stack>
                                <Typography variant="body2" fontWeight={700} color="error.main">
                                    {fmt(adjustedBalance)}
                                </Typography>
                            </Stack>

                            {adjustedAdvance > 0 && (
                                <Stack direction="row" justifyContent="space-between" mb={1.5}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Box sx={{
                                            width: 10, height: 10, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                                        }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Advance Paid
                                        </Typography>
                                    </Stack>
                                    <Typography variant="body2" fontWeight={700} color="warning.main">
                                        {fmt(adjustedAdvance)}
                                    </Typography>
                                </Stack>
                            )}

                            {/* Show Returned Orders Chip */}
                            {returnedCount > 0 && (
                                <Chip 
                                    label={`${returnedCount} Order${returnedCount > 1 ? 's' : ''} Returned`}
                                    color="secondary"
                                    size="small"
                                    icon={<ReplyAll sx={{ fontSize: 14 }} />}
                                    sx={{ mt: 1, width: '100%', fontWeight: 600 }}
                                />
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* Total Orders */}
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                    Total Orders
                                </Typography>
                                <Chip
                                    label={poSummary?.total_orders || 0}
                                    size="small"
                                    color="primary"
                                    sx={{ fontWeight: 700 }}
                                />
                            </Stack>
                        </CardContent>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* ── Quick Links ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Paper elevation={1} sx={{ p: 2.5, borderRadius: '16px' }}>
                    <Typography variant="subtitle2" color="text.secondary" mb={2}
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                        Quick Actions
                    </Typography>
                    <Grid container spacing={2}>
                        {[
                            {
                                label: 'Vendors Manage Karo',
                                sub: 'Add, edit ya delete vendors',
                                icon: <Business />,
                                href: '/vendors/list',
                                gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
                            },
                            {
                                label: 'Purchase Orders',
                                sub: 'New PO banao ya existing dekho',
                                icon: <ShoppingCart />,
                                href: '/vendors/purchase-orders',
                                gradient: 'linear-gradient(135deg, #11998e, #38ef7d)',
                            },
                            {
                                label: 'Payments Track Karo',
                                sub: 'Vendor payments ka record',
                                icon: <AccountBalance />,
                                href: '/vendors/payments',
                                gradient: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                            },
                        ].map((item, i) => (
                            <Grid item xs={12} sm={4} key={i}>
                                <Paper
                                    component="a"
                                    href={item.href}
                                    elevation={0}
                                    sx={{
                                        p: 2, borderRadius: '14px', display: 'block',
                                        border: '1.5px solid', borderColor: 'divider',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 20px rgba(102,126,234,0.15)',
                                        },
                                    }}
                                >
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{
                                            background: item.gradient,
                                            width: 44, height: 44,
                                        }}>
                                            {item.icon}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={700} color="text.primary">
                                                {item.label}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.sub}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            </motion.div>

        </Box>
    );
};

export default VendorDashboard;
