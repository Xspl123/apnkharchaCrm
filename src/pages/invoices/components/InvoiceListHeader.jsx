import {
    Box,
    CardContent,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import {
    Add as AddIcon,
    Clear as ClearIcon,
    Close as CloseIcon,
    Receipt as ReceiptIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import SpeechFieldButton from "../../../components/SpeechFieldButton";
import { PageHeader } from "../../../components/common";
import { GlassCard, GradientButton } from "./invoiceStyledComponents";

const InvoiceListHeader = ({
    appendSpeech,
    dateFilter,
    formatCurrency,
    handleOpenForm,
    loadData,
    searchQuery,
    setDateFilter,
    setSearchQuery,
    setStatusFilter,
    showForm,
    statistics,
    statusFilter,
}) => (
    <>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <PageHeader
                title="Invoices"
                subtitle="Professional invoice management."
                icon={<ReceiptIcon />}
                meta={`${statistics.total} Invoices`}
                actions={[
                    {
                        label: showForm ? "Close Form" : "Create Invoice",
                        icon: showForm ? <CloseIcon /> : <AddIcon />,
                        onClick: handleOpenForm,
                    },
                    {
                        label: "Refresh",
                        icon: <RefreshIcon />,
                        variant: "outlined",
                        onClick: loadData,
                    },
                ]}
            />
        </motion.div>

        <Grid container spacing={1.5} className="invoice-page__stats">
            {[
                { label: 'TOTAL',  value: statistics.total,   color: '#667eea', variant: 'h5' },
                { label: 'PAID',   value: statistics.paid,    color: '#10b981', variant: 'h5' },
                { label: 'RETURN', value: statistics.return, color: '#f59e0b', variant: 'h5' },
                { label: 'UNPAID', value: statistics.unpaid,  color: '#ef4444', variant: 'h5' },
                { label: 'VALUE',  value: formatCurrency(statistics.totalAmount), color: '#764ba2', variant: 'body1' },
            ].map((s, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                        <GlassCard className="invoice-page__stat-card">
                            <CardContent className="invoice-page__stat-content">
                                <Typography variant="caption" className="invoice-page__stat-label">
                                    {s.label}
                                </Typography>
                                <Typography variant={s.variant} sx={{ fontWeight: 700, color: s.color, lineHeight: 1.2 }}>
                                    {s.value}
                                </Typography>
                            </CardContent>
                        </GlassCard>
                    </motion.div>
                </Grid>
            ))}
        </Grid>

        <Paper className="invoice-page__action-bar" elevation={2}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                    <TextField fullWidth variant="outlined"
                        placeholder="Search invoices by number, client, status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                            endAdornment: (
                                <InputAdornment position="end">
                                    {searchQuery && (
                                        <IconButton size="small" onClick={() => setSearchQuery('')}><ClearIcon /></IconButton>
                                    )}
                                    <SpeechFieldButton onTranscript={(text) => setSearchQuery((prev) => appendSpeech(prev, text))} />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: '12px' },
                        }}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <Select fullWidth value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        displayEmpty sx={{ borderRadius: '12px' }}>
                        <MenuItem value="all">📋 All Status</MenuItem>
                        <MenuItem value="paid">✅ Paid</MenuItem>
                        <MenuItem value="unpaid">❌ Unpaid</MenuItem>
                        <MenuItem value="return">🔄 Return</MenuItem>
                        <MenuItem value="partial">⏳ Partial</MenuItem>
                        <MenuItem value="overdue">⚠️ Overdue</MenuItem>
                    </Select>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Select fullWidth value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                        displayEmpty sx={{ borderRadius: '12px' }}>
                        <MenuItem value="all">📅 All Dates</MenuItem>
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="week">This Week</MenuItem>
                        <MenuItem value="month">This Month</MenuItem>
                        <MenuItem value="quarter">This Quarter</MenuItem>
                    </Select>
                </Grid>
                <Grid item xs={12} md={2}>
                    <GradientButton fullWidth startIcon={<RefreshIcon />} onClick={loadData}
                        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                        Refresh
                    </GradientButton>
                </Grid>
            </Grid>
        </Paper>

        <Box className="invoice-page__create-row">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <GradientButton variant="contained" size="small"
                    startIcon={showForm ? <CloseIcon /> : <AddIcon />}
                    onClick={handleOpenForm}
                    sx={{
                        px: 6, py: 1.5, fontSize: '1.1rem',
                        background: showForm
                            ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}>
                    {showForm ? "Cancel" : "Create New Invoice"}
                </GradientButton>
            </motion.div>
        </Box>
    </>
);

export default InvoiceListHeader;
