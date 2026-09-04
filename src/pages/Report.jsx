import { useState, useEffect } from "react";
import { Container, Typography, Grid, TextField, Button, Box, useMediaQuery, Snackbar, Alert } from "@mui/material";
import { saveAs } from "file-saver";
import { useDispatch, useSelector } from "react-redux";
import { fetchTransactions } from "../redux/features/transactionSlice";
import { getCategoryAPI } from "../redux/features/categorySlice";
import { getAccountAPI } from "../redux/features/accountSlice";
import { DataTable, FormSection, PageHeader } from "../components/common";
import "./Report.css";

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

    const isCategoryMatch = (transaction, target) => {
        const category = transaction.category || categories.find((cat) => cat.id === transaction.category_id);
        return [category?.name, category?.type]
            .some((value) => value?.toLowerCase() === target);
    };

    const buildContributionRepaymentRows = (filteredTransactions) => {
        const contributionTransactions = filteredTransactions.filter((transaction) =>
            isCategoryMatch(transaction, "contribution")
        );
        const repaymentTransactions = filteredTransactions.filter((transaction) =>
            isCategoryMatch(transaction, "repayment")
        );

        return contributionTransactions.map((transaction) => {
            const linkedRepayments = repaymentTransactions.filter(
                (repayment) => repayment.description === transaction.description
            );

            return {
                id: transaction.id,
                contribution_date: transaction.transaction_date,
                contribution_category: transaction.category?.name || categories.find((cat) => cat.id === transaction.category_id)?.name || "N/A",
                contribution_account: transaction.account?.account_name || accounts.find((acc) => acc.id === transaction.account_id)?.account_name || "N/A",
                contribution_amount: transaction.amount,
                description: transaction.description || "N/A",
                repayment_dates: linkedRepayments.length > 0
                    ? linkedRepayments.map((repayment) => repayment.repayment_date || repayment.transaction_date || "N/A").join(", ")
                    : "N/A",
                repayment_by: linkedRepayments.length > 0
                    ? linkedRepayments.map((repayment) => repayment.repayment_by || "N/A").join(", ")
                    : "N/A",
            };
        });
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
            Category: categories.find((cat) => cat.id === transaction.category_id)?.name || transaction.category?.name || "N/A",
            Account: accounts.find((acc) => acc.id === transaction.account_id)?.account_name || transaction.account?.account_name || "N/A",
            Amount: transaction.amount,
            Description: transaction.description || "N/A",
            "Repayment Date": transaction.repayment_date || "",
            "Repayment By": transaction.repayment_by || "",
        }));

        const contributionRepaymentRows = buildContributionRepaymentRows(filteredTransactions).map((row) => ({
            Date: row.contribution_date,
            Category: row.contribution_category,
            Account: row.contribution_account,
            Amount: row.contribution_amount,
            Description: row.description,
            "Repayment Date": row.repayment_dates,
            "Repayment By": row.repayment_by,
        }));

        const csvHeaders = ["Date", "Category", "Account", "Amount", "Description", "Repayment Date", "Repayment By"];
        const csvContent = [
            csvHeaders.join(","),
            ...reportData.map((row) =>
                csvHeaders.map((header) => `"${row[header] ?? ""}"`).join(",")
            ),
            "",
            "Contribution Report With Repayment",
            csvHeaders.join(","),
            ...contributionRepaymentRows.map((row) =>
                csvHeaders.map((header) => `"${row[header] ?? ""}"`).join(",")
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
                .filter((transaction) => transaction.category_id === category.id && category.type === "income")
                .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

            const expense = filteredTransactions
                .filter((transaction) => transaction.category_id === category.id && category.type === "expense")
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
        const contributionRepaymentRows = buildContributionRepaymentRows(filteredTransactions);

        setAnalysisResult({ categoryBreakdown, totalIncome, totalExpense, contributionRepaymentRows });

        setSnackbar({ open: true, message: "Analysis completed successfully!", severity: "success" });
    };

    return (
        <Container className={`report-page${isMobile ? " report-page--mobile" : ""}`}>
            <PageHeader
                title="Reports"
                subtitle="Export transactions and analyze income, expenses and repayments."
            />
            <FormSection
                title="Generate Report"
                sx={{ mb: 3 }}
            >
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
                            className="report-page__button"
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
                            className="report-page__button"
                        >
                            Analyze Report
                        </Button>
                    </Grid>
                </Grid>
            </FormSection>

            {analysisResult && (
                <FormSection title="Analysis Result">
                    <Typography variant="h6" className="report-page__section-title">
                        Summary:
                    </Typography>
                    <Box className="report-page__summary">
                        <Typography>Total Income: ₹{analysisResult.totalIncome.toFixed(2)}</Typography>
                        <Typography>Total Expense: ₹{analysisResult.totalExpense.toFixed(2)}</Typography>
                        {/* Show current balance (sum of all account_balance) */}
                        <Typography>
                          Current Balance: ₹
                          {Array.isArray(accounts)
                            ? accounts.reduce((sum, acc) => sum + (parseFloat(acc.account_balance) || 0), 0).toFixed(2)
                            : "0.00"}
                        </Typography>
                    </Box>
                    <Typography variant="h6" className="report-page__section-title">
                        Income vs Expense by Category:
                    </Typography>
                    <DataTable
                        dense={isMobile}
                        stickyHeader
                        rows={analysisResult.categoryBreakdown}
                        getRowId={(row) => row.name}
                        columns={[
                            { field: "name", headerName: "Cat" },
                            { field: "type", headerName: "Type" },
                            { field: "total_amount", headerName: "Total (₹)", align: "right" },
                            { id: "income", headerName: "Inc (₹)", align: "right", render: (_, row) => row.income.toFixed(2) },
                            { id: "expense", headerName: "Exp (₹)", align: "right", render: (_, row) => row.expense.toFixed(2) },
                        ]}
                    />

                    <Typography variant="h6" className="report-page__section-title">
                        Contribution With Repayment:
                    </Typography>
                    <DataTable
                        dense={isMobile}
                        stickyHeader
                        rows={analysisResult.contributionRepaymentRows}
                        emptyMessage="No contribution records found."
                        columns={[
                            { field: "contribution_date", headerName: "Date" },
                            { field: "contribution_category", headerName: "Category" },
                            { field: "contribution_account", headerName: "Account" },
                            { id: "amount", headerName: "Amount (₹)", align: "right", render: (_, row) => Number(row.contribution_amount || 0).toFixed(2) },
                            { field: "description", headerName: "Description" },
                            { field: "repayment_dates", headerName: "Repayment Date" },
                            { field: "repayment_by", headerName: "Repayment By" },
                        ]}
                    />
                </FormSection>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "top", horizontal: "right" }} // Changed position to top-right
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} className="report-page__snackbar">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Report;
