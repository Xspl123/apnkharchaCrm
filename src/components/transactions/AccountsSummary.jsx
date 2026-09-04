import PropTypes from "prop-types";
import { Box, Paper, Typography, Grid, Card, CardContent } from "@mui/material";
import { formatCurrency } from "../../hooks/useTransactionsPage";
import { getCreditCardAvailableLimit, getCreditCardOutstanding, isCreditCardAccount } from "../../utils/creditCardAccounts";

const AccountsSummary = ({ accounts, monthlyStats, selectedTab, setSelectedTab }) => {
    if (!accounts || accounts.length === 0) return null;

    return (
        <>
            <Box className="metric-banner-row">
                {/* <Paper elevation={2} className="metric-banner">
                    <Typography variant="body1" className="metric-banner-text">
                        Total: {formatCurrency(accounts.reduce((sum, account) => sum + parseFloat(account.account_balance), 0))}
                    </Typography>
                </Paper> */}
            </Box>

            <Box className="metric-banner-row transactions-page__balance-summary">
                <Paper elevation={2} className="metric-banner">
                    <Typography variant="body1" className="metric-banner-text">
                        This Month - Opening: {formatCurrency(monthlyStats.openingBalance)} | Income: {formatCurrency(monthlyStats.income)} | Expense: {formatCurrency(monthlyStats.netExpense)}
                        {monthlyStats.reimbursed > 0 && " (" + formatCurrency(monthlyStats.reimbursed) + " reimbursed)"} | Month Net: {formatCurrency(monthlyStats.periodNet ?? monthlyStats.net)} | Main Balance: {formatCurrency(monthlyStats.closingBalance)}
                        {monthlyStats.creditCardOutstanding > 0 && " | Card Outstanding: " + formatCurrency(monthlyStats.creditCardOutstanding)}
                    </Typography>
                </Paper>
            </Box>

            <Grid container spacing={2} justifyContent="center" className="cards-grid">
                {accounts.map((account, index) => (
                    <Grid item xs={12} sm={6} md={4} key={account.id}>
                        <Card
                            className={
                                "interactive-card transactions-page__summary-card" +
                                (selectedTab === index ? " transactions-page__summary-card--active" : "")
                            }
                            sx={{ boxShadow: selectedTab === index ? 6 : 2, '&:hover': { boxShadow: 4 } }}
                            onClick={() => setSelectedTab(index)}
                        >
                            <CardContent className="transactions-page__summary-card-content">
                                <Box className="transactions-page__summary-card-topline">
                                    <Typography variant="h6" className="transactions-page__summary-card-title">
                                        {account.account_name}
                                    </Typography>
                                    <span className={isCreditCardAccount(account) ? "transactions-page__account-badge transactions-page__account-badge--card" : "transactions-page__account-badge"}>
                                        {isCreditCardAccount(account) ? "Credit Card" : (account.account_type || "Account").replace("_", " ")}
                                    </span>
                                </Box>
                                {isCreditCardAccount(account) ? (
                                    <Box className="transactions-page__summary-values">
                                        <Box className="transactions-page__summary-value-row">
                                            <Typography variant="caption">Outstanding</Typography>
                                            <Typography variant="body2">{formatCurrency(getCreditCardOutstanding(account))}</Typography>
                                        </Box>
                                        <Box className="transactions-page__summary-value-row">
                                            <Typography variant="caption">Available</Typography>
                                            <Typography variant="body2">{formatCurrency(getCreditCardAvailableLimit(account))}</Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box className="transactions-page__summary-values">
                                        <Box className="transactions-page__summary-value-row">
                                            <Typography variant="caption">Balance</Typography>
                                            <Typography variant="body2">{formatCurrency(account.account_balance)}</Typography>
                                        </Box>
                                        <Box className="transactions-page__summary-value-row transactions-page__summary-value-row--empty" aria-hidden="true">
                                            <Typography variant="caption">Available</Typography>
                                            <Typography variant="body2">-</Typography>
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </>
    );
};

AccountsSummary.propTypes = {
    accounts: PropTypes.array.isRequired,
    monthlyStats: PropTypes.shape({
        openingBalance: PropTypes.number,
        income: PropTypes.number,
        netExpense: PropTypes.number,
        reimbursed: PropTypes.number,
        net: PropTypes.number,
        periodNet: PropTypes.number,
        closingBalance: PropTypes.number,
        availableBalance: PropTypes.number,
        creditCardOutstanding: PropTypes.number,
        creditCardAvailableLimit: PropTypes.number,
    }).isRequired,
    selectedTab: PropTypes.number.isRequired,
    setSelectedTab: PropTypes.func.isRequired,
};

export default AccountsSummary;
