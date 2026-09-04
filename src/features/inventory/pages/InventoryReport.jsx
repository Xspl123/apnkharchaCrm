import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getInventoryReport, getCategories, reset,
} from '../state/inventorySlice';
import {
    Box, Container, Grid, Card, CardContent, Typography, Paper,
    Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
    TablePagination, TextField, Button, IconButton, Chip, Stack,
    Avatar, Divider, LinearProgress, CircularProgress,
    Select, MenuItem, InputAdornment, Tooltip, Zoom,
} from '@mui/material';
import {
    Refresh as RefreshIcon, Search as SearchIcon,
    Clear as ClearIcon, Download as DownloadIcon,
    TrendingUp as ValueIcon, Inventory as StockIcon,
    Warning as WarningIcon, Cancel as OutIcon,
    FilterList as FilterIcon,
    Category as CategoryIcon, Print as PrintIcon,
    PieChart as PieChartIcon,
    BarChart as BarChartIcon,
    ShowChart as LineChartIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

// Chart imports
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    Line, Area, AreaChart, ComposedChart
} from 'recharts';

// ── Styled ────────────────────────────────────────────────

const GlassCard = styled(Card)(() => ({
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.3)',
}));

const GradientButton = styled(Button)(({ gradient }) => ({
    background: gradient || 'linear-gradient(135deg,#667eea,#764ba2)',
    color: 'white', fontWeight: 600, borderRadius: '12px',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(102,126,234,0.2)',
    '&:hover': { transform: 'scale(1.02)', opacity: 0.95 },
}));

const StyledRow = styled(TableRow)(({ stockstatus }) => ({
    transition: 'all 0.2s',
    backgroundColor:
        stockstatus === 'out_of_stock' ? 'rgba(239,68,68,0.04)'  :
        stockstatus === 'low_stock'    ? 'rgba(237,108,2,0.04)'  : 'transparent',
    '&:hover': {
        backgroundColor:
            stockstatus === 'out_of_stock' ? 'rgba(239,68,68,0.08)'  :
            stockstatus === 'low_stock'    ? 'rgba(237,108,2,0.08)'  :
            'rgba(102,126,234,0.04)',
    },
}));

const ChartCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2.5),
    borderRadius: '16px',
    background: 'white',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    border: '1px solid #f0f0f0',
    height: '100%',
    transition: 'all 0.3s ease',
    '&:hover': {
        boxShadow: '0 8px 30px rgba(102,126,234,0.1)',
        borderColor: '#667eea40',
    },
}));

// ── Helpers ───────────────────────────────────────────────

