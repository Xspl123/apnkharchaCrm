import PropTypes from "prop-types";
import { Container, Snackbar, Alert } from "@mui/material";
import { useTransactionsPage } from "../hooks/useTransactionsPage";
import { PageHeader } from "../components/common";
import AccountsSummary from "../components/transactions/AccountsSummary";
import TransactionForm from "../components/transactions/TransactionForm";
import TransactionsTable from "../components/transactions/TransactionsTable";
import DeleteTransactionDialog from "../components/transactions/DeleteTransactionDialog";
import "./Transactions.css";

const Transactions = () => {
    const t = useTransactionsPage();

    return (
        <Container className="page-shell">
            <PageHeader
                title="Transactions"
                subtitle="Track expenses, income, account transfers, and repayments."
                actions={[
                    {
                        label: t.showForm ? "Cancel" : "Add Transaction",
                        onClick: () => t.setShowForm(!t.showForm),
                    },
                    ...(String(t.loggedInUser?.id) === "6"
                        ? [
                            {
                                label: "Download Contribution Report",
                                variant: "outlined",
                                color: "secondary",
                                onClick: t.handleDownloadContributionReport,
                            },
                        ]
                        : []),
                ]}
            />

            <AccountsSummary
                accounts={t.accounts}
                monthlyStats={t.monthlyStats}
                selectedTab={t.selectedTab}
                setSelectedTab={t.setSelectedTab}
            />

            <TransactionForm
                showForm={t.showForm}
                formData={t.formData}
                setFormData={t.setFormData}
                categories={t.categories}
                accounts={t.accounts}
                loans={t.loans}
                handleChange={t.handleChange}
                handleSubmit={t.handleSubmit}
                handleSpeechToText={t.handleSpeechToText}
                categoryType={t.categoryType}
                isRepaymentCategory={t.isRepaymentCategory}
                contributionOptions={t.contributionOptions}
                calculatorOpen={t.calculatorOpen}
                handleCalculatorOpen={t.handleCalculatorOpen}
                handleCalculatorClose={t.handleCalculatorClose}
                handleCalculatorSubmit={t.handleCalculatorSubmit}
            />

            <TransactionsTable
                searchQuery={t.searchQuery}
                handleSearchChange={t.handleSearchChange}
                paginatedTransactions={t.paginatedTransactions}
                filteredTransactions={t.filteredTransactions}
                rowsPerPage={t.rowsPerPage}
                page={t.page}
                handleChangePage={t.handleChangePage}
                handleChangeRowsPerPage={t.handleChangeRowsPerPage}
                requestDeleteConfirmation={t.requestDeleteConfirmation}
            />

            <Snackbar open={t.snackbar.open} autoHideDuration={3000} onClose={t.handleSnackbarClose}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert onClose={t.handleSnackbarClose} severity={t.snackbar.severity} variant="filled">
                    {t.snackbar.message}
                </Alert>
            </Snackbar>

            <DeleteTransactionDialog
                deleteCandidateId={t.deleteCandidateId}
                handleDeleteDialogClose={t.handleDeleteDialogClose}
                handleDelete={t.handleDelete}
            />
        </Container>
    );
};

Transactions.propTypes = {
    payload: PropTypes.arrayOf(PropTypes.shape({ dates: PropTypes.string })),
};

export default Transactions;
