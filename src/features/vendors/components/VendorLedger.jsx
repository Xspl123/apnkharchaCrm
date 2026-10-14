// src/features/vendors/components/VendorLedger.jsx - Complete Vendor Ledger Component

import { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
    Snackbar,
    useMediaQuery,
} from "@mui/material";
import {
    AssignmentReturn as AssignmentReturnIcon,
    ShoppingCart as PurchaseIcon,
    Payment as PaymentIcon,
    AccountBalance as AccountBalanceIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    PictureAsPdf as PictureAsPdfIcon,
    Search as SearchIcon,
    MenuBook as LedgerIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { styled } from "@mui/material/styles";
import { getVendorLedger, setLedgerClose } from "../state/vendorSlice";

// ==================== STYLED COMPONENTS ====================

const GlassCard = styled(Card)(({ theme }) => ({
    background: theme.palette.background.paper,
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    boxShadow: theme.palette.mode === "dark"
        ? "0 8px 32px rgba(0, 0, 0, 0.28)"
        : "0 8px 32px rgba(0, 0, 0, 0.08)",
    border: `1px solid ${theme.palette.divider}`,
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    padding: "16px",
    borderBottom: `2px solid ${theme.palette.divider}`,
}));

const BalanceChip = styled(Chip)(({ balance, theme }) => ({
    fontWeight: 700,
    borderRadius: "8px",
    backgroundColor: balance === 0
        ? (theme.palette.mode === "dark" ? "rgba(34, 197, 94, 0.18)" : "#e8f5e9")
        : balance > 0
        ? (theme.palette.mode === "dark" ? "rgba(237, 108, 2, 0.18)" : "#fff4e5")
        : (theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.18)" : "#eff6ff"),
    color: balance === 0
        ? (theme.palette.mode === "dark" ? "#86efac" : "#2e7d32")
        : balance > 0
        ? (theme.palette.mode === "dark" ? "#fb923c" : "#c2410c")
        : (theme.palette.mode === "dark" ? "#93c5fd" : "#1d4ed8"),
}));

// ==================== COMPONENT ====================

const VendorLedger = ({ open, onClose, vendorId, vendorName }) => {
    const dispatch = useDispatch();
    const { ledger } = useSelector((state) => state.vendors);
    const isMobile = useMediaQuery("(max-width:600px)");
    const fetchedRef = useRef(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [sortBy, setSortBy] = useState("date_asc");
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const responseData = ledger?.data?.data || ledger?.data;
    const ledgerData = responseData?.ledger || [];
    const closingBalance = Number(responseData?.closing_balance || 0);
    const openingBalance = Number(responseData?.opening_balance || 0);
    const vendorNameFromData = responseData?.vendor || vendorName;

    // Fetch ledger data
    useEffect(() => {
        if (open && vendorId) {
            const currentVendorId = parseInt(vendorId, 10);
            const hasDataForThisVendor = ledger?.openVendorId === currentVendorId && ledgerData.length > 0;

            if (!hasDataForThisVendor && !fetchedRef.current) {
                dispatch(getVendorLedger(currentVendorId));
                fetchedRef.current = true;
            }
        }

        if (!open) {
            fetchedRef.current = false;
        }
    }, [open, vendorId, dispatch, ledger?.openVendorId, ledgerData.length]);

    const handleClose = () => {
        dispatch(setLedgerClose());
        fetchedRef.current = false;
        onClose();
    };

    const handleRefresh = () => {
        if (vendorId) {
            dispatch(getVendorLedger(parseInt(vendorId, 10)));
            fetchedRef.current = true;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount || 0);
    };

    const totals = useMemo(() => {
        let purchases = 0;
        let returned = 0;
        let paid = 0;
        let totalDebit = 0;
        let totalCredit = 0;

        ledgerData.forEach((item) => {
            const typeLower = (item.type || "").toLowerCase();
            const deb = Number(item.debit || 0);
            const cred = Number(item.credit || 0);

            totalDebit += deb;
            totalCredit += cred;

            if (typeLower.includes("return") || typeLower.includes("debit note")) {
                returned += deb;
            } else if (typeLower.includes("payment")) {
                paid += deb;
            } else if (typeLower.includes("purchase order") || typeLower.includes("po")) {
                purchases += cred;
            }
        });

        return {
            purchases: responseData?.total_purchases ?? purchases,
            returned: responseData?.total_returned ?? returned,
            paid: responseData?.total_paid ?? paid,
            totalDebit,
            totalCredit,
        };
    }, [ledgerData, responseData]);

    const filteredLedger = useMemo(() => {
        let filtered = [...ledgerData];

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    (item.type && item.type.toLowerCase().includes(searchLower)) ||
                    (item.date && item.date.toLowerCase().includes(searchLower)) ||
                    String(item.debit).includes(searchLower) ||
                    String(item.credit).includes(searchLower) ||
                    String(item.balance).includes(searchLower)
            );
        }

        if (filterType !== "all") {
            filtered = filtered.filter((item) => {
                const typeLower = (item.type || "").toLowerCase();
                if (filterType === "purchase") return typeLower.includes("purchase order") && !typeLower.includes("return");
                if (filterType === "payment") return typeLower.includes("payment");
                if (filterType === "return") return typeLower.includes("return") || typeLower.includes("debit note");
                if (filterType === "opening") return typeLower.includes("opening");
                return true;
            });
        }

        filtered.sort((a, b) => {
            if (a.type === "Opening Balance") return -1;
            if (b.type === "Opening Balance") return 1;

            if (sortBy === "date_desc") return new Date(b.date || 0) - new Date(a.date || 0);
            if (sortBy === "date_asc") return new Date(a.date || 0) - new Date(b.date || 0);
            if (sortBy === "amount_desc") {
                return Math.max(b.debit || 0, b.credit || 0) - Math.max(a.debit || 0, a.credit || 0);
            }
            if (sortBy === "amount_asc") {
                return Math.max(a.debit || 0, a.credit || 0) - Math.max(b.debit || 0, b.credit || 0);
            }
            return 0;
        });

        return filtered;
    }, [ledgerData, searchTerm, filterType, sortBy]);

    // Print Handler
    const handlePrint = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const styles = `
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; margin: 0; background: white; color: #0f172a; }
                .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #667eea; }
                .header h1 { color: #667eea; margin: 0; font-size: 26px; }
                .header h3 { color: #334155; margin: 8px 0 0; font-weight: 600; font-size: 18px; }
                .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
                .card { padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; text-align: center; }
                .card-title { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; }
                .card-value { font-size: 18px; font-weight: 800; color: #0f172a; margin: 6px 0; }
                .card-sub { font-size: 10px; color: #94a3b8; font-weight: 600; }
                .card-value.payable { color: #c2410c; }
                .card-value.advance { color: #1d4ed8; }
                .card-value.settled { color: #166534; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background: #f1f5f9; color: #1e293b; font-weight: 700; text-align: left; padding: 12px; border-bottom: 2px solid #cbd5e1; font-size: 12px; }
                td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
                .text-right { text-align: right; }
                .summary-row { background: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1; }
                .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            </style>
        `;

        const printHTML = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Vendor Ledger - ${vendorNameFromData}</title>
                    ${styles}
                </head>
                <body>
                    <div class="header">
                        <h1>VENDOR FINANCIAL LEDGER</h1>
                        <h3>${vendorNameFromData}</h3>
                        <p style="margin: 5px 0 0; color: #64748b; font-size: 12px;">Statement of Accounts Payable</p>
                    </div>

                    <div class="summary-cards">
                        <div class="card">
                            <div class="card-title">Opening Balance</div>
                            <div class="card-value">${formatCurrency(openingBalance)}</div>
                            <div class="card-sub">${openingBalance === 0 ? "No dues" : openingBalance > 0 ? "Payable Cr" : "Advance Dr"}</div>
                        </div>
                        <div class="card">
                            <div class="card-title">Total Purchases</div>
                            <div class="card-value">${formatCurrency(totals.purchases)}</div>
                            <div class="card-sub">${totals.returned > 0 ? `Returned: -${formatCurrency(totals.returned)}` : "All POs billed"}</div>
                        </div>
                        <div class="card">
                            <div class="card-title">Total Paid</div>
                            <div class="card-value">${formatCurrency(totals.paid)}</div>
                            <div class="card-sub">Payments cleared</div>
                        </div>
                        <div class="card">
                            <div class="card-title">Closing Balance</div>
                            <div class="card-value ${closingBalance === 0 ? "settled" : closingBalance > 0 ? "payable" : "advance"}">
                                ${formatCurrency(closingBalance)}
                            </div>
                            <div class="card-sub">${closingBalance === 0 ? "Fully Settled" : closingBalance > 0 ? "Payable (Cr)" : "Advance (Dr)"}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description / Transaction</th>
                                <th class="text-right">Debit (₹)</th>
                                <th class="text-right">Credit (₹)</th>
                                <th class="text-right">Balance (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ledgerData.map((entry) => `
                                <tr>
                                    <td>${entry.date || "-"}</td>
                                    <td>${entry.type}</td>
                                    <td class="text-right">${entry.debit > 0 ? formatCurrency(entry.debit) : "-"}</td>
                                    <td class="text-right">${entry.credit > 0 ? formatCurrency(entry.credit) : "-"}</td>
                                    <td class="text-right"><strong>${formatCurrency(entry.balance)}</strong></td>
                                </tr>
                            `).join("")}
                            <tr class="summary-row">
                                <td colspan="2"><strong>Total / Current Balance</strong></td>
                                <td class="text-right"><strong>${formatCurrency(totals.totalDebit)}</strong></td>
                                <td class="text-right"><strong>${formatCurrency(totals.totalCredit)}</strong></td>
                                <td class="text-right">
                                    <strong class="${closingBalance === 0 ? "settled" : closingBalance > 0 ? "payable" : "advance"}">
                                        ${formatCurrency(closingBalance)}
                                    </strong>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="footer">
                        <p>Generated on ${new Date().toLocaleDateString("en-IN", {
                            day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })} | Computer generated vendor statement - Apna Kharcha CRM</p>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    // PDF Download Handler
    const handleDownloadPDF = async () => {
        const element = document.getElementById("vendor-ledger-print-content");
        if (!element) return;

        setSnackbar({ open: true, message: "Generating PDF...", severity: "info" });

        try {
            const html2pdf = (await import("html2pdf.js")).default;
            const opt = {
                margin: 10,
                filename: `Vendor_Ledger_${(vendorNameFromData || "Vendor").replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            };

            await html2pdf().set(opt).from(element).save();
            setSnackbar({ open: true, message: "PDF downloaded successfully!", severity: "success" });
        } catch {
            setSnackbar({ open: true, message: "Opening Print dialog...", severity: "warning" });
            handlePrint();
        }
    };

    // CSV Download Handler
    const handleDownloadCSV = () => {
        if (!ledgerData.length) {
            setSnackbar({ open: true, message: "No data to export", severity: "warning" });
            return;
        }

        const headers = ["Date", "Description", "Debit", "Credit", "Balance"];
        const rows = ledgerData.map((e) => [
            `"${e.date || "-"}"`,
            `"${e.type.replace(/"/g, '""')}"`,
            e.debit || 0,
            e.credit || 0,
            e.balance || 0,
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Vendor_Ledger_${(vendorNameFromData || "Vendor").replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSnackbar({ open: true, message: "CSV exported successfully!", severity: "success" });
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={handleClose}
            PaperProps={{
                sx: {
                    width: isMobile ? "100%" : "90%",
                    maxWidth: "1250px",
                    p: 0,
                    bgcolor: "background.default",
                },
            }}
        >
            <Box sx={{ p: 0 }}>
                {/* Header */}
                <Box
                    sx={{
                        p: 3,
                        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                        color: "white",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: "#667eea", width: 48, height: 48 }}>
                                <LedgerIcon sx={{ fontSize: 28 }} />
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight={800} letterSpacing={0.5}>
                                    Vendor Ledger
                                </Typography>
                                <Typography variant="h6" sx={{ opacity: 0.9, fontSize: { xs: "0.95rem", sm: "1.25rem" } }}>
                                    {vendorNameFromData || "Loading..."}
                                </Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <Tooltip title="Refresh">
                                <IconButton onClick={handleRefresh} sx={{ color: "white" }} disabled={ledger?.isLoading}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Close">
                                <IconButton onClick={handleClose} sx={{ color: "white" }}>
                                    <CloseIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Box>

                {/* Loading State */}
                {ledger?.isLoading && (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
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
                            {ledger?.message || "Failed to load ledger data"}
                        </Alert>
                    </Box>
                )}

                {/* Content */}
                {!ledger?.isLoading && !ledger?.isError && ledgerData && (
                    <Box id="vendor-ledger-print-content">
                        {/* Summary Cards */}
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <motion.div whileHover={{ y: -4 }}>
                                        <GlassCard>
                                            <CardContent>
                                                <Stack spacing={0.5}>
                                                    <Typography variant="body2" color="textSecondary" fontWeight={600}>
                                                        Opening Balance
                                                    </Typography>
                                                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#667eea" }}>
                                                        {formatCurrency(openingBalance)}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {openingBalance === 0 ? "No prior dues" : openingBalance > 0 ? "Payable (Cr)" : "Advance (Dr)"}
                                                    </Typography>
                                                </Stack>
                                            </CardContent>
                                        </GlassCard>
                                    </motion.div>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <motion.div whileHover={{ y: -4 }}>
                                        <GlassCard>
                                            <CardContent>
                                                <Stack spacing={0.5}>
                                                    <Typography variant="body2" color="textSecondary" fontWeight={600}>
                                                        Total Purchases
                                                    </Typography>
                                                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#0284c7" }}>
                                                        {formatCurrency(totals.purchases)}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {totals.returned > 0 ? `Returned: -${formatCurrency(totals.returned)}` : "All POs billed"}
                                                    </Typography>
                                                </Stack>
                                            </CardContent>
                                        </GlassCard>
                                    </motion.div>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <motion.div whileHover={{ y: -4 }}>
                                        <GlassCard>
                                            <CardContent>
                                                <Stack spacing={0.5}>
                                                    <Typography variant="body2" color="textSecondary" fontWeight={600}>
                                                        Total Paid
                                                    </Typography>
                                                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#16a34a" }}>
                                                        {formatCurrency(totals.paid)}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Bank, Cash, UPI cleared
                                                    </Typography>
                                                </Stack>
                                            </CardContent>
                                        </GlassCard>
                                    </motion.div>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <motion.div whileHover={{ y: -4 }}>
                                        <GlassCard>
                                            <CardContent>
                                                <Stack spacing={0.5}>
                                                    <Typography variant="body2" color="textSecondary" fontWeight={600}>
                                                        Closing Balance
                                                    </Typography>
                                                    <Typography
                                                        variant="h5"
                                                        sx={{
                                                            fontWeight: 800,
                                                            color: closingBalance === 0 ? "#16a34a" : closingBalance > 0 ? "#ea580c" : "#2563eb",
                                                        }}
                                                    >
                                                        {formatCurrency(closingBalance)}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {closingBalance === 0
                                                            ? "Fully Settled (₹0.00)"
                                                            : closingBalance > 0
                                                            ? "Payable to Vendor (Cr)"
                                                            : "Advance with Vendor (Dr)"}
                                                    </Typography>
                                                </Stack>
                                            </CardContent>
                                        </GlassCard>
                                    </motion.div>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Filter Bar */}
                        <Box sx={{ px: 3, pb: 2 }}>
                            <Paper sx={{ p: 2, borderRadius: "16px", bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={5}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Search transactions..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon fontSize="small" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Type</InputLabel>
                                            <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value)}>
                                                <MenuItem value="all">All Transactions</MenuItem>
                                                <MenuItem value="purchase">Purchase Orders</MenuItem>
                                                <MenuItem value="payment">Payments</MenuItem>
                                                <MenuItem value="return">Debit Notes / Returns</MenuItem>
                                                <MenuItem value="opening">Opening Balance</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6} md={2}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Sort By</InputLabel>
                                            <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
                                                <MenuItem value="date_asc">Oldest First</MenuItem>
                                                <MenuItem value="date_desc">Newest First</MenuItem>
                                                <MenuItem value="amount_desc">Amount (High to Low)</MenuItem>
                                                <MenuItem value="amount_asc">Amount (Low to High)</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Tooltip title="Print Statement">
                                                <IconButton onClick={handlePrint} color="primary" sx={{ border: "1px solid", borderColor: "divider" }}>
                                                    <PrintIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Download PDF">
                                                <IconButton onClick={handleDownloadPDF} color="error" sx={{ border: "1px solid", borderColor: "divider" }}>
                                                    <PictureAsPdfIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Export CSV">
                                                <IconButton onClick={handleDownloadCSV} color="success" sx={{ border: "1px solid", borderColor: "divider" }}>
                                                    <DownloadIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Box>

                        {/* Transaction Table */}
                        <Box sx={{ px: 3, pb: 4 }}>
                            <TableContainer component={Paper} sx={{ borderRadius: "16px", border: "1px solid", borderColor: "divider" }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "background.default" }}>
                                            <StyledTableCell>Date</StyledTableCell>
                                            <StyledTableCell>Description / Transaction</StyledTableCell>
                                            <StyledTableCell align="right">Debit (₹)</StyledTableCell>
                                            <StyledTableCell align="right">Credit (₹)</StyledTableCell>
                                            <StyledTableCell align="right">Balance (₹)</StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredLedger.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                    <Typography color="textSecondary">No transactions found</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredLedger.map((entry, index) => {
                                                const isOpening = entry.type === "Opening Balance";
                                                const isReturn = entry.type.includes("Return") || entry.type.includes("Debit Note");
                                                const isPayment = entry.type.includes("Payment");
                                                const isPO = entry.type.includes("Purchase Order");

                                                return (
                                                    <TableRow key={index} hover sx={{ bgcolor: isOpening ? "rgba(102, 126, 234, 0.03)" : "inherit" }}>
                                                        <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                                                            {entry.date || "—"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                {isOpening && <AccountBalanceIcon fontSize="small" sx={{ color: "#667eea" }} />}
                                                                {isPO && <PurchaseIcon fontSize="small" sx={{ color: "#0284c7" }} />}
                                                                {isReturn && <AssignmentReturnIcon fontSize="small" sx={{ color: "#ed6c02" }} />}
                                                                {isPayment && <PaymentIcon fontSize="small" sx={{ color: "#16a34a" }} />}
                                                                <Typography variant="body2" fontWeight={isOpening ? 700 : 500}>
                                                                    {entry.type}
                                                                </Typography>
                                                                {isReturn && (
                                                                    <Chip label="Debit Note" size="small" color="warning" sx={{ height: 20, fontSize: 10 }} />
                                                                )}
                                                                {isPayment && (
                                                                    <Chip label="Payment" size="small" color="success" sx={{ height: 20, fontSize: 10 }} />
                                                                )}
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 600, color: entry.debit > 0 ? "warning.main" : "text.secondary" }}>
                                                            {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 600, color: entry.credit > 0 ? "error.main" : "text.secondary" }}>
                                                            {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <BalanceChip
                                                                label={
                                                                    entry.balance === 0
                                                                        ? "₹0.00"
                                                                        : entry.balance > 0
                                                                        ? `${formatCurrency(entry.balance)} Cr`
                                                                        : `${formatCurrency(Math.abs(entry.balance))} Dr`
                                                                }
                                                                balance={entry.balance}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}

                                        {/* Footer Row */}
                                        {filteredLedger.length > 0 && (
                                            <TableRow sx={{ bgcolor: "background.default", borderTop: "2px solid", borderColor: "divider" }}>
                                                <TableCell colSpan={2} sx={{ fontWeight: 800 }}>
                                                    Total / Net Closing Balance
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: "warning.main" }}>
                                                    {formatCurrency(totals.totalDebit)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: "error.main" }}>
                                                    {formatCurrency(totals.totalCredit)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <BalanceChip
                                                        label={
                                                            closingBalance === 0
                                                                ? "₹0.00 (Settled)"
                                                                : closingBalance > 0
                                                                ? `${formatCurrency(closingBalance)} Cr (Payable)`
                                                                : `${formatCurrency(Math.abs(closingBalance))} Dr (Advance)`
                                                        }
                                                        balance={closingBalance}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Box>
                )}
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Drawer>
    );
};

export default VendorLedger;