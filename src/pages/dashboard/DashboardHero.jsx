import { Box, Button, Chip, IconButton, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import {
  Add,
  Category as CategoryIcon,
  FileDownload as ExportIcon,
  FilterAlt as FilterIcon,
  Mic as MicIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";
import { months } from "./dashboardUtils";

export default function DashboardHero({
  activeFilterLabel,
  availableTypes,
  dashboardSummary,
  endDate,
  exportToCSV,
  filterOpen,
  handleAskMe,
  handleExportSummaryPDF,
  handleQuickPeriod,
  isListening,
  navigate,
  selectedCategoryFilter,
  selectedMonth,
  selectedTypeFilter,
  selectedYear,
  setEndDate,
  setFilterOpen,
  setIsPopupOpen,
  setSelectedCategoryFilter,
  setSelectedMonth,
  setSelectedTypeFilter,
  setSelectedYear,
  setStartDate,
  startDate,
  supported,
  visibleCategories,
}) {
  const yearOptions = [...Array(5)].map((_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: y, label: y };
  });

  return (
    <Paper elevation={0} sx={{
      p: "28px 32px",
      borderRadius: "20px",
      mb: 3,
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 58%, #eef6ff 100%)",
      color: "#0f172a",
      border: "1px solid #e2e8f0",
      boxShadow: "0 14px 36px rgba(15,23,42,0.07)",
    }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={3}>
        <Box>
          <Typography variant="overline" sx={{ color: "#64748b", letterSpacing: "0.15em", fontWeight: 800 }}>
            Financial Command Center
          </Typography>
          <Typography variant="h4" fontWeight={800} mt={0.5}>
            {months[selectedMonth].name} {selectedYear}
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5, mb: 2 }}>
            {activeFilterLabel} · {dashboardSummary.transactionCount} transactions
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {[
              { label: "Current Month", period: "current" },
              { label: "Previous Month", period: "previous" },
              { label: "Reset Filters", period: "reset" },
            ].map((b) => (
              <Chip
                key={b.period}
                label={b.label}
                onClick={() => handleQuickPeriod(b.period)}
                size="small"
                sx={{
                  bgcolor: "#ffffff",
                  color: "#334155",
                  cursor: "pointer",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#f1f5f9" },
                  border: "1px solid #e2e8f0",
                }}
              />
            ))}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: "flex-start", md: "flex-end" }}>
          <Tooltip title="Add Transaction">
            <Button
              onClick={() => navigate("/transactions")}
              size="small"
              variant="contained"
              startIcon={<Add />}
              sx={{ bgcolor: "#16a34a", borderRadius: "10px", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#15803d" } }}
            >
              Add Transaction
            </Button>
          </Tooltip>
          <Tooltip title="Export CSV">
            <IconButton onClick={exportToCSV} size="small" sx={heroIconButtonSx}>
              <ExportIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export PDF">
            <IconButton onClick={handleExportSummaryPDF} size="small" sx={heroIconButtonSx}>
              <PdfIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Category Details">
            <IconButton onClick={() => setIsPopupOpen(true)} size="small" sx={heroIconButtonSx}>
              <CategoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isListening ? "Listening..." : "Voice Query"}>
            <IconButton
              onClick={handleAskMe}
              disabled={!supported || isListening}
              size="small"
              sx={{ ...heroIconButtonSx, bgcolor: isListening ? "#ede9fe" : "#fff", color: isListening ? "#7c3aed" : "#334155" }}
            >
              <MicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filters">
            <IconButton
              onClick={() => setFilterOpen(!filterOpen)}
              size="small"
              sx={{ ...heroIconButtonSx, bgcolor: filterOpen ? "#e0f2fe" : "#fff", color: filterOpen ? "#0369a1" : "#334155" }}
            >
              <FilterIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {filterOpen && (
        <Box mt={2.5} pt={2.5} sx={{ borderTop: "1px solid #e2e8f0" }}>
          <Stack direction={{ xs: "column", sm: "row" }} flexWrap="wrap" gap={1.5}>
            {[
              {
                label: "Month",
                value: selectedMonth,
                onChange: (v) => setSelectedMonth(parseInt(v)),
                options: months.map((m) => ({ value: m.value, label: m.name })),
              },
              { label: "Year", value: selectedYear, onChange: (v) => setSelectedYear(parseInt(v)), options: yearOptions },
              {
                label: "Type",
                value: selectedTypeFilter,
                onChange: (v) => setSelectedTypeFilter(v),
                options: [{ value: "all", label: "All Types" }, ...availableTypes.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))],
              },
              {
                label: "Category",
                value: selectedCategoryFilter,
                onChange: (v) => setSelectedCategoryFilter(v),
                options: [{ value: "all", label: "All Categories" }, ...visibleCategories.map((c) => ({ value: c.id, label: c.name }))],
              },
            ].map((f) => (
              <TextField
                key={f.label}
                select
                label={f.label}
                value={f.value}
                size="small"
                onChange={(e) => f.onChange(e.target.value)}
                sx={filterFieldSx}
              >
                {f.options.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            ))}
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              size="small"
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={dateFieldSx}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              size="small"
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={dateFieldSx}
            />
          </Stack>
        </Box>
      )}
    </Paper>
  );
}

const heroIconButtonSx = {
  bgcolor: "#fff",
  color: "#334155",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1" },
};

const filterFieldSx = {
  minWidth: 160,
  "& .MuiOutlinedInput-root": {
    bgcolor: "#fff",
    color: "#0f172a",
    borderRadius: "10px",
    "& fieldset": { borderColor: "#cbd5e1" },
    "&:hover fieldset": { borderColor: "#94a3b8" },
  },
  "& .MuiInputLabel-root": { color: "#64748b" },
  "& .MuiSelect-select": { color: "#0f172a" },
  "& .MuiSvgIcon-root": { color: "#64748b" },
};

const dateFieldSx = {
  minWidth: 160,
  "& .MuiOutlinedInput-root": {
    bgcolor: "#fff",
    color: "#0f172a",
    borderRadius: "10px",
    "& fieldset": { borderColor: "#cbd5e1" },
  },
  "& .MuiInputLabel-root": { color: "#64748b" },
  "& input": { color: "#0f172a", colorScheme: "light" },
};