const fmt    = (v) => `₹${Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
const fmtQty = (q,u) => `${Number(q||0).toFixed(2)} ${u||''}`;

const STOCK_STATUS = {
    in_stock:    { color: 'success', label: 'In Stock',     hex: '#2e7d32', light: '#e8f5e8' },
    low_stock:   { color: 'warning', label: 'Low Stock',    hex: '#ed6c02', light: '#fff4e5' },
    out_of_stock:{ color: 'error',   label: 'Out of Stock', hex: '#ef4444', light: '#fee8e8' },
};

const CHART_COLORS = ['#667eea', '#764ba2', '#11998e', '#38ef7d', '#f7971e', '#ffd200', '#f5576c', '#f093fb'];

// ── Summary Card ──────────────────────────────────────────

const SummaryCard = ({ title, value, subtitle, icon, gradient, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
    >
        <GlassCard>
            <CardContent sx={{ p: 2.5 }}>
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
                            <Typography variant="caption" color="text.secondary" display="block" mt={0.3}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Avatar sx={{ width: 48, height: 48, background: gradient,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
                        {icon}
                    </Avatar>
                </Stack>
            </CardContent>
        </GlassCard>
    </motion.div>
);

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════

const InventoryReport = () => {
    const dispatch = useDispatch();
    const { inventoryReport, categories, isLoading } =
        useSelector((s) => s.inventory);

    // ── State ─────────────────────────────────────────────
    const [loading, setLoading]         = useState(false);
    const [searchQuery, setSearch]      = useState('');
    const [categoryFilter, setCategory] = useState('all');
    const [statusFilter, setStatus]     = useState('all');
    const [sortBy, setSortBy]           = useState('stock_value');
    const [sortDir, setSortDir]         = useState('desc');
    const [page, setPage]               = useState(0);
    const [rowsPerPage, setRows]        = useState(15);
    const [chartType, setChartType]     = useState('pie'); // pie, bar, area, radial

    // ── Effects ───────────────────────────────────────────

    const loadData = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            await Promise.all([
                dispatch(getInventoryReport(params)),
                dispatch(getCategories()),
            ]);
        } finally { setLoading(false); }
    }, [dispatch]);

    useEffect(() => {
        loadData();
        return () => { dispatch(reset()); };
    }, [dispatch, loadData]);

    const handleApplyFilter = () => {
        const params = {};
        if (categoryFilter !== 'all') params.category_id = categoryFilter;
        loadData(params);
    };

    // ── Sort ──────────────────────────────────────────────

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDir('desc');
        }
    };

    const SortIcon = ({ field }) => (
        <Typography variant="caption" sx={{ ml: 0.5, opacity: sortBy === field ? 1 : 0.3 }}>
            {sortBy === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </Typography>
    );

    // ── Filter & Sort Products ────────────────────────────

    const products = inventoryReport?.products || [];

    const filtered = products
        .filter((p) => {
            const q = searchQuery.toLowerCase();
            const matchSearch =
                p.name?.toLowerCase().includes(q) ||
                p.sku?.toLowerCase().includes(q)  ||
                p.category?.toLowerCase().includes(q);
            const matchCat    = categoryFilter === 'all' || p.category === categories.find((c) => String(c.id) === categoryFilter)?.name;
            const matchStatus = statusFilter === 'all' || p.stock_status === statusFilter;
            return matchSearch && matchCat && matchStatus;
        })
        .sort((a, b) => {
            const dir = sortDir === 'asc' ? 1 : -1;
            if (sortBy === 'name')          return dir * a.name.localeCompare(b.name);
            if (sortBy === 'stock_value')   return dir * ((a.stock_value   || 0) - (b.stock_value   || 0));
            if (sortBy === 'current_stock') return dir * ((a.current_stock || 0) - (b.current_stock || 0));
            if (sortBy === 'avg_cost')      return dir * ((a.avg_cost      || 0) - (b.avg_cost      || 0));
            return 0;
        });

    const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // ── Summary ───────────────────────────────────────────

    const summary = inventoryReport?.summary || {};
    const filteredValue = filtered.reduce((s, p) => s + (p.stock_value || 0), 0);

    // ── Category Breakdown ────────────────────────────────

    const categoryBreakdown = categories.map((cat) => {
        const catProducts = products.filter((p) => p.category === cat.name);
        return {
            ...cat,
            count:      catProducts.length,
            totalValue: catProducts.reduce((s, p) => s + (p.stock_value || 0), 0),
            lowStock:   catProducts.filter((p) => p.stock_status === 'low_stock').length,
            outStock:   catProducts.filter((p) => p.stock_status === 'out_of_stock').length,
            products:   catProducts,
        };
    }).filter((c) => c.count > 0);

    // ── Chart Data ────────────────────────────────────────

    // 1. Stock Distribution by Category (Value)
    const categoryValueData = categoryBreakdown.map((cat, index) => ({
        name: cat.name,
        value: cat.totalValue,
        color: cat.color || CHART_COLORS[index % CHART_COLORS.length],
        count: cat.count,
    })).sort((a, b) => b.value - a.value);

    // 2. Stock Status Distribution
    const statusCounts = {
        in_stock: products.filter(p => p.stock_status === 'in_stock').length,
        low_stock: products.filter(p => p.stock_status === 'low_stock').length,
        out_of_stock: products.filter(p => p.stock_status === 'out_of_stock').length,
    };

    const statusData = [
        { name: 'In Stock', value: statusCounts.in_stock, color: STOCK_STATUS.in_stock.hex },
        { name: 'Low Stock', value: statusCounts.low_stock, color: STOCK_STATUS.low_stock.hex },
        { name: 'Out of Stock', value: statusCounts.out_of_stock, color: STOCK_STATUS.out_of_stock.hex },
    ].filter(item => item.value > 0);

    // 3. Top 10 Products by Value
    const topProductsData = [...products]
        .sort((a, b) => (b.stock_value || 0) - (a.stock_value || 0))
        .slice(0, 10)
        .map(p => ({
            name: p.name?.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
            value: p.stock_value || 0,
            stock: p.current_stock || 0,
            category: p.category,
        }));

    // 4. Stock Level Distribution
    const stockLevelRanges = [
        { range: '0 (Out)', min: 0, max: 0 },
        { range: '1-10', min: 1, max: 10 },
        { range: '11-50', min: 11, max: 50 },
        { range: '51-100', min: 51, max: 100 },
        { range: '101-500', min: 101, max: 500 },
        { range: '500+', min: 501, max: Infinity },
    ];

    const stockLevelData = stockLevelRanges.map(range => ({
        range: range.range,
        count: products.filter(p => 
            p.current_stock >= range.min && p.current_stock <= range.max
        ).length,
    }));

    // 5. Category vs Stock Value (Bar Chart)
    const categoryBarData = categoryBreakdown
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 8)
        .map(cat => ({
            category: cat.name?.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name,
            value: cat.totalValue,
            count: cat.count,
            color: cat.color,
        }));

    // ── Export CSV ────────────────────────────────────────

    const handleExportCSV = () => {
        const headers = ['Name','SKU','Category','Unit','Current Stock',
                         'Avg Cost','Stock Value','Selling Price','Status'];
        const rows = filtered.map((p) => [
            p.name, p.sku || '', p.category || '',
            p.unit, p.current_stock, p.avg_cost,
            p.stock_value, p.selling_price, p.stock_status,
        ]);

        const csv = [headers, ...rows]
            .map((r) => r.join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Print ─────────────────────────────────────────────

    const handlePrint = () => window.print();

    // Custom Tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Paper sx={{ p: 1.5, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                        {label || payload[0].name}
                    </Typography>
                    {payload.map((entry, index) => (
                        <Typography key={index} variant="body2" sx={{ color: entry.color }}>
                            {entry.name}: {entry.name.toLowerCase().includes('value') || entry.dataKey === 'value' 
                                ? fmt(entry.value) 
                                : entry.value}
                        </Typography>
                    ))}
                </Paper>
            );
        }
        return null;
    };

    // ─────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────

    return (
        <>
            {loading && (
                <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
                    <LinearProgress />
                </Box>
            )}

            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* ══ HEADER ══ */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Paper elevation={0} sx={{
                        p: 2.5, mb: 3, borderRadius: '16px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                    }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="h5" fontWeight={700}>
                                    📊 Inventory Report & Analytics
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3 }}>
                                    Stock valuation, category-wise breakdown, aur advanced inventory analytics
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                                <Tooltip title="Export CSV" TransitionComponent={Zoom}>
                                    <GradientButton
                                        size="small"
                                        startIcon={<DownloadIcon />}
                                        onClick={handleExportCSV}
                                        gradient="linear-gradient(135deg,#11998e,#38ef7d)">
                                        Export CSV
                                    </GradientButton>
                                </Tooltip>
                                <Tooltip title="Print Report" TransitionComponent={Zoom}>
                                    <GradientButton
                                        size="small"
                                        startIcon={<PrintIcon />}
                                        onClick={handlePrint}
                                        gradient="linear-gradient(135deg,#4facfe,#00f2fe)">
                                        Print
                                    </GradientButton>
                                </Tooltip>
                            </Stack>
                        </Stack>
                    </Paper>
                </motion.div>

                {/* ══ SUMMARY CARDS ══ */}
                <Grid container spacing={2.5} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard
                            title="Total Products"
                            value={summary.total_products || 0}
                            subtitle={`${categoryBreakdown.length} categories`}
                            icon={<StockIcon sx={{ fontSize: 22 }} />}
                            gradient="linear-gradient(135deg,#667eea,#764ba2)"
                            delay={0}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard
                            title="Total Stock Value"
                            value={fmt(summary.total_stock_value)}
                            subtitle="Avg cost × current stock"
                            icon={<ValueIcon sx={{ fontSize: 22 }} />}
                            gradient="linear-gradient(135deg,#11998e,#38ef7d)"
                            delay={0.1}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard
                            title="Low Stock Items"
                            value={summary.low_stock_count || 0}
                            subtitle="Reorder karna padega"
                            icon={<WarningIcon sx={{ fontSize: 22 }} />}
                            gradient="linear-gradient(135deg,#f7971e,#ffd200)"
                            delay={0.2}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard
                            title="Out of Stock"
                            value={summary.out_of_stock_count || 0}
                            subtitle="Stock zero hai"
                            icon={<OutIcon sx={{ fontSize: 22 }} />}
                            gradient="linear-gradient(135deg,#f5576c,#f093fb)"
                            delay={0.3}
                        />
                    </Grid>
                </Grid>

                {/* ══ CHARTS SECTION ══ */}
                <Grid container spacing={2.5} mb={4}>
                    {/* Chart Type Selector */}
                    <Grid item xs={12}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end" mb={1}>
                            <Tooltip title="Pie Chart">
                                <IconButton 
                                    onClick={() => setChartType('pie')}
                                    sx={{ 
                                        bgcolor: chartType === 'pie' ? '#667eea20' : 'transparent',
                                        color: chartType === 'pie' ? '#667eea' : 'inherit'
                                    }}
                                >
                                    <PieChartIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Bar Chart">
                                <IconButton 
                                    onClick={() => setChartType('bar')}
                                    sx={{ 
                                        bgcolor: chartType === 'bar' ? '#667eea20' : 'transparent',
                                        color: chartType === 'bar' ? '#667eea' : 'inherit'
                                    }}
                                >
                                    <BarChartIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Area Chart">
                                <IconButton 
                                    onClick={() => setChartType('area')}
                                    sx={{ 
                                        bgcolor: chartType === 'area' ? '#667eea20' : 'transparent',
                                        color: chartType === 'area' ? '#667eea' : 'inherit'
                                    }}
                                >
                                    <LineChartIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Grid>

                    {/* First Row - Stock Distribution */}
                    <Grid item xs={12} md={6}>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <ChartCard>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        📊 Stock Value by Category
                                    </Typography>
                                    <Chip 
                                        label={`${categoryValueData.length} categories`} 
                                        size="small" 
                                        color="primary"
                                    />
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                
                                <ResponsiveContainer width="100%" height={300}>
                                    {chartType === 'pie' ? (
                                        <PieChart>
                                            <Pie
                                                data={categoryValueData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={2}
                                                dataKey="value"
                                                label={({ name, percent }) => 
                                                    `${name} (${(percent * 100).toFixed(0)}%)`
                                                }
                                                labelLine={false}
                                            >
                                                {categoryValueData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Legend />
                                        </PieChart>
                                    ) : chartType === 'bar' ? (
                                        <BarChart data={categoryValueData.slice(0, 6)}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" fill="#667eea" radius={[4, 4, 0, 0]}>
                                                {categoryValueData.slice(0, 6).map((entry, index) => (
                                                    <Cell key={index} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    ) : (
                                        <AreaChart data={categoryValueData.slice(0, 6)}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Area 
                                                type="monotone" 
                                                dataKey="value" 
                                                stroke="#667eea" 
                                                fill="url(#colorGradient)" 
                                            />
                                            <defs>
                                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#764ba2" stopOpacity={0.2}/>
                                                </linearGradient>
                                            </defs>
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            </ChartCard>
                        </motion.div>
                    </Grid>

                    {/* Second - Stock Status Distribution */}
                    <Grid item xs={12} md={6}>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <ChartCard>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        ⚡ Stock Status Distribution
                                    </Typography>
                                    <Stack direction="row" spacing={0.5}>
                                        {statusData.map((item, i) => (
                                            <Chip 
                                                key={i}
                                                label={item.value} 
                                                size="small" 
                                                sx={{ bgcolor: item.color + '20', color: item.color }}
                                            />
                                        ))}
                                    </Stack>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            dataKey="value"
                                            label={({ name, percent }) => 
                                                `${name} (${(percent * 100).toFixed(0)}%)`
                                            }
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Status Legend with Counts */}
                                <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
                                    {statusData.map((item, i) => (
                                        <Stack key={i} direction="row" spacing={0.5} alignItems="center">
                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                                            <Typography variant="caption" fontWeight={600}>
                                                {item.name}: {item.value}
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </ChartCard>
                        </motion.div>
                    </Grid>

                    {/* Second Row - Top Products & Stock Levels */}
                    <Grid item xs={12} md={6}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <ChartCard>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        🏆 Top 10 Products by Value
                                    </Typography>
                                    <Chip label="Highest Value" size="small" color="success" />
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart 
                                        data={topProductsData} 
                                        layout="vertical"
                                        margin={{ left: 80 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" tick={{ fontSize: 12 }} />
                                        <YAxis 
                                            type="category" 
                                            dataKey="name" 
                                            tick={{ fontSize: 12 }}
                                            width={80}
                                        />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" fill="#667eea" radius={[0, 4, 4, 0]}>
                                            {topProductsData.map((entry, index) => (
                                                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </motion.div>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <ChartCard>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        📦 Stock Level Distribution
                                    </Typography>
                                    <Chip label="Quantity Ranges" size="small" color="info" />
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={stockLevelData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Bar dataKey="count" fill="#f7971e" radius={[4, 4, 0, 0]}>
                                            {stockLevelData.map((entry, index) => (
                                                <Cell 
                                                    key={index} 
                                                    fill={entry.count > 10 ? '#f7971e' : 
                                                           entry.count > 5 ? '#ffd200' : '#f5576c'} 
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </motion.div>
                    </Grid>

                    {/* Category Bar Chart */}
                    <Grid item xs={12}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <ChartCard>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        📊 Category-wise Stock Value Comparison
                                    </Typography>
                                    <Chip label={`Total: ${fmt(filteredValue)}`} size="small" color="success" />
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                
                                <ResponsiveContainer width="100%" height={400}>
                                    <ComposedChart data={categoryBarData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="value" fill="#667eea" name="Stock Value" radius={[4, 4, 0, 0]}>
                                            {categoryBarData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Bar>
                                        <Line yAxisId="right" type="monotone" dataKey="count" stroke="#f7971e" name="Product Count" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </motion.div>
                    </Grid>
                </Grid>

                {/* ══ CATEGORY BREAKDOWN ══ */}
                {categoryBreakdown.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <GlassCard sx={{ mb: 3 }}>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                                    <Avatar sx={{ bgcolor: '#ede7f6', color: '#7b1fa2',
                                        width: 36, height: 36 }}>
                                        <CategoryIcon sx={{ fontSize: 18 }} />
                                    </Avatar>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        Category-wise Breakdown
                                    </Typography>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />

                                <Grid container spacing={2}>
                                    {categoryBreakdown.map((cat, i) => {
                                        const pct = summary.total_stock_value > 0
                                            ? Math.round((cat.totalValue / summary.total_stock_value) * 100)
                                            : 0;
                                        return (
                                            <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id}>
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    whileHover={{ y: -3 }}
                                                >
                                                    <Paper elevation={0} sx={{
                                                        p: 2, borderRadius: '14px',
                                                        border: '1.5px solid',
                                                        borderColor: cat.color + '40',
                                                        bgcolor: cat.color + '08',
                                                    }}>
                                                        <Stack direction="row" justifyContent="space-between"
                                                            alignItems="center" mb={1.5}>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Box sx={{
                                                                    width: 12, height: 12,
                                                                    borderRadius: '50%',
                                                                    bgcolor: cat.color,
                                                                }} />
                                                                <Typography variant="body2" fontWeight={700}>
                                                                    {cat.name}
                                                                </Typography>
                                                            </Stack>
                                                            <Chip label={`${cat.count} items`}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: cat.color + '20',
                                                                    color:   cat.color,
                                                                    fontWeight: 700, fontSize: 10,
                                                                }} />
                                                        </Stack>

                                                        <Typography variant="h6" fontWeight={800}
                                                            color={cat.color}>
                                                            {fmt(cat.totalValue)}
                                                        </Typography>
                                                        <Typography variant="caption"
                                                            color="text.secondary">
                                                            {pct}% of total value
                                                        </Typography>

                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={pct}
                                                            sx={{
                                                                mt: 1, height: 6, borderRadius: 3,
                                                                bgcolor: cat.color + '20',
                                                                '& .MuiLinearProgress-bar': {
                                                                    bgcolor: cat.color,
                                                                    borderRadius: 3,
                                                                },
                                                            }}
                                                        />

                                                        {(cat.lowStock > 0 || cat.outStock > 0) && (
                                                            <Stack direction="row" spacing={0.5} mt={1}>
                                                                {cat.lowStock > 0 && (
                                                                    <Chip
                                                                        label={`${cat.lowStock} low`}
                                                                        size="small" color="warning"
                                                                        sx={{ fontSize: 10 }}
                                                                    />
                                                                )}
                                                                {cat.outStock > 0 && (
                                                                    <Chip
                                                                        label={`${cat.outStock} out`}
                                                                        size="small" color="error"
                                                                        sx={{ fontSize: 10 }}
                                                                    />
                                                                )}
                                                            </Stack>
                                                        )}
                                                    </Paper>
                                                </motion.div>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </CardContent>
                        </GlassCard>
                    </motion.div>
                )}

                {/* ══ FILTER BAR ══ */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: '16px' }} elevation={2}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth size="small"
                                placeholder="Search by name, SKU, category..."
                                value={searchQuery}
                                onChange={(e) => setSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchQuery && (
                                        <InputAdornment position="end">
                                            <IconButton size="small"
                                                onClick={() => setSearch('')}>
                                                <ClearIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: '10px' },
                                }}
                            />
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <Select fullWidth size="small" value={categoryFilter}
                                onChange={(e) => setCategory(e.target.value)}
                                sx={{ borderRadius: '10px' }}>
                                <MenuItem value="all">All Categories</MenuItem>
                                {categories.map((c) => (
                                    <MenuItem key={c.id} value={String(c.id)}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box sx={{ width: 10, height: 10,
                                                borderRadius: '50%', bgcolor: c.color }} />
                                            <span>{c.name}</span>
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <Select fullWidth size="small" value={statusFilter}
                                onChange={(e) => setStatus(e.target.value)}
                                sx={{ borderRadius: '10px' }}>
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="in_stock">✅ In Stock</MenuItem>
                                <MenuItem value="low_stock">⚠️ Low Stock</MenuItem>
                                <MenuItem value="out_of_stock">❌ Out of Stock</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <Select fullWidth size="small" value={`${sortBy}_${sortDir}`}
                                onChange={(e) => {
                                    const [field, dir] = e.target.value.split('_last_').length > 1
                                        ? e.target.value.split('_last_')
                                        : [e.target.value.replace('_asc','').replace('_desc',''),
                                           e.target.value.endsWith('_asc') ? 'asc' : 'desc'];
                                    setSortBy(field); setSortDir(dir);
                                }}
                                sx={{ borderRadius: '10px' }}>
                                <MenuItem value="stock_value_desc">💰 Value: High → Low</MenuItem>
                                <MenuItem value="stock_value_asc">💰 Value: Low → High</MenuItem>
                                <MenuItem value="current_stock_desc">📦 Stock: High → Low</MenuItem>
                                <MenuItem value="current_stock_asc">📦 Stock: Low → High</MenuItem>
                                <MenuItem value="name_asc">🔤 Name: A → Z</MenuItem>
                                <MenuItem value="name_desc">🔤 Name: Z → A</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={6} md={1}>
                            <GradientButton fullWidth size="small"
                                startIcon={<FilterIcon />}
                                onClick={handleApplyFilter}
                                gradient="linear-gradient(135deg,#667eea,#764ba2)">
                                Filter
                            </GradientButton>
                        </Grid>
                        <Grid item xs={6} md={1}>
                            <Button fullWidth size="small" variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={() => {
                                    setSearch(''); setCategory('all');
                                    setStatus('all'); setSortBy('stock_value');
                                    setSortDir('desc'); loadData();
                                }}
                                sx={{ borderRadius: '10px' }}>
                                Reset
                            </Button>
                        </Grid>
                    </Grid>

                    {/* Filtered Summary Strip */}
                    {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
                        <Box mt={1.5} pt={1.5} sx={{ borderTop: '1px solid #e2e8f0' }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                    Filtered Results:
                                </Typography>
                                <Chip label={`${filtered.length} products`}
                                    size="small" color="primary" sx={{ fontWeight: 700 }} />
                                <Chip label={`Value: ${fmt(filteredValue)}`}
                                    size="small" color="success" sx={{ fontWeight: 700 }} />
                            </Stack>
                        </Box>
                    )}
                </Paper>

                {/* ══ MAIN TABLE ══ */}
                <GlassCard>
                    <CardContent sx={{ p: 0 }}>

                        {/* Table Header */}
                        <Stack direction="row" justifyContent="space-between"
                            alignItems="center" sx={{ p: 2.5, pb: 0 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{ bgcolor: '#ede7f6', color: '#7b1fa2',
                                    width: 36, height: 36 }}>
                                    <StockIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Typography variant="subtitle1" fontWeight={700}>
                                    Stock Valuation Report
                                </Typography>
                                <Chip label={`${filtered.length} items`}
                                    size="small" color="primary" sx={{ fontWeight: 700 }} />
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" color="text.secondary">
                                    Total Value:
                                </Typography>
                                <Typography variant="subtitle1" fontWeight={800} color="#667eea">
                                    {fmt(filteredValue)}
                                </Typography>
                            </Stack>
                        </Stack>
                        <Divider sx={{ mt: 2 }} />

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell sx={{ fontWeight: 700, py: 2 }}>#</TableCell>
                                        <TableCell
                                            sx={{ fontWeight: 700, cursor: 'pointer' }}
                                            onClick={() => handleSort('name')}>
                                            Product <SortIcon field="name" />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>HSN</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                                        <TableCell
                                            sx={{ fontWeight: 700, cursor: 'pointer' }}
                                            onClick={() => handleSort('current_stock')}>
                                            Current Stock <SortIcon field="current_stock" />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Alert</TableCell>
                                        <TableCell
                                            sx={{ fontWeight: 700, cursor: 'pointer' }}
                                            onClick={() => handleSort('avg_cost')}>
                                            Avg Cost <SortIcon field="avg_cost" />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Selling Price</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Margin</TableCell>
                                        <TableCell
                                            sx={{ fontWeight: 700, cursor: 'pointer' }}
                                            onClick={() => handleSort('stock_value')}>
                                            Stock Value <SortIcon field="stock_value" />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={12} align="center" sx={{ py: 8 }}>
                                                <CircularProgress size={36} />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginated.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={12} align="center" sx={{ py: 8 }}>
                                                <Stack alignItems="center" spacing={2}>
                                                    <Avatar sx={{ width: 72, height: 72,
                                                        bgcolor: '#f3e5f5' }}>
                                                        <StockIcon sx={{ fontSize: 40, color: '#9c27b0' }} />
                                                    </Avatar>
                                                    <Typography variant="h6" color="text.secondary">
                                                        Koi product nahi mila
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginated.map((p, i) => {
                                        const margin = p.selling_price > 0 && p.avg_cost > 0
                                            ? (((p.selling_price - p.avg_cost) / p.selling_price) * 100).toFixed(1)
                                            : null;
                                        const pctOfTotal = filteredValue > 0
                                            ? ((p.stock_value / filteredValue) * 100).toFixed(1)
                                            : 0;

                                        return (
                                            <StyledRow key={p.id} stockstatus={p.stock_status}>
                                                <TableCell>
                                                    <Typography variant="body2"
                                                        color="text.secondary" fontWeight={600}>
                                                        {String(page * rowsPerPage + i + 1).padStart(2,'0')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <Avatar sx={{
                                                            width: 34, height: 34, fontSize: 14,
                                                            bgcolor: (p.category_color || '#667eea') + '25',
                                                            color:    p.category_color || '#667eea',
                                                            fontWeight: 700,
                                                        }}>
                                                            {p.name?.charAt(0)?.toUpperCase()}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {p.name}
                                                            </Typography>
                                                            {p.sku && (
                                                                <Typography variant="caption"
                                                                    color="text.secondary">
                                                                    SKU: {p.sku}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    {p.category ? (
                                                        <Chip label={p.category} size="small"
                                                            sx={{
                                                                bgcolor: (p.category_color || '#667eea') + '20',
                                                                color:    p.category_color || '#667eea',
                                                                fontWeight: 600, fontSize: 11,
                                                            }} />
                                                    ) : (
                                                        <Typography variant="caption"
                                                            color="text.disabled">—</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {p.hsn_code || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={p.unit} size="small"
                                                        variant="outlined" sx={{ fontSize: 11 }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={700}
                                                        color={
                                                            p.stock_status === 'out_of_stock' ? '#ef4444' :
                                                            p.stock_status === 'low_stock'    ? '#ed6c02' : '#2e7d32'
                                                        }>
                                                        {fmtQty(p.current_stock, p.unit)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption"
                                                        color="text.secondary">
                                                        {p.low_stock_alert > 0
                                                            ? fmtQty(p.low_stock_alert, p.unit)
                                                            : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {fmt(p.avg_cost)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}
                                                        color="#2e7d32">
                                                        {fmt(p.selling_price)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {margin !== null ? (
                                                        <Chip
                                                            label={`${margin}%`}
                                                            size="small"
                                                            color={
                                                                parseFloat(margin) >= 20 ? 'success' :
                                                                parseFloat(margin) >= 10 ? 'warning' : 'error'
                                                            }
                                                            sx={{ fontWeight: 700, fontSize: 11 }}
                                                        />
                                                    ) : (
                                                        <Typography variant="caption"
                                                            color="text.disabled">—</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={800}
                                                            color="#667eea">
                                                            {fmt(p.stock_value)}
                                                        </Typography>
                                                        <Typography variant="caption"
                                                            color="text.secondary">
                                                            {pctOfTotal}% of total
                                                        </Typography>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={Math.min(parseFloat(pctOfTotal) * 5, 100)}
                                                            sx={{
                                                                mt: 0.3, height: 3, borderRadius: 3,
                                                                bgcolor: '#e8eaf6',
                                                                '& .MuiLinearProgress-bar': {
                                                                    bgcolor: '#667eea',
                                                                },
                                                            }}
                                                        />
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={STOCK_STATUS[p.stock_status]?.label || 'In Stock'}
                                                        size="small"
                                                        color={STOCK_STATUS[p.stock_status]?.color || 'success'}
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                </TableCell>
                                            </StyledRow>
                                        );
                                    })}

                                    {/* Total Row */}
                                    {paginated.length > 0 && (
                                        <TableRow sx={{
                                            bgcolor: 'rgba(102,126,234,0.06)',
                                            borderTop: '2px solid #667eea',
                                        }}>
                                            <TableCell colSpan={10} align="right">
                                                <Typography variant="subtitle2" fontWeight={800}>
                                                    Total (Filtered {filtered.length} items):
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2" fontWeight={800}
                                                    color="#667eea">
                                                    {fmt(filteredValue)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell />
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[15, 25, 50, 100]}
                            component="div"
                            count={filtered.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(_, p) => setPage(p)}
                            onRowsPerPageChange={(e) => {
                                setRows(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            sx={{ borderTop: '1px solid #e2e8f0' }}
                        />
                    </CardContent>
                </GlassCard>

            </Container>
        </>
    );
};

export default InventoryReport;
