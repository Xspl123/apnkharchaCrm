import { Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { ArrowForward, CreditCard, ReceiptLong } from "@mui/icons-material";
import { fmtAmt, getCategoryForTransaction, getTransactionDateValue } from "./dashboardUtils";

const isCreditCardAccount = (account) => account?.account_type === "credit_card";

export default function RecentActivityFeed({ accounts = [], categories = [], navigate, transactions = [] }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} gap={1}>
        <Box>
          <Typography variant="h6" fontWeight={800}>Recent Activity</Typography>
          <Typography variant="body2" color="text.secondary">Latest 5 transactions across accounts</Typography>
        </Box>
        <Button endIcon={<ArrowForward />} onClick={() => navigate("/transactions")} size="small" sx={{ textTransform: "none", fontWeight: 800 }}>
          View all
        </Button>
      </Stack>

      <Stack divider={<Divider flexItem />}>
        {transactions.map((transaction) => {
          const category = getCategoryForTransaction(transaction, categories);
          const account = accounts.find((item) => String(item.id) === String(transaction.account_id));
          const toAccount = accounts.find((item) => String(item.id) === String(transaction.transfer_to));
          const type = category?.type?.toLowerCase();
          const isIncome = type === "income" || type === "reimbursement";
          const isCardTransaction = isCreditCardAccount(account) || isCreditCardAccount(toAccount);
          const date = getTransactionDateValue(transaction.transaction_date);

          return (
            <Stack key={transaction.id} direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ py: 1.4 }}>
              <Stack direction="row" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
                <Stack alignItems="center" justifyContent="center" sx={{ width: 38, height: 38, borderRadius: "12px", bgcolor: isCardTransaction ? "#fffbeb" : isIncome ? "#dcfce7" : "#fee2e2", color: isCardTransaction ? "#92400e" : isIncome ? "#16a34a" : "#dc2626", flexShrink: 0 }}>
                  {isCardTransaction ? <CreditCard fontSize="small" /> : <ReceiptLong fontSize="small" />}
                </Stack>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={800} noWrap>{transaction.description || category?.name || "Transaction"}</Typography>
                  <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center">
                    <Typography variant="caption" color="text.secondary">{account?.account_name || "No account"}</Typography>
                    {type === "transfer" && toAccount && <Typography variant="caption" color="text.secondary">to {toAccount.account_name}</Typography>}
                    <Typography variant="caption" color="text.secondary">•</Typography>
                    <Typography variant="caption" color="text.secondary">{category?.name || "Uncategorized"}</Typography>
                    <Chip label={category?.type || "Unknown"} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                    {isCardTransaction && <Chip label="Credit Card" size="small" sx={{ height: 18, fontSize: 10, bgcolor: "#fffbeb", color: "#92400e", fontWeight: 800 }} />}
                  </Stack>
                </Box>
              </Stack>
              <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                <Typography variant="body2" fontWeight={800} sx={{ color: isIncome ? "#16a34a" : "#dc2626" }}>{isIncome ? "+" : "-"}{fmtAmt(transaction.amount)}</Typography>
                <Typography variant="caption" color="text.secondary">{date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN") : "-"}</Typography>
              </Box>
            </Stack>
          );
        })}
        {transactions.length === 0 && (
          <Box sx={{ py: 5, textAlign: "center", color: "#94a3b8" }}>
            <Typography variant="body2">No recent transactions found</Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
