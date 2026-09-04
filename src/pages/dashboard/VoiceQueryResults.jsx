import { Alert, Box, Button, Chip, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { fmtAmt } from "./dashboardUtils";

export default function VoiceQueryResults({
  setShowVoiceResults,
  setVoiceError,
  setVoiceQueryResults,
  showVoiceResults,
  voiceError,
  voiceQueryResults,
}) {
  return (
    <>
      {voiceError && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setVoiceError("")}>
          {voiceError}
        </Alert>
      )}
      {showVoiceResults && voiceQueryResults.length > 0 && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={700}>🎤 Voice Query Results</Typography>
            <Button
              size="small"
              onClick={() => {
                setShowVoiceResults(false);
                setVoiceQueryResults([]);
                setVoiceError("");
              }}
              sx={{ borderRadius: "8px", textTransform: "none" }}
            >
              Clear
            </Button>
          </Stack>
          {voiceQueryResults.map((result, i) => (
            <Box key={i}>
              <Grid container spacing={2} mb={2}>
                {[
                  { label: "Category", value: result.category },
                  { label: "Month", value: `${result.month} ${result.year}` },
                  { label: "Income", value: fmtAmt(result.totalIncome) },
                  { label: "Expense", value: fmtAmt(result.totalExpense) },
                ].map((f) => (
                  <Grid item xs={6} sm={3} key={f.label}>
                    <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: "10px" }}>
                      <Typography variant="caption" color="text.secondary">{f.label}</Typography>
                      <Typography fontWeight={700} variant="body2">{f.value}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                      {["Date", "Description", "Amount", "Type"].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.transactions.map((t, ti) => (
                      <TableRow key={ti}>
                        <TableCell>{t.date}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>{fmtAmt(t.amount)}</TableCell>
                        <TableCell><Chip label={t.type} size="small" sx={{ fontSize: 10 }} /></TableCell>
                      </TableRow>
                    ))}
                    {result.transactions.length === 0 && <TableRow><TableCell colSpan={4} align="center">No transactions</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </Paper>
      )}
    </>
  );
}
