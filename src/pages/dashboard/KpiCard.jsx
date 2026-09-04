import { Box, Paper, Stack, Typography } from "@mui/material";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";

export default function KpiCard({ title, value, subtitle, icon, color, delta }) {
  return (
    <Paper elevation={0} sx={{
      p: 2.5,
      borderRadius: "16px",
      border: `1px solid ${color}20`,
      background: `linear-gradient(135deg, ${color}08, white)`,
      boxShadow: `0 4px 20px ${color}15`,
      height: "100%",
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" fontWeight={600} sx={{ color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a", mt: 0.5, mb: 0.5 }}>
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>{subtitle}</Typography>
          {delta !== undefined && (
            <Stack direction="row" alignItems="center" spacing={0.3} mt={0.5}>
              {delta >= 0
                ? <ArrowUpward sx={{ fontSize: 12, color: "#16a34a" }} />
                : <ArrowDownward sx={{ fontSize: 12, color: "#dc2626" }} />
              }
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{ color: delta >= 0 ? "#16a34a" : "#dc2626" }}
              >
                {Math.abs(delta).toFixed(1)}% vs last month
              </Typography>
            </Stack>
          )}
        </Box>
        <Box sx={{
          width: 48,
          height: 48,
          borderRadius: "14px",
          bgcolor: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
        }}>
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}
