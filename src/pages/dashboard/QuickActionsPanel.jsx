import { Box, Button, Paper, Stack, Typography, useTheme } from "@mui/material";
import { Add, CallMade, Download, SwapHoriz } from "@mui/icons-material";

const actions = [
  { label: "Add Income", icon: <CallMade />, state: { quickAction: "income" }, color: "#16a34a" },
  { label: "Add Expense", icon: <Add />, state: { quickAction: "expense" }, color: "#dc2626" },
  { label: "Transfer", icon: <SwapHoriz />, state: { quickAction: "transfer" }, color: "#0891b2" },
];

export default function QuickActionsPanel({ handleDownloadReport, navigate }) {
  const theme = useTheme();
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: "16px", border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
      <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={800}>Quick Actions</Typography>
          <Typography variant="body2" color="text.secondary">Start recording daily finances directly from the dashboard.</Typography>
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
                borderColor: `${action.color}88`,
                color: action.color,
                fontWeight: 800,
                textTransform: "none",
                minHeight: 40,
                "&:hover": { borderColor: action.color, bgcolor: theme.palette.action.hover },
              }}
            >
              {action.label}
            </Button>
          ))}
          <Button
            startIcon={<Download />}
            onClick={handleDownloadReport}
            variant="contained"
            sx={{ borderRadius: "10px", bgcolor: theme.palette.primary.main, color: theme.palette.mode === "dark" ? "#0b1220" : "#fff", fontWeight: 800, textTransform: "none", minHeight: 40, "&:hover": { bgcolor: theme.palette.primary.dark } }}
          >
            Download Report
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
