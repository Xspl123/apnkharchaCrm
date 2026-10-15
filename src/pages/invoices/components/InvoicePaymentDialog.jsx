import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import usePermission from "../../../hooks/usePermission";
import { getOrgAccounts } from "../../../features/finance/state/orgFinanceSlice";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Select,
    MenuItem,
    Typography,
    Stack,
    Box,
    Avatar,
    Divider,
    Paper,
    Chip,
} from "@mui/material";
import {
    Payment as PaymentIcon,
} from "@mui/icons-material";
import { GradientButton } from "./invoiceStyledComponents";

const InvoicePaymentDialog = ({
    open,
    onClose,
    invoice,
    onSavePayment,
    formatCurrency,
    formatDate,
    loading = false,
}) => {
    const permissionApi = usePermission();
    const canViewBalance = permissionApi.can("org_accounts.view");
    const dispatch = useDispatch();
    const { accounts = [] } = useSelector((s) => s.orgFinance || {});
    const [accountId, setAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
    const [transactionId, setTransactionId] = useState("");
    const [notes, setNotes] = useState("");

    const balance = parseFloat(invoice?.balance_amount || 0);
    const total = parseFloat(invoice?.total_amount || 0);
    const paid = parseFloat(invoice?.paid_amount || 0);

    useEffect(() => {
        if (open) {
            dispatch(getOrgAccounts());
        }
    }, [open, dispatch]);

    useEffect(() => {
        if (invoice && open) {
            setAmount(balance > 0 ? balance.toFixed(2) : "");
            setPaymentDate(new Date().toISOString().split("T")[0]);
            setPaymentMethod("bank_transfer");
            setTransactionId("");
            setNotes("");
            const defAcc = accounts.find((a) => a.is_default) || accounts[0];
            setAccountId(defAcc ? defAcc.id : "");
        }
    }, [invoice, open, balance, accounts.length]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) return;

        onSavePayment({
            invoice_id: invoice.id,
            account_id: accountId ? Number(accountId) : undefined,
            amount: numAmount,
            payment_date: paymentDate,
            payment_method: paymentMethod,
            transaction_id: transactionId.trim() || undefined,
            notes: notes.trim() || undefined,
        });
    };

    if (!invoice) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ bgcolor: "#10b981", width: 40, height: 40 }}>
                        <PaymentIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={700}>
                            Record Payment
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Invoice #{invoice.invoice_no} · {invoice.client?.company_name || "Client"}
                        </Typography>
                    </Box>
                    <Chip
                        label={invoice.status?.toUpperCase()}
                        color={invoice.status === "paid" ? "success" : "warning"}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: "11px" }}
                    />
                </Stack>
            </DialogTitle>

            <Divider />

            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ pt: 2.5 }}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 1.5,
                            mb: 2.5,
                            bgcolor: "background.default",
                            borderRadius: 2,
                        }}
                    >
                        <Grid container spacing={2} textAlign="center">
                            <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">Total Invoice</Typography>
                                <Typography variant="subtitle1" fontWeight={700}>{formatCurrency(total)}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">Already Paid</Typography>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#10b981" }}>{formatCurrency(paid)}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">Balance Remaining</Typography>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: balance > 0 ? "#f59e0b" : "text.primary" }}>{formatCurrency(balance)}</Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                                Payment Amount (₹) *
                            </Typography>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                size="small"
                                inputProps={{ min: "0.01", max: balance > 0 ? balance : total, step: "0.01" }}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                helperText={
                                    balance > 0 && parseFloat(amount) < balance
                                        ? `Remaining: ${formatCurrency(balance - (parseFloat(amount) || 0))}`
                                        : "Full balance will be settled"
                                }
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                                Payment Date *
                            </Typography>
                            <TextField
                                fullWidth
                                required
                                type="date"
                                size="small"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                                Payment Method *
                            </Typography>
                            <Select
                                fullWidth
                                size="small"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                                <MenuItem value="bank_transfer">🏦 Bank Transfer</MenuItem>
                                <MenuItem value="upi">📱 UPI</MenuItem>
                                <MenuItem value="cash">💵 Cash</MenuItem>
                                <MenuItem value="cheque">📝 Cheque</MenuItem>
                                <MenuItem value="card">💳 Card</MenuItem>
                            </Select>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                                Deposit Into Account (Auto-sync)
                            </Typography>
                            <Select
                                fullWidth
                                size="small"
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                displayEmpty
                            >
                                <MenuItem value=""><em>-- Don't link account --</em></MenuItem>
                                    {accounts.map((a) => (
                                        <MenuItem key={a.id} value={a.id}>
                                            {a.account_type === "cash" ? "💵 " : "🏦 "}
                                            {a.account_name || a.name}
                                            {canViewBalance ? ` (${formatCurrency(a.current_balance)})` : ""}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </Grid>

                        <Grid item xs={12} sm={12}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                                Reference / Transaction ID
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="UTR / Ref / Cheque No."
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                                Notes / Remarks
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                multiline
                                rows={2}
                                placeholder="Optional payment notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "10px" }}>
                        Cancel
                    </Button>
                    <GradientButton type="submit" disabled={loading}>
                        {loading ? "Recording..." : "Save Payment"}
                    </GradientButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default InvoicePaymentDialog;