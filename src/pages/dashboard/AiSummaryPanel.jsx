import { Paper, Stack, Typography } from "@mui/material";
import { SmartToy } from "@mui/icons-material";

export default function AiSummaryPanel({ aiSummaryText }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: "16px",
        background: "linear-gradient(135deg, #fffdf5, #f8fbff)",
        border: "1px solid rgba(245,158,11,0.2)",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <SmartToy sx={{ color: "#b45309", fontSize: 20 }} />
        <Typography variant="caption" fontWeight={700} sx={{ color: "#b45309", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          AI Summary
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" lineHeight={1.8}>{aiSummaryText}</Typography>
    </Paper>
  );
}
