import { Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { fmtAmt } from "./dashboardUtils";

const toneMap = {
  success: { color: "#16a34a", bg: "#dcfce7" },
  warning: { color: "#d97706", bg: "#fef3c7" },
  danger: { color: "#dc2626", bg: "#fee2e2" },
};

export default function InsightsSection({ topSpendingCategories }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1} mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={800}>Top Spending Categories</Typography>
          <Typography variant="body2" color="text.secondary">Category cards with utilization and risk colors</Typography>
        </Box>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" }, gap: 1.5 }}>
        {topSpendingCategories.map((item) => {
          const tone = toneMap[item.tone] || toneMap.success;
          return (
            <Box key={item.name} sx={{ p: 1.75, borderRadius: "12px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
              <Stack spacing={1.1}>
                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                  <Typography variant="body2" fontWeight={800} sx={{ color: "#0f172a", minWidth: 0 }} noWrap>{item.name}</Typography>
                  <Typography variant="caption" fontWeight={800} sx={{ color: tone.color, bgcolor: tone.bg, px: 0.8, py: 0.2, borderRadius: "999px", flexShrink: 0 }}>
                    {item.share.toFixed(0)}%
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight={800}>{fmtAmt(item.Expense)}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, item.utilization)}
                  sx={{ height: 8, borderRadius: 4, bgcolor: "#f1f5f9", "& .MuiLinearProgress-bar": { bgcolor: tone.color, borderRadius: 4 } }}
                />
                <Typography variant="caption" color="text.secondary">{item.share.toFixed(1)}% of total expense</Typography>
              </Stack>
            </Box>
          );
        })}
        {topSpendingCategories.length === 0 && (
          <Box sx={{ gridColumn: "1 / -1", py: 5, textAlign: "center", bgcolor: "#f8fafc", borderRadius: "12px", color: "#94a3b8" }}>
            <Typography variant="body2">No spending category data available</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}