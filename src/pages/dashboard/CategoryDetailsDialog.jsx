import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { fmtAmt, months } from "./dashboardUtils";

export default function CategoryDetailsDialog({
  categories,
  isPopupOpen,
  popupData,
  popupMonth,
  popupYear,
  selectedCategory,
  setIsPopupOpen,
  setPopupMonth,
  setPopupYear,
  setSelectedCategory,
}) {
  return (
    <Dialog
      open={isPopupOpen}
      onClose={() => setIsPopupOpen(false)}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: "16px" } }}
    >
      <DialogTitle fontWeight={700}>📊 Category Details</DialogTitle>
      <DialogContent>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <Autocomplete
            options={categories}
            getOptionLabel={(o) => o.name}
            value={categories.find((c) => c.id === selectedCategory) || null}
            onChange={(_, v) => setSelectedCategory(v ? v.id : "")}
            renderInput={(p) => <TextField {...p} label="Category" size="small" fullWidth />}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            sx={{ flex: 1 }}
          />
          <TextField select label="Month" value={popupMonth} onChange={(e) => setPopupMonth(parseInt(e.target.value))} size="small" sx={{ minWidth: 130 }}>
            {months.map((m) => <MenuItem key={m.value} value={m.value}>{m.name}</MenuItem>)}
          </TextField>
          <TextField select label="Year" value={popupYear} onChange={(e) => setPopupYear(parseInt(e.target.value))} size="small" sx={{ minWidth: 90 }}>
            {[...Array(5)].map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <MenuItem key={y} value={y}>{y}</MenuItem>;
            })}
          </TextField>
        </Stack>

        <TableContainer sx={{ maxHeight: 300, borderRadius: "10px" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                {["Date", "Description", "Amount", "Type"].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {popupData.map((t, i) => (
                <TableRow key={i} hover>
                  <TableCell>{new Date(t.transaction_date).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{fmtAmt(t.amount)}</TableCell>
                  <TableCell><Chip label={t.category?.type} size="small" sx={{ fontSize: 10 }} /></TableCell>
                </TableRow>
              ))}
              {popupData.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: "#94a3b8" }}>No data</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" spacing={3} mt={2} p={1.5} bgcolor="#f8fafc" borderRadius="10px">
          <Box>
            <Typography variant="caption" color="text.secondary">Income</Typography>
            <Typography fontWeight={700} color="#16a34a">
              {fmtAmt(popupData.filter((t) => t.category?.type?.toLowerCase() === "income").reduce((s, t) => s + parseFloat(t.amount), 0))}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Expense</Typography>
            <Typography fontWeight={700} color="#dc2626">
              {fmtAmt(popupData.filter((t) => t.category?.type?.toLowerCase() === "expense").reduce((s, t) => s + parseFloat(t.amount), 0))}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Borrow</Typography>
            <Typography fontWeight={700}>
              {fmtAmt(popupData.filter((t) => t.category?.type?.toLowerCase() === "borrow").reduce((s, t) => s + parseFloat(t.amount), 0))}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setIsPopupOpen(false)} sx={{ borderRadius: "10px", textTransform: "none" }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
