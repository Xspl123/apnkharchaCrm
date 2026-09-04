import { Box, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import TablePagination from "@mui/material/TablePagination";

import { fmtAmt, getCategoryForTransaction, getTransactionDateValue } from "./dashboardUtils";

const isCreditCardAccount = (account) => account?.account_type === "credit_card";

export default function TransactionsTable({
  accounts = [],
  categories = [],
  filteredTableData,
  page,
  paginatedTableData,
  rowsPerPage,
  search,
  setPage,
  setRowsPerPage,
  setSearch,
}) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} mb={2} gap={1}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Transactions</Typography>
          <Typography variant="caption" color="text.secondary">{filteredTableData.length} records</Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: "100%", sm: 280 }, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
        />
      </Stack>
      <TableContainer sx={{ maxHeight: 400, borderRadius: "10px", bgcolor: "#ffffff", border: "1px solid #e5e7eb" }}>
        <Table size="small" stickyHeader sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              {["Date", "Description", "Account", "Amount", "Type", "Category"].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 800, color: "#374151", bgcolor: "#ffffff", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap", fontSize: 12 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTableData.map((t, i) => {
              const category = getCategoryForTransaction(t, categories);
              const account = accounts.find((item) => String(item.id) === String(t.account_id));
              const toAccount = accounts.find((item) => String(item.id) === String(t.transfer_to));
              const type = category?.type?.toLowerCase();
              const isIncome = type === "income";
              const isCardTransaction = isCreditCardAccount(account) || isCreditCardAccount(toAccount);
              const date = getTransactionDateValue(t.transaction_date);

              return (
                <TableRow key={t.id ?? i} hover sx={{ bgcolor: i % 2 === 0 ? "#fff" : "#fafafa", "&:hover": { bgcolor: "#f8fafc" }, "& td": { borderBottomColor: "#eef2f7" } }}>
                  <TableCell>{date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN") : "-"}</TableCell>
                  <TableCell>{t.description || "-"}</TableCell>
                  <TableCell>
                    <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" fontWeight={700}>{account?.account_name || "No account"}</Typography>
                      {isCardTransaction && (
                        <Chip label="Credit Card" size="small" sx={{ height: 20, fontSize: 10, bgcolor: "#fffbeb", color: "#92400e", fontWeight: 800 }} />
                      )}
                      {type === "transfer" && toAccount && (
                        <Typography variant="caption" color="text.secondary">to {toAccount.account_name}</Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: isIncome ? "#16a34a" : "#dc2626" }}>
                    {fmtAmt(t.amount)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={category?.type || "Unknown"}
                      size="small"
                      sx={{
                        fontSize: 10,
                        bgcolor: isIncome ? "#dcfce7" : "#fee2e2",
                        color: isIncome ? "#16a34a" : "#dc2626",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>{category?.name || "Uncategorized"}</TableCell>
                </TableRow>
              );
            })}
            {paginatedTableData.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "#94a3b8" }}>No transactions found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredTableData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </Paper>
  );
}
