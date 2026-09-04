import { Box, Button, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { AccountBalanceWallet, Category, ReceiptLong } from "@mui/icons-material";

const setupItems = [
  { key: "account", title: "Add first account", description: "Cash, bank, wallet ya business account setup karo.", path: "/accounts", icon: <AccountBalanceWallet /> },
  { key: "transaction", title: "Add first transaction", description: "Income ya expense entry add karke dashboard live karo.", path: "/transactions", icon: <ReceiptLong /> },
  { key: "category", title: "Create category", description: "Food, salary, travel jaise categories organize karo.", path: "/categories", icon: <Category /> },
];

export default function DashboardSetupState({ hasAccounts, hasCategories, hasTransactions, loading, navigate }) {
  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <Stack spacing={1.5}>
          <Skeleton variant="text" width={220} height={30} />
          <Skeleton variant="rounded" height={92} />
          <Skeleton variant="rounded" height={92} />
        </Stack>
      </Paper>
    );
  }

  if (hasAccounts && hasCategories && hasTransactions) return null;

  const visibleItems = setupItems.filter((item) => {
    if (item.key === "account") return !hasAccounts;
    if (item.key === "category") return !hasCategories;
    return !hasTransactions;
  });

  return (
    <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: "16px", border: "1px solid #dbeafe", bgcolor: "#f8fbff" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={800}>Complete dashboard setup</Typography>
          <Typography variant="body2" color="text.secondary">Thoda data add hote hi cash flow, insights aur activity feed useful ho jayenge.</Typography>
        </Box>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: `repeat(${visibleItems.length || 1}, minmax(0, 1fr))` }, gap: 1.5 }}>
        {visibleItems.map((item) => (
          <Box key={item.key} sx={{ p: 2, borderRadius: "12px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
            <Stack direction="row" gap={1.5} alignItems="flex-start">
              <Stack alignItems="center" justifyContent="center" sx={{ width: 38, height: 38, borderRadius: "12px", bgcolor: "#eef2ff", color: "#4f46e5", flexShrink: 0 }}>
                {item.icon}
              </Stack>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={800}>{item.title}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.5} mb={1}>{item.description}</Typography>
                <Button size="small" onClick={() => navigate(item.path)} sx={{ textTransform: "none", fontWeight: 800, p: 0, minWidth: 0 }}>
                  Start
                </Button>
              </Box>
            </Stack>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
