import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getProductSummary, getLowStock,
    getCategories, getInventoryReport,
} from '../state/inventorySlice';
import {
    Box, Grid, Card, CardContent, Typography, Paper, Stack,
    Avatar, Chip, Divider, LinearProgress, CircularProgress,
    Table, TableHead, TableRow, TableCell, TableBody,
    TableContainer, Alert,
} from '@mui/material';
import {
    Inventory as InventoryIcon,
    Warning as WarningIcon,
    CheckCircle as OkIcon,
    TrendingUp as ValueIcon,
    Category as CategoryIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

// ── Styled Components ─────────────────────────────────────

const GlassCard = styled(Card)(() => ({
    background: 'rgba(255,255,255,0.95)',
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

// ── Helpers ───────────────────────────────────────────────

const fmt = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const fmtQty = (qty, unit) =>
    `${Number(qty || 0).toFixed(2)} ${unit || ''}`;

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
                            sx={{
                                background: gradient,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
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

// ── Stock Status Badge ────────────────────────────────────

const StockBadge = ({ status }) => {
    const map = {
        in_stock: { color: 'success', label: 'In Stock' },
        low_stock: { color: 'warning', label: 'Low Stock' },
        out_of_stock: { color: 'error', label: 'Out of Stock' },
    };
    const cfg = map[status] || map.in_stock;
    return <Chip label={cfg.label} size="small" color={cfg.color} sx={{ fontWeight: 700 }} />;
};

// ── Main Component ────────────────────────────────────────

const InventoryDashboard = () => {
    const dispatch = useDispatch();
    const {
        productSummary, lowStockItems,
        categories, inventoryReport, isLoading,
    } = useSelector((s) => s.inventory);

    useEffect(() => {
        dispatch(getProductSummary());
        dispatch(getLowStock());
        dispatch(getCategories());
        dispatch(getInventoryReport());
    }, [dispatch]);

    if (isLoading && !productSummary) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={48} />
            </Box>
        );
    }

    const totalProducts = productSummary?.total_products || 0;
    const inStock = productSummary?.in_stock || 0;
    const lowStock = productSummary?.low_stock || 0;
    const outOfStock = productSummary?.out_of_stock || 0;
    const totalValue = productSummary?.total_stock_value || 0;
    const reportProducts = inventoryReport?.products || [];

    return (
        <Box p={3}>

            {/* ══ HEADER ══ */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Paper elevation={0} sx={{
                    p: 3, mb: 4, borderRadius: '20px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h5" fontWeight={700}>
                                📦 Inventory Dashboard
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                Products, Stock aur Valuation ka poora overview
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip label={`${totalProducts} Products`}
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
                            <Chip label={`${categories.length} Categories`}
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
                            {lowStock > 0 && (
                                <Chip
                                    icon={<WarningIcon sx={{ color: '#fff !important', fontSize: 14 }} />}
                                    label={`${lowStock} Low Stock`}
                                    sx={{ bgcolor: 'rgba(255,193,7,0.4)', color: 'white', fontWeight: 700 }}
                                />
                            )}
                        </Stack>
                    </Stack>
                </Paper>
            </motion.div>

            {/* ══ LOW STOCK ALERT ══ */}
            {lowStock > 0 && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Alert
                        severity="warning"
                        icon={<WarningIcon />}
                        sx={{ mb: 3, borderRadius: '14px', fontWeight: 500 }}
                        action={
                            <Chip
                                label={`${lowStock} items`}
                                color="warning"
                                size="small"
                                sx={{ fontWeight: 700 }}
                            />
                        }
                    >
                        <strong>{lowStock} products</strong> ka stock low hai aur{' '}
                        <strong>{outOfStock} products</strong> out of stock hain!
                        Neeche list dekho.
                    </Alert>
                </motion.div>
            )}

            {/* ══ SUMMARY CARDS ══ */}
            <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }} display="block" mb={2}>
                Stock Overview
            </Typography>

            <Grid container spacing={2.5} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                        title="Total Products"
                        value={totalProducts}
                        subtitle={`${categories.length} categories`}
                        icon={<InventoryIcon sx={{ fontSize: 24 }} />}
                        gradient="linear-gradient(135deg, #f093fb, #f5576c)"
                        delay={0}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                        title="In Stock"
                        value={inStock}
                        subtitle="Healthy stock level"
                        icon={<OkIcon sx={{ fontSize: 24 }} />}
                        gradient="linear-gradient(135deg, #11998e, #38ef7d)"
                        delay={0.1}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                        title="Low / Out of Stock"
                        value={`${lowStock} / ${outOfStock}`}
                        subtitle="Reorder needed"
                        icon={<WarningIcon sx={{ fontSize: 24 }} />}
                        gradient="linear-gradient(135deg, #f7971e, #ffd200)"
                        delay={0.2}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                        title="Total Stock Value"
                        value={fmt(totalValue)}
                        subtitle="Avg cost * current stock"
                        icon={<ValueIcon sx={{ fontSize: 24 }} />}
                        gradient="linear-gradient(135deg, #667eea, #764ba2)"
                        delay={0.3}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>

                {/* ══ LOW STOCK ITEMS TABLE ══ */}
                <Grid item xs={12} md={6}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <GlassCard>
                            <CardContent sx={{ p: 0 }}>
                                <Stack direction="row" alignItems="center"
                                    spacing={1.5} sx={{ p: 2.5, pb: 0 }}>
                                    <Avatar sx={{
                                        bgcolor: '#fff3e0', color: '#ed6c02',
                                        width: 36, height: 36,
                                    }}>
                                        <WarningIcon sx={{ fontSize: 18 }} />
                                    </Avatar>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        Low Stock / Out of Stock
                                    </Typography>
                                    {(lowStock + outOfStock) > 0 && (
                                        <Chip
                                            label={lowStock + outOfStock}
                                            size="small" color="warning"
                                            sx={{ fontWeight: 700 }}
                                        />
                                    )}
                                </Stack>
                                <Divider sx={{ mt: 2 }} />

                                {lowStockItems.length === 0 ? (
                                    <Box py={6} textAlign="center">
                                        <Avatar sx={{
                                            width: 64, height: 64,
                                            bgcolor: '#f0fdf4', margin: '0 auto 12px',
                                        }}>
                                            <OkIcon sx={{ fontSize: 36, color: '#2e7d32' }} />
                                        </Avatar>
                                        <Typography variant="body2" color="text.secondary">
                                            Sab products ki stock theek hai! 🎉
                                        </Typography>
                                    </Box>
                                ) : (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                    {['Product', 'Stock', 'Alert', 'Status'].map((h) => (
                                                        <TableCell key={h}
                                                            sx={{ fontWeight: 700, fontSize: 11, py: 1.5 }}>
                                                            {h}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(productSummary?.low_stock_items || []).map((item) => {
                                                    const pct = item.low_stock_alert > 0
                                                        ? Math.min(
                                                            Math.round((item.current_stock / item.low_stock_alert) * 100),
                                                            100
                                                        )
                                                        : 0;
                                                    return (
                                                        <TableRow key={item.id} hover>
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight={600}>
                                                                    {item.name}
                                                                </Typography>
                                                                {item.sku && (
                                                                    <Typography variant="caption"
                                                                        color="text.secondary">
                                                                        {item.sku}
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2"
                                                                    fontWeight={700}
                                                                    color={item.current_stock <= 0
                                                                        ? 'error.main' : 'warning.main'}>
                                                                    {item.current_stock} {item.unit}
                                                                </Typography>
                                                                <LinearProgress
                                                                    variant="determinate"
                                                                    value={pct}
                                                                    color={item.current_stock <= 0
                                                                        ? 'error' : 'warning'}
                                                                    sx={{ mt: 0.5, borderRadius: 4, height: 4 }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="caption"
                                                                    color="text.secondary">
                                                                    Min: {item.low_stock_alert} {item.unit}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <StockBadge status={
                                                                    item.current_stock <= 0
                                                                        ? 'out_of_stock' : 'low_stock'
                                                                } />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </GlassCard>
                    </motion.div>
                </Grid>

                {/* ══ CATEGORIES ══ */}
                <Grid item xs={12} md={6}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <GlassCard sx={{ height: '100%' }}>
                            <CardContent>
                                <Stack direction="row" alignItems="center"
                                    spacing={1.5} mb={2}>
                                    <Avatar sx={{
                                        bgcolor: '#ede7f6', color: '#7b1fa2',
                                        width: 36, height: 36
                                    }}>
                                        <CategoryIcon sx={{ fontSize: 18 }} />
                                    </Avatar>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        Categories
                                    </Typography>
                                    <Chip label={categories.length} size="small"
                                        color="secondary" sx={{ fontWeight: 700 }} />
                                </Stack>
                                <Divider sx={{ mb: 2 }} />

                                {categories.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary"
                                        textAlign="center" py={4}>
                                        Koi category nahi hai abhi
                                    </Typography>
                                ) : (
                                    <Stack spacing={1.5}>
                                        {categories.map((cat) => {
                                            const catProducts = reportProducts.filter(
                                                (p) => p.category === cat.name
                                            );
                                            const catValue = catProducts.reduce(
                                                (s, p) => s + (p.stock_value || 0), 0
                                            );
                                            return (
                                                <Paper key={cat.id} elevation={0} sx={{
                                                    p: 1.5, borderRadius: '12px',
                                                    border: '1.5px solid',
                                                    borderColor: cat.color + '40',
                                                    bgcolor: cat.color + '10',
                                                }}>
                                                    <Stack direction="row"
                                                        justifyContent="space-between"
                                                        alignItems="center">
                                                        <Stack direction="row" spacing={1.5}
                                                            alignItems="center">
                                                            <Box sx={{
                                                                width: 12, height: 12,
                                                                borderRadius: '50%',
                                                                bgcolor: cat.color,
                                                            }} />
                                                            <Box>
                                                                <Typography variant="body2"
                                                                    fontWeight={700}>
                                                                    {cat.name}
                                                                </Typography>
                                                                <Typography variant="caption"
                                                                    color="text.secondary">
                                                                    {cat.products_count || 0} products
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                        <Typography variant="body2"
                                                            fontWeight={700}
                                                            color={cat.color}>
                                                            {fmt(catValue)}
                                                        </Typography>
                                                    </Stack>
                                                </Paper>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </CardContent>
                        </GlassCard>
                    </motion.div>
                </Grid>

                {/* ══ TOP PRODUCTS BY VALUE ══ */}
                <Grid item xs={12}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <GlassCard>
                            <CardContent sx={{ p: 0 }}>
                                <Stack direction="row" alignItems="center"
                                    spacing={1.5} sx={{ p: 2.5, pb: 0 }}>
                                    <Avatar sx={{
                                        bgcolor: '#e8f5e9', color: '#2e7d32',
                                        width: 36, height: 36
                                    }}>
                                        <ValueIcon sx={{ fontSize: 18 }} />
                                    </Avatar>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        Top Products by Stock Value
                                    </Typography>
                                </Stack>
                                <Divider sx={{ mt: 2 }} />

                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                {['#', 'Product', 'Category', 'Stock',
                                                    'Avg Cost', 'Stock Value', 'Status'].map((h) => (
                                                        <TableCell key={h}
                                                            sx={{ fontWeight: 700, fontSize: 11, py: 1.5 }}>
                                                            {h}
                                                        </TableCell>
                                                    ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {[...reportProducts]
                                                .sort((a, b) => b.stock_value - a.stock_value)
                                                .slice(0, 8)
                                                .map((product, i) => (
                                                    <TableRow key={product.id} hover>
                                                        <TableCell>
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                fontWeight={600}
                                                            >
                                                                {String(i + 1).padStart(2, '0')}
                                                            </Typography>
                                                        </TableCell>

                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {product.name}
                                                            </Typography>

                                                            {product.sku && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    SKU: {product.sku}
                                                                </Typography>
                                                            )}
                                                        </TableCell>

                                                        <TableCell>
                                                            {product.category ? (
                                                                <Chip
                                                                    label={product.category}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor:
                                                                            (product.category_color || "#667eea") + "20",
                                                                        color:
                                                                            product.category_color || "#667eea",
                                                                        fontWeight: 600,
                                                                        fontSize: 11,
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Typography variant="caption" color="text.disabled">
                                                                    —
                                                                </Typography>
                                                            )}
                                                        </TableCell>

                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {fmtQty(product.current_stock, product.unit)}
                                                            </Typography>
                                                        </TableCell>

                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {fmt(product.avg_cost)}
                                                            </Typography>
                                                        </TableCell>

                                                        <TableCell>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight={700}
                                                                color="#667eea"
                                                            >
                                                                {fmt(product.stock_value)}
                                                            </Typography>
                                                        </TableCell>

                                                        <TableCell>
                                                            <StockBadge status={product.stock_status} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}

                                            {reportProducts.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                                        <Typography color="text.secondary">
                                                            Koi product nahi hai abhi
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </GlassCard>
                    </motion.div>
                </Grid>

            </Grid>
        </Box>
    );
};

export default InventoryDashboard;
