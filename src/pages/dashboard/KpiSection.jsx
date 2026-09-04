import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { AccountBalanceWallet, CreditCard, Moving, ReceiptLong, TrendingDown, TrendingUp } from "@mui/icons-material";
import { calcDelta, fmtAmt } from "./dashboardUtils";

const items = [
  { key: "opening", title: "Opening Balance", getValue: (s) => s.openingBalance, subtitle: "Brought forward", icon: <AccountBalanceWallet />, color: "#4f46e5" },
  { key: "current", title: "Main Balance", getValue: (s) => s.closingBalance, subtitle: "Cash and bank only", icon: <ReceiptLong />, color: "#0891b2" },
  { key: "income", title: "This Month Income", getValue: (s) => s.totalIncome, subtitle: "Filtered inflow", icon: <TrendingUp />, color: "#16a34a" },
  { key: "expense", title: "This Month Expense", getValue: (s) => s.totalExpense, subtitle: "Filtered outflow", icon: <TrendingDown />, color: "#dc2626" },
  { key: "net", title: "Net Movement", getValue: (s) => s.periodNet, subtitle: "Income minus outflow", icon: <Moving />, color: "#0f766e" },
  { key: "card", title: "Card Outstanding", getValue: (s) => s.creditCardOutstanding, subtitle: "Credit card liability", icon: <CreditCard />, color: "#f59e0b" },
];

export default function KpiSection({ dashboardSummary, previousPeriodSummary }) {
  return (
    <Grid container spacing={1.5} mb={3}>
      {items.map((item) => {
        const value = item.getValue(dashboardSummary);
        const previousValue = item.key === "income"
          ? previousPeriodSummary.totalIncome
          : item.key === "expense"
            ? previousPeriodSummary.totalExpense
            : undefined;
        const delta = previousValue !== undefined ? calcDelta(value, previousValue) : undefined;

        return (
          <Grid item xs={12} sm={6} md={2} key={item.key}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                height: "100%",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                boxShadow: "0 12px 26px rgba(15, 23, 42, 0.06)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#64748b", textTransform: "uppercase" }}>
                    {item.title}
                  </Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ color: value < 0 ? "#dc2626" : "#0f172a", mt: 0.5 }} noWrap>
                    {fmtAmt(value)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: item.key === "card" && dashboardSummary.creditCardLimit > 0 ? "#92400e" : "#94a3b8", fontWeight: item.key === "card" ? 700 : 400 }}>
                    {item.key === "card" && dashboardSummary.creditCardLimit > 0
                      ? `${((dashboardSummary.creditCardOutstanding / dashboardSummary.creditCardLimit) * 100).toFixed(1)}% used | Available ${fmtAmt(dashboardSummary.creditCardAvailableLimit)}`
                      : delta !== undefined ? `${Math.abs(delta).toFixed(1)}% vs last month` : item.subtitle}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "12px",
                    bgcolor: `${item.color}14`,
                    color: item.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    "& svg": { fontSize: 21 },
                  }}
                >
                  {item.icon}
                </Box>
              </Stack>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}
