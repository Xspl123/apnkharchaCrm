import { Box, Paper, Stack, Typography } from "@mui/material";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtAmt } from "./dashboardUtils";

const tooltipFormatter = (value, name) => [fmtAmt(value), name];

export default function CashFlowTimeline({ cashFlowData, dashboardSummary }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 14px 30px rgba(15, 23, 42, 0.05)" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5} mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={800}>Cash Flow Timeline</Typography>
          <Typography variant="body2" color="text.secondary">Daily income, expense, and closing balance movement</Typography>
        </Box>
        <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
          <Typography variant="caption" color="text.secondary">Closing Balance</Typography>
          <Typography variant="h6" fontWeight={800} sx={{ color: dashboardSummary.closingBalance < 0 ? "#dc2626" : "#0f766e" }}>
            {fmtAmt(dashboardSummary.closingBalance)}
          </Typography>
        </Box>
      </Stack>

      {cashFlowData.length > 0 ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.15fr 0.85fr" }, gap: 2 }}>
          <Box sx={{ height: { xs: 260, sm: 300 }, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData} margin={{ top: 8, right: 28, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN", { notation: "compact" })}`} />
                <Tooltip formatter={tooltipFormatter} />
                <Legend />
                <Line type="monotone" dataKey="Income" stroke="#16a34a" strokeWidth={2.4} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Expense" stroke="#dc2626" strokeWidth={2.4} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          <Box sx={{ height: { xs: 260, sm: 300 }, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 8, right: 28, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="closingBalanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN", { notation: "compact" })}`} />
                <Tooltip formatter={tooltipFormatter} />
                <Area type="monotone" dataKey="Closing" stroke="#0f766e" strokeWidth={2.4} fill="url(#closingBalanceFill)" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      ) : (
        <Box sx={{ py: 7, textAlign: "center", bgcolor: "#f8fafc", borderRadius: "12px", color: "#94a3b8" }}>
          <Typography variant="body2">No cash-flow movement available for this period</Typography>
        </Box>
      )}
    </Paper>
  );
}