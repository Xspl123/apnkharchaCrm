import { Grid, Paper, Stack, Typography } from "@mui/material";
import { Insights, PieChart, Savings } from "@mui/icons-material";
import { fmtAmt } from "./dashboardUtils";

const getRatioTone = (ratio) => ratio >= 90 ? "#dc2626" : ratio >= 70 ? "#f59e0b" : "#16a34a";

export default function SmartInsightsPanel({ insights }) {
  const change = insights.categoryExpenseChange;
  const changeText = !change
    ? "Category trend data unavailable"
    : change.percent === null
      ? `${change.category} has no previous-month baseline`
      : `${change.category} last month se ${Math.abs(change.percent).toFixed(1)}% ${change.percent >= 0 ? "zyada" : "kam"} hai`;
  const coverText = insights.coverDays === null
    ? "Expense average available nahi hai"
    : `Current balance ${Math.floor(insights.coverDays)} din ke average expense cover karta hai`;

  const cards = [
    {
      title: "Expense Utilization",
      value: `${insights.expenseRatio.toFixed(1)}%`,
      detail: `Aapka expense income ka ${insights.expenseRatio.toFixed(1)}% hai`,
      icon: <PieChart />,
      color: getRatioTone(insights.expenseRatio),
    },
    {
      title: "Category Momentum",
      value: change?.percent === null || !change ? "New" : `${change.percent >= 0 ? "+" : ""}${change.percent.toFixed(1)}%`,
      detail: changeText,
      icon: <Insights />,
      color: change?.percent > 0 ? "#f59e0b" : "#16a34a",
    },
    {
      title: "Runway Cover",
      value: insights.coverDays === null ? "-" : `${Math.floor(insights.coverDays)} days`,
      detail: `${coverText}. Avg daily expense ${fmtAmt(insights.averageDailyExpense)} hai`,
      icon: <Savings />,
      color: insights.coverDays !== null && insights.coverDays < 15 ? "#dc2626" : "#0f766e",
    },
  ];

  return (
    <Grid container spacing={2} mb={3}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} md={4} key={card.title}>
          <Paper elevation={0} sx={{ p: 2.5, height: "100%", borderRadius: "16px", border: "1px solid #e2e8f0", background: "#fff" }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Stack sx={{ width: 42, height: 42, borderRadius: "13px", bgcolor: `${card.color}14`, color: card.color, flexShrink: 0 }} alignItems="center" justifyContent="center">
                {card.icon}
              </Stack>
              <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                <Typography variant="caption" fontWeight={800} sx={{ color: "#64748b", textTransform: "uppercase" }}>{card.title}</Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color: card.color }}>{card.value}</Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.55}>{card.detail}</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}