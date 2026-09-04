import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

import { fmtAmt } from "./dashboardUtils";

export default function MonthlySummaryTable({ monthlyComparisonData, selectedYear }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <Typography variant="h6" fontWeight={700} mb={0.5}>Month-wise Summary</Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>Period summary for {selectedYear}</Typography>
      <TableContainer sx={{ maxHeight: 300 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {["Month", "Income", "Expense", "Net"].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {monthlyComparisonData.map((d, i) => (
              <TableRow key={i} hover>
                <TableCell fontWeight={600}>{d.name}</TableCell>
                <TableCell sx={{ color: "#16a34a", fontWeight: 600 }}>{fmtAmt(d.Income)}</TableCell>
                <TableCell sx={{ color: "#dc2626", fontWeight: 600 }}>{fmtAmt(d.Expense)}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: d.Income - d.Expense >= 0 ? "#16a34a" : "#dc2626" }}>
                  {fmtAmt(d.Income - d.Expense)}
                </TableCell>
              </TableRow>
            ))}
            {monthlyComparisonData.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: "#94a3b8" }}>No data</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
