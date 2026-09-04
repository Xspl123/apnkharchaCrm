import { LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { fmtAmt } from "./dashboardUtils";

export default function ExpenseHealthBar({ dashboardSummary }) {
  const expPct = dashboardSummary.totalIncome > 0
    ? Math.min(100, (dashboardSummary.totalExpense / dashboardSummary.totalIncome) * 100)
    : 0;
  const color = expPct > 90 ? "#dc2626" : expPct > 70 ? "#f59e0b" : "#16a34a";

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", mb: 3, border: "1px solid #e2e8f0" }}>
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          Expense vs Income Utilization
        </Typography>
        <Typography variant="body2" fontWeight={700} sx={{ color }}>
          {expPct.toFixed(1)}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={expPct}
        sx={{
          height: 10,
          borderRadius: 5,
          bgcolor: "#f1f5f9",
          "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 5 },
        }}
      />
      <Stack direction="row" justifyContent="space-between" mt={0.5}>
        <Typography variant="caption" color="text.secondary">{fmtAmt(0)}</Typography>
        <Typography variant="caption" color="text.secondary">{fmtAmt(dashboardSummary.totalIncome)}</Typography>
      </Stack>
    </Paper>
  );
}
