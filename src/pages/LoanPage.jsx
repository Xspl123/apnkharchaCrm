import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLoans } from "../redux/features/loanSlice";
import {
    Paper, CircularProgress,
    Typography, Accordion, AccordionSummary, AccordionDetails, Box, Container
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import { DataTable, PageHeader, StatusChip } from "../components/common";
import "./LoanPage.css";

function LoanPage() {
    const dispatch = useDispatch();
    const { loans, loading, error } = useSelector((state) => state.loans);

    useEffect(() => {
        dispatch(fetchLoans());
    }, [dispatch]);

    // Sort loans: pending first, then cleared
    const sortedLoans = loans ? [...loans].sort((a, b) => {
        // If a is pending and b is cleared, a should come first
        if (a.status.toLowerCase() === "pending" && b.status.toLowerCase() === "cleared") return -1;
        // If a is cleared and b is pending, b should come first
        if (a.status.toLowerCase() === "cleared" && b.status.toLowerCase() === "pending") return 1;
        // If both have same status, keep original order
        return 0;
    }) : [];

    // Calculate totals
    const pendingLoans = sortedLoans.filter(l => l.status.toLowerCase() === "pending");
    const clearedLoans = sortedLoans.filter(l => l.status.toLowerCase() === "cleared");
    
    const totalPendingAmount = pendingLoans.reduce((sum, loan) => sum + parseFloat(loan.balance), 0);
    const totalClearedAmount = clearedLoans.reduce((sum, loan) => sum + parseFloat(loan.total_borrowed), 0);
    const totalOverallAmount = sortedLoans.reduce((sum, loan) => sum + parseFloat(loan.total_borrowed), 0);

    return (
        <Container className="loan-page">
            <PageHeader
                title="Loan Records"
                subtitle="Track borrower balances, repayments and transaction history."
                meta={`${sortedLoans.length} Loans`}
            />

            {loading ? (
                <CircularProgress className="loan-page__loader" />
            ) : error ? (
                <Typography color="error" className="loan-page__error">
                    Error: {error}
                </Typography>
            ) : loans && loans.length > 0 ? (
                <>
                    {/* Loan Table */}
                    <DataTable
                        rows={sortedLoans}
                        rowSx={(loan) => ({
                            bgcolor: loan.status.toLowerCase() === "pending" ? "rgba(245, 158, 11, 0.06)" : undefined,
                        })}
                        columns={[
                            {
                                field: "person_name",
                                headerName: "Borrower Name",
                                cellSx: { fontWeight: 700 },
                            },
                            {
                                field: "total_borrowed",
                                headerName: "Total Loan Taken (₹)",
                                render: (value) => `₹${parseFloat(value).toFixed(2)}`,
                            },
                            {
                                field: "total_returned",
                                headerName: "Amount Repaid (₹)",
                                render: (value) => `₹${parseFloat(value).toFixed(2)}`,
                            },
                            {
                                field: "balance",
                                headerName: "Outstanding Balance (₹)",
                                render: (value) => `₹${parseFloat(value).toFixed(2)}`,
                            },
                            {
                                field: "status",
                                headerName: "Loan Status",
                                render: (value) => <StatusChip status={String(value).toLowerCase() === "cleared" ? "completed" : value} label={value} />,
                            },
                            {
                                field: "updated_at",
                                headerName: "Loan Modify Date",
                                render: (value) => new Date(value).toLocaleString(),
                            },
                        ]}
                    />

                    {/* Status Summary with Total Pending Amount */}
                    <Paper className="loan-page__summary">
                        <Box className="loan-page__summary-layout">
                            <Box>
                                <Typography variant="body1" className="loan-page__summary-line">
                                    <span className="loan-page__dot loan-page__dot--pending"></span>
                                    <strong>Pending Loans:</strong> {pendingLoans.length} | 
                                    <strong className="loan-page__summary-amount--pending">Total Pending Amount: ₹{totalPendingAmount.toFixed(2)}</strong>
                                </Typography>
                                <Typography variant="body1" className="loan-page__summary-line">
                                    <span className="loan-page__dot loan-page__dot--cleared"></span>
                                    <strong>Cleared Loans:</strong> {clearedLoans.length} | 
                                    <strong className="loan-page__summary-amount--cleared">Total Cleared Amount: ₹{totalClearedAmount.toFixed(2)}</strong>
                                </Typography>
                            </Box>
                            <Box className="loan-page__summary-total">
                                <Typography variant="body2">Total Overall Loans</Typography>
                                <Typography variant="h6" className="loan-page__summary-total-value">₹{totalOverallAmount.toFixed(2)}</Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Transaction History Timeline */}
                    <Typography variant="h6" className="loan-page__history-title">
                        Transaction History
                    </Typography>

                    {sortedLoans.map((loan) => (
                        <Accordion 
                            key={loan.id} 
                            className={`loan-page__accordion ${loan.status.toLowerCase() === "pending" ? "loan-page__accordion--pending" : ""}`}
                            elevation={loan.status.toLowerCase() === "pending" ? 3 : 1}
                        >
                            <AccordionSummary 
                                expandIcon={<ExpandMoreIcon />}
                                className={loan.status.toLowerCase() === "pending" ? "loan-page__accordion-summary--pending" : "loan-page__accordion-summary--cleared"}
                            >
                                <Typography className="loan-page__accordion-title">
                                    {loan.person_name} - History 
                                    <span className={`loan-page__status-chip ${loan.status.toLowerCase() === "pending" ? "loan-page__status-chip--pending" : "loan-page__status-chip--cleared"}`}>
                                        {loan.status}
                                    </span>
                                    {loan.status.toLowerCase() === "pending" && (
                                        <span className="loan-page__outstanding">
                                            (Outstanding: ₹{parseFloat(loan.balance).toFixed(2)})
                                        </span>
                                    )}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                {loan.transactions && loan.transactions.length > 0 ? (
                                    <Timeline position="alternate-reverse">
                                        {loan.transactions.map((tx, index) => (
                                            <TimelineItem key={tx.id}>
                                                <TimelineSeparator>
                                                    <TimelineDot
                                                        className={tx.transaction_type === "borrow" ? "loan-page__timeline-dot--borrow" : "loan-page__timeline-dot--return"}
                                                    />
                                                    {index !== loan.transactions.length - 1 && <TimelineConnector />}
                                                </TimelineSeparator>
                                                <TimelineContent>
                                                    <Typography variant="body1" fontWeight="bold">
                                                        {tx.transaction_type.toUpperCase()} — ₹{parseFloat(tx.amount).toFixed(2)}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {new Date(tx.transaction_date).toLocaleString()}
                                                    </Typography>
                                                </TimelineContent>
                                            </TimelineItem>
                                        ))}
                                    </Timeline>
                                ) : (
                                    <Typography>No transactions found.</Typography>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </>
            ) : (
                <Typography className="loan-page__empty">
                    No loan records found.
                </Typography>
            )}
        </Container>
    );
}

export default LoanPage;
