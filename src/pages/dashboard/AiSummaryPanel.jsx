import { Paper, Stack, Typography, useTheme } from "@mui/material";
import { SmartToy } from "@mui/icons-material";

export default function AiSummaryPanel({ aiSummaryText }) {
  const theme = useTheme();
  const highlight = theme.palette.mode === "dark" ? "#fbbf24" : "#b45309";
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: "16px",
        background: theme.palette.mode === "dark"
          ? "linear-gradient(135deg, #1c2433, #172238)"
          : "linear-gradient(135deg, #fffdf5, #f8fbff)",
        border: `1px solid ${theme.palette.mode === "dark" ? "rgba(245,158,11,0.32)" : "rgba(245,158,11,0.2)"}`,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <SmartToy sx={{ color: highlight, fontSize: 20 }} />
        <Typography variant="caption" fontWeight={700} sx={{ color: highlight, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          AI Summary
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: theme.palette.text.primary, lineHeight: 1.8, fontWeight: 500 }}>
        {aiSummaryText}
      </Typography>
    </Paper>
  );
}
