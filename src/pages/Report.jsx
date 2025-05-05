import React, { useState, useEffect } from "react";
import { Container, Typography, Grid, TextField, Button, Paper, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useMediaQuery, Snackbar, Alert } from "@mui/material";
import { saveAs } from "file-saver";
import { useDispatch, useSelector } from "react-redux";
import { fetchTransactions } from "../redux/features/transactionSlice";
import { getCategoryAPI } from "../redux/features/categorySlice";
import { getAccountAPI } from "../redux/features/accountSlice";

const Report = () => {
    const dispatch = useDispatch();
    const isMobile = useMediaQuery("(max-width:600px)"); // Detect mobile screen size
    const { transactions } = useSelector((state) => state.transactions);
    const { list: categories } = useSelector((state) => state.category);
    const { list: accounts } = useSelector((state) => state.accounts);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [analysisResult, setAnalysisResult] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    useEffect(() => {
        dispatch(fetchTransactions());
        dispatch(getCategoryAPI());
        dispatch(getAccountAPI());
    }, [dispatch]);

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleExportReport = () => {
        if (!startDate || !endDate) {
            setSnackbar({ open: true, message: "Please select both start and end dates to export the report!", severity: "warning" });
            return;
        }

        const filteredTransactions = transactions.filter((transaction) => {
            const transactionDate = new Date(transaction.transaction_date);
            return (
                (!startDate || transactionDate >= new Date(startDate)) &&
                (!endDate || transactionDate <= new Date(endDate))
            );
        });

        if (filteredTransactions.length === 0) {
            setSnackbar({ open: true, message: "No transactions found for the selected date range!", severity: "info" });
            return;
        }

        const reportData = filteredTransactions.map((transaction) => ({
            Date: transaction.transaction_date,
            Category: categories.find((cat) => cat.id === transaction.category_id)?.name || "N/A",
            Account: accounts.find((acc) => acc.id === transaction.account_id)?.account_name || "N/A",
            Amount: transaction.amount,
            Description: transaction.description || "N/A",
        }));

        const csvHeaders = ["Date", "Category", "Account", "Amount", "Description"];
        const csvContent = [
            csvHeaders.join(","),
            ...reportData.map((row) =>
                csvHeaders.map((header) => `"${row[header]}"`).join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `report_${startDate}_to_${endDate}.csv`);

        setSnackbar({ open: true, message: "Report exported successfully!", severity: "success" });
    };

    const handleAnalyzeReport = () => {
        if (!startDate || !endDate) {
            setSnackbar({ open: true, message: "Please select both start and end dates for analysis!", severity: "warning" });
            return;
        }

        const filteredTransactions = transactions.filter((transaction) => {
            const transactionDate = new Date(transaction.transaction_date);
            return (
                (!startDate || transactionDate >= new Date(startDate)) &&
                (!endDate || transactionDate <= new Date(endDate))
            );
        });

        if (filteredTransactions.length === 0) {
            setSnackbar({ open: true, message: "No transactions found for the selected date range!", severity: "info" });
            return;
        }

        // Perform analysis for both income and expense grouped by category type
        const categoryBreakdown = categories.map((category) => {
            const income = filteredTransactions
                .filter((transaction) => transaction.category_id === category.id && category.type === "Income")
                .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

            const expense = filteredTransactions
                .filter((transaction) => transaction.category_id === category.id && category.type === "Expense")
                .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0);

            return {
                name: category.name,
                type: category.type,
                sort_order: category.sort_order || 0,
                total_amount: (income - expense).toFixed(2),
                income,
                expense,
            };
        }).filter((category) => category.income > 0 || category.expense > 0);

        const totalIncome = categoryBreakdown.reduce((sum, category) => sum + category.income, 0);
        const totalExpense = categoryBreakdown.reduce((sum, category) => sum + category.expense, 0);

        setAnalysisResult({ categoryBreakdown, totalIncome, totalExpense });

        setSnackbar({ open: true, message: "Analysis completed successfully!", severity: "success" });
    };

    return (
        <Container sx={{ padding: isMobile ? 1 : 3 }}> {/* Adjust padding for mobile */}
            <Typography
                variant={isMobile ? "h5" : "h4"} // Smaller font size for mobile
                align="center"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#1976d2" }}
            >
                Reports
            </Typography>
            <Paper
                sx={{
                    padding: isMobile ? 2 : 3,
                    marginBottom: 3,
                    width: isMobile ? "100%" : "auto", // Adjust width for mobile
                }}
            >
                <Typography variant="h6" gutterBottom>
                    Generate Report
                </Typography>
                <Grid container spacing={isMobile ? 1 : 2} alignItems="center" justifyContent="flex-start">
                    {/* Adjust grid spacing */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="Start Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="End Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            size={isMobile ? "small" : "medium"} // Smaller button for mobile
                            onClick={handleExportReport}
                            sx={{ padding: "8px 16px" }} // Added padding
                        >
                            Export Report
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Button
                            variant="contained"
                            color="secondary"
                            fullWidth
                            size={isMobile ? "small" : "medium"} // Smaller button for mobile
                            onClick={handleAnalyzeReport}
                            sx={{ padding: "8px 16px" }} // Added padding
                        >
                            Analyze Report
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {analysisResult && (
                <Paper
                    sx={{
                        padding: isMobile ? 2 : 3,
                        marginTop: 3,
                        width: isMobile ? "100%" : "auto", // Adjust width for mobile
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Analysis Result
                    </Typography>
                    <Typography variant="h6" sx={{ marginTop: 2 }}>
                        Summary:
                    </Typography>
                    <Box sx={{ marginBottom: 2 }}>
                        <Typography>Total Income: ₹{analysisResult.totalIncome.toFixed(2)}</Typography>
                        <Typography>Total Expense: ₹{analysisResult.totalExpense.toFixed(2)}</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ marginTop: 2 }}>
                        Income vs Expense by Category:
                    </Typography>
                    <TableContainer component={Paper} sx={{ marginTop: 2, maxHeight: isMobile ? 300 : 400, overflow: "auto", width: isMobile ? "100%" : "auto" }}>
                        <Table stickyHeader size={isMobile ? "small" : "medium"}> {/* Smaller table for mobile */}
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: "bold" }}>Cat</TableCell> {/* Shortened Category */}
                                    <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }} align="right">Total (₹)</TableCell> {/* Shortened Total Amount */}
                                    <TableCell sx={{ fontWeight: "bold" }} align="right">Inc (₹)</TableCell> {/* Shortened Income */}
                                    <TableCell sx={{ fontWeight: "bold" }} align="right">Exp (₹)</TableCell> {/* Shortened Expense */}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {analysisResult.categoryBreakdown.map((category) => (
                                    <TableRow key={category.name}>
                                        <TableCell>{category.name}</TableCell>
                                        <TableCell>{category.type}</TableCell>
                                        <TableCell align="right">{category.total_amount}</TableCell>
                                        <TableCell align="right">{category.income.toFixed(2)}</TableCell>
                                        <TableCell align="right">{category.expense.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "top", horizontal: "right" }} // Changed position to top-right
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Report;
