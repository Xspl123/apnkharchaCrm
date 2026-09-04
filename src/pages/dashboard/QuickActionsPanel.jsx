import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Add, CallMade, Download, SwapHoriz } from "@mui/icons-material";

const actions = [
  { label: "Add Income", icon: <CallMade />, state: { quickAction: "income" }, color: "#16a34a" },
  { label: "Add Expense", icon: <Add />, state: { quickAction: "expense" }, color: "#dc2626" },
  { label: "Transfer", icon: <SwapHoriz />, state: { quickAction: "transfer" }, color: "#0891b2" },
];

export default function QuickActionsPanel({ handleDownloadReport, navigate }) {
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: "16px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
      <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={800}>Quick Actions</Typography>
          <Typography variant="body2" color="text.secondary">Dashboard se direct daily finance entries start karo</Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1} flexWrap="wrap">
          {actions.map((action) => (
            <Button
              key={action.label}
              startIcon={action.icon}
              onClick={() => navigate("/transactions", { state: action.state })}
              variant="outlined"
              sx={{
                borderRadius: "10px",
                borderColor: `${action.color}55`,
                color: action.color,
                fontWeight: 800,
                textTransform: "none",
                minHeight: 40,
                "&:hover": { borderColor: action.color, bgcolor: `${action.color}0f` },
              }}
            >
              {action.label}
            </Button>
          ))}
          <Button
            startIcon={<Download />}
            onClick={handleDownloadReport}
            variant="contained"
            sx={{ borderRadius: "10px", bgcolor: "#0f172a", fontWeight: 800, textTransform: "none", minHeight: 40, "&:hover": { bgcolor: "#1e293b" } }}
          >
            Download Report
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
