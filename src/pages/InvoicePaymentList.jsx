// src/pages/InvoicePaymentList.jsx
import { getErrorMessage } from "../utils/getErrorMessage";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    getPayments,
    createPayment,
    updatePayment,
    deletePayment,
    refundPayment,
    reset,
} from "../redux/features/invoicePaymentSlice";
import { getInvoices } from "../redux/features/invoiceSlice";
import { getOrgAccounts } from "../features/finance/state/orgFinanceSlice";

import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Collapse,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    MenuItem,
    Select,
    Snackbar,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PaymentIcon from "@mui/icons-material/Payment";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import { ConfirmDialog, DataTable, FormSection, PageHeader, SearchFilterBar, StatusChip } from "../components/common";

const InvoicePaymentList = () => {

    const dispatch = useDispatch();

    const paymentState = useSelector((state) => state.invoicePayments);
    const payments = paymentState?.payments || [];

    const invoiceState = useSelector((state) => state.invoices);
    const invoices = invoiceState?.invoices || [];

    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const { accounts: orgAccounts = [] } = useSelector((s) => s.orgFinance || {});
    const [formData, setFormData] = useState({
        invoice_id: "",
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "cash",
        transaction_id: "",
        notes: "",
    });

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState(null);

    const [refundDialog, setRefundDialog] = useState(false);
    const [paymentToRefund, setPaymentToRefund] = useState(null);
    const [refundForm, setRefundForm] = useState({
        refund_date: new Date().toISOString().split("T")[0],
        refund_method: "cash",
        notes: "Product returned refund",
    });

    const [viewDialog, setViewDialog] = useState(false);
    const [paymentToView, setPaymentToView] = useState(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        dispatch(getPayments());
        dispatch(getInvoices());
        dispatch(getOrgAccounts());

        return () => {
            dispatch(reset());
        };
    }, [dispatch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.invoice_id || !formData.amount || !formData.payment_date) {
            setSnackbar({
                open: true,
                message: "Please fill required fields!",
                severity: "error",
            });
            return;
        }

        try {
            if (editMode && selectedPayment) {
                await dispatch(
                    updatePayment({
                        id: selectedPayment.id,
                        data: formData,
                    })
                ).unwrap();

                setSnackbar({
                    open: true,
                    message: "Payment updated successfully!",
                    severity: "success",
                });
            } else {
                await dispatch(createPayment(formData)).unwrap();

                setSnackbar({
                    open: true,
                    message: "Payment recorded successfully!",
                    severity: "success",
                });
            }

            setShowForm(false);
            setEditMode(false);
            setSelectedPayment(null);
            setFormData({
                invoice_id: "",
                amount: "",
                payment_date: new Date().toISOString().split("T")[0],
                payment_method: "cash",
                transaction_id: "",
                notes: "",
            });

            dispatch(getPayments());
            dispatch(getInvoices());
        } catch (err) {
            const errorMessage =
                getErrorMessage(err, "Operation failed!");
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: "error",
            });
        }
    };

    const handleOpenRefund = (payment) => {
        setPaymentToRefund(payment);
        setRefundForm({
            refund_date: new Date().toISOString().split("T")[0],
            refund_method: payment.payment_method || "cash",
            notes: `Refund for invoice #${payment.invoice?.invoice_no || payment.invoice_no || ""}`,
            account_id: payment.account_id || (orgAccounts[0]?.id || ""),
        });
        setRefundDialog(true);
    };

    const handleConfirmRefund = async () => {
        if (!paymentToRefund) return;
        try {
            await dispatch(
                refundPayment({
                    id: paymentToRefund.id,
                    data: refundForm,
                })
            ).unwrap();

            setSnackbar({
                open: true,
                message: "Payment refunded successfully! Ledger updated. ✅",
                severity: "success",
            });
            setRefundDialog(false);
            setPaymentToRefund(null);

            dispatch(getPayments());
            dispatch(getInvoices());
        } catch (err) {
            setSnackbar({
                open: true,
                message: getErrorMessage(err, "Failed to refund payment!"),
                severity: "error",
            });
        }
    };

    // Helper to check if payment belongs to a returned invoice or was already refunded
    const isPaymentReturned = (payment) => {
        if (payment.is_refunded) return true;
        if (payment.notes && typeof payment.notes === "string" && payment.notes.includes("[REFUNDED:")) return true;
        if (payment.is_invoice_returned || payment.invoice_status === "return") return true;
        const inv = invoices.find(
            (i) => i.id === payment.invoice_id || i.invoice_no === (payment.invoice?.invoice_no || payment.invoice_no)
        );
        return inv?.status === "return" || Boolean(inv?.is_return);
    };

    // Exclude returned invoice payments from collected metrics
    const activePayments = payments.filter((p) => !isPaymentReturned(p));

    const totalCollected = activePayments.reduce((sum, p) => {
        const num = parseFloat(String(p.amount || 0).replace(/,/g, ""));
        return sum + (isNaN(num) ? 0 : num);
    }, 0);

    const thisMonthCollected = activePayments
        .filter((p) => {
            if (!p.payment_date) return false;
            const pDate = new Date(p.payment_date);
            const now = new Date();
            return !isNaN(pDate.getTime()) && pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, p) => {
            const num = parseFloat(String(p.amount || 0).replace(/,/g, ""));
            return sum + (isNaN(num) ? 0 : num);
        }, 0);

    const handleEdit = (payment) => {
        setEditMode(true);
        setSelectedPayment(payment);
        setFormData({
            invoice_id: payment.invoice?.id || "",
            amount: payment.amount || "",
            payment_date: payment.payment_date || "",
            payment_method: payment.payment_method || "cash",
            transaction_id: payment.transaction_id || "",
            notes: payment.notes || "",
        });
        setShowForm(true);
    };

    const handleDeleteConfirm = (payment) => {
        setPaymentToDelete(payment);
        setDeleteDialog(true);
    };

    const handleDelete = async () => {
        try {
            await dispatch(deletePayment(paymentToDelete.id)).unwrap();

            setSnackbar({
                open: true,
                message: "Payment deleted successfully!",
                severity: "success",
            });

            setDeleteDialog(false);
            setPaymentToDelete(null);

            dispatch(getPayments());
            dispatch(getInvoices());
        } catch (err) {
            setSnackbar({
                open: true,
                message: getErrorMessage(err, "Failed to delete payment!"),
                severity: "error",
            });
        }
    };

    const handleView = (payment) => {
        setPaymentToView(payment);
        setViewDialog(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditMode(false);
        setSelectedPayment(null);
        setFormData({
            invoice_id: "",
            amount: "",
            payment_date: new Date().toISOString().split("T")[0],
            payment_method: "cash",
            transaction_id: "",
            notes: "",
        });
    };

    const filteredPayments = payments.filter((payment) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            payment.invoice?.invoice_no?.toLowerCase().includes(searchLower) ||
            payment.invoice?.client?.company_name?.toLowerCase().includes(searchLower) ||
            payment.payment_method?.toLowerCase().includes(searchLower) ||
            payment.transaction_id?.toLowerCase().includes(searchLower)
        );
    });

    const paginatedPayments = filteredPayments.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const handleChangePage = (_, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const formatPaymentAmount = (amount) => {
        const num = parseFloat(String(amount || 0).replace(/,/g, ""));
        return (isNaN(num) ? 0 : num).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Get unpaid/partial invoices only
    const unpaidInvoices = invoices.filter(
        (invoice) => invoice.status === "unpaid" || invoice.status === "partial"
    );

    // Get selected invoice details
    const selectedInvoice = invoices.find((inv) => inv.id === formData.invoice_id);

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <PageHeader
                title="Payment Records"
                subtitle="Record invoice collections and track payment references."
                icon={<PaymentIcon />}
                meta={`${payments.length} Payments`}
                actions={[
                    {
                        label: showForm ? "Cancel" : "Record Payment",
                        icon: <PaymentIcon />,
                        onClick: () => setShowForm(!showForm),
                    },
                ]}
            />

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
                        <CardContent>
                            <Typography variant="h6">Total Payments</Typography>
                            <Typography variant="h4">{payments.length}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white" }}>
                        <CardContent>
                            <Typography variant="h6">Total Collected</Typography>
                            <Typography variant="h4">
                                ₹{totalCollected.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white" }}>
                        <CardContent>
                            <Typography variant="h6">This Month</Typography>
                            <Typography variant="h4">
                                ₹{thisMonthCollected.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", color: "white" }}>
                        <CardContent>
                            <Typography variant="h6">Pending Invoices</Typography>
                            <Typography variant="h4">{unpaidInvoices.length}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Form */}
            <Collapse in={showForm}>
                <FormSection
                    title={editMode ? "Edit Payment" : "New Payment"}
                    sx={{ mb: 3 }}
                >
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Invoice Selection */}
                            <Grid item xs={12} md={6}>
                                <Select
                                    name="invoice_id"
                                    fullWidth
                                    required
                                    value={formData.invoice_id}
                                    onChange={handleChange}
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>
                                        Select Invoice
                                    </MenuItem>
                                    {unpaidInvoices.map((invoice) => (
                                        <MenuItem key={invoice.id} value={invoice.id}>
                                            {invoice.invoice_no} - {invoice.client?.company_name} (Balance: ₹{invoice.balance_amount})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Grid>

                            {/* Amount */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Amount (₹)"
                                    type="number"
                                    name="amount"
                                    fullWidth
                                    required
                                    value={formData.amount}
                                    onChange={handleChange}
                                    helperText={
                                        selectedInvoice
                                            ? `Balance Due: ₹${selectedInvoice.balance_amount}`
                                            : ""
                                    }
                                />
                            </Grid>

                            {/* Payment Date */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Payment Date"
                                    type="date"
                                    name="payment_date"
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.payment_date}
                                    onChange={handleChange}
                                />
                            </Grid>

                            {/* Payment Method */}
                            <Grid item xs={12} md={6}>
                                <Select
                                    name="payment_method"
                                    fullWidth
                                    required
                                    value={formData.payment_method}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="cash">💵 Cash</MenuItem>
                                    <MenuItem value="bank_transfer">🏦 Bank Transfer</MenuItem>
                                    <MenuItem value="upi">📱 UPI</MenuItem>
                                    <MenuItem value="cheque">📝 Cheque</MenuItem>
                                    <MenuItem value="card">💳 Card</MenuItem>
                                </Select>
                            </Grid>

                            {/* Notes */}
                            <Grid item xs={12}>
                                <TextField
                                    label="Notes"
                                    name="notes"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={formData.notes}
                                    onChange={handleChange}
                                />
                            </Grid>

                            {/* Action Buttons */}
                            <Grid item xs={12} sm={6}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="success"
                                    fullWidth
                                    size="large"
                                >
                                    {editMode ? "Update Payment" : "Save Payment"}
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    fullWidth
                                    size="large"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </FormSection>
            </Collapse>

            {/* Payments Table */}
            <FormSection title="All Payments">
                <SearchFilterBar
                    searchValue={searchQuery}
                    onSearchChange={(value) => {
                        setSearchQuery(value);
                        setPage(0);
                    }}
                    searchPlaceholder="Search payments..."
                    sx={{ mb: 0 }}
                />
                <DataTable
                    rows={paginatedPayments}
                    emptyMessage="No payments recorded yet."
                    pagination={{
                        count: filteredPayments.length,
                        rowsPerPage,
                        page,
                        rowsPerPageOptions: [5, 10, 25, 50],
                        onPageChange: handleChangePage,
                        onRowsPerPageChange: handleChangeRowsPerPage,
                    }}
                    columns={[
                        { field: "payment_date", headerName: "Date" },
                        {
                            id: "invoiceNo",
                            headerName: "Invoice No",
                            render: (_, payment) => {
                                const isRet = isPaymentReturned(payment);
                                return (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2" fontWeight="600">
                                            {payment.invoice?.invoice_no || payment.invoice_no || "-"}
                                        </Typography>
                                        {payment.is_refunded ? (
                                            <Chip
                                                label="REFUNDED"
                                                size="small"
                                                color="warning"
                                                sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
                                            />
                                        ) : isRet ? (
                                            <Chip
                                                label="RETURNED"
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: "0.68rem",
                                                    fontWeight: 700,
                                                    bgcolor: "rgba(100, 116, 139, 0.12)",
                                                    color: "#475569",
                                                    border: "1px solid rgba(100, 116, 139, 0.3)",
                                                }}
                                            />
                                        ) : null}
                                    </Stack>
                                );
                            },
                        },
                        {
                            id: "client",
                            headerName: "Client",
                            render: (_, payment) => payment.invoice?.client?.company_name || payment.client_name || "-",
                        },
                        {
                            field: "amount",
                            headerName: "Amount (₹)",
                            render: (value, payment) => {
                                const isRet = isPaymentReturned(payment);
                                return (
                                    <StatusChip
                                        status={payment.is_refunded ? "cancelled" : (isRet ? "cancelled" : "paid")}
                                        label={payment.is_refunded ? `REFUNDED ₹${formatPaymentAmount(value)}` : `₹${formatPaymentAmount(value)}`}
                                        sx={isRet || payment.is_refunded ? { textDecoration: "line-through", opacity: 0.65 } : {}}
                                    />
                                );
                            },
                        },
                        {
                            field: "payment_method",
                            headerName: "Method",
                            render: (value) => <StatusChip status="completed" label={value?.toUpperCase() || "-"} />,
                        },
                        { field: "transaction_id", headerName: "Transaction ID" },
                        {
                            id: "actions",
                            headerName: "Actions",
                            align: "center",
                            render: (_, payment) => {
                                const isRet = isPaymentReturned(payment);
                                return (
                                    <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                                        <IconButton size="small" color="info" onClick={() => handleView(payment)} title="View">
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                        {!isRet ? (
                                            <>
                                                <Tooltip title="Refund to Client" arrow>
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: "#f59e0b", "&:hover": { bgcolor: "rgba(245, 158, 11, 0.1)" } }}
                                                        onClick={() => handleOpenRefund(payment)}
                                                    >
                                                        <AssignmentReturnIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <IconButton size="small" color="primary" onClick={() => handleEdit(payment)} title="Edit">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </>
                                        ) : (
                                            <Chip
                                                label="Settled / Returned"
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: "0.65rem",
                                                    fontWeight: 700,
                                                    bgcolor: "rgba(100, 116, 139, 0.1)",
                                                    color: "#64748b",
                                                    border: "1px solid rgba(100, 116, 139, 0.2)",
                                                }}
                                            />
                                        )}
                                        <IconButton size="small" color="error" onClick={() => handleDeleteConfirm(payment)} title="Delete">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                );
                            },
                        },
                    ]}
                />
            </FormSection>

            {/* Delete Dialog */}
            <ConfirmDialog
                open={deleteDialog}
                title="Delete payment?"
                description={`Are you sure you want to delete this payment of ₹${paymentToDelete?.amount || "0"}?`}
                confirmLabel="Delete"
                onClose={() => setDeleteDialog(false)}
                onConfirm={handleDelete}
            />

            {/* Refund Dialog */}
            <Dialog
                open={refundDialog}
                onClose={() => setRefundDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: "#f59e0b", width: 40, height: 40 }}>
                            <AssignmentReturnIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Refund Payment
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Invoice #{paymentToRefund?.invoice_no || paymentToRefund?.invoice?.invoice_no} · {paymentToRefund?.client_name || paymentToRefund?.invoice?.client?.company_name}
                            </Typography>
                        </Box>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
                        Refund karne par client ke ledger mein <strong>Debit</strong> entry judegi aur closing balance settle ho jayega.
                    </Alert>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                                Refund Amount (₹)
                            </Typography>
                            <TextField
                                fullWidth
                                disabled
                                size="small"
                                value={paymentToRefund?.amount ? `₹${formatPaymentAmount(paymentToRefund.amount)}` : "₹0.00"}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                                Refund Date *
                            </Typography>
                            <TextField
                                fullWidth
                                required
                                type="date"
                                size="small"
                                value={refundForm.refund_date}
                                onChange={(e) => setRefundForm({ ...refundForm, refund_date: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                                Refund Method *
                            </Typography>
                            <Select
                                fullWidth
                                size="small"
                                value={refundForm.refund_method}
                                onChange={(e) => setRefundForm({ ...refundForm, refund_method: e.target.value })}
                            >
                                <MenuItem value="cash">💵 Cash</MenuItem>
                                <MenuItem value="bank_transfer">🏦 Bank Transfer</MenuItem>
                                <MenuItem value="upi">📱 UPI</MenuItem>
                                <MenuItem value="cheque">📝 Cheque</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                                Notes / Reason
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                value={refundForm.notes}
                                onChange={(e) => setRefundForm({ ...refundForm, notes: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setRefundDialog(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ bgcolor: "#f59e0b", "&:hover": { bgcolor: "#d97706" } }}
                        onClick={handleConfirmRefund}
                    >
                        Confirm Refund
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <Dialog
                open={viewDialog}
                onClose={() => setViewDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>💳 Payment Details</DialogTitle>
                <DialogContent>
                    {paymentToView && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Invoice:</strong> {paymentToView.invoice_no}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Client:</strong> {paymentToView.client_name}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Amount:</strong> ₹{formatPaymentAmount(paymentToView.amount)}
                                </Typography>
                            </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.5}>
                                        Refund From Account *
                                    </Typography>
                                    <Select
                                        fullWidth
                                        size="small"
                                        value={refundForm.account_id}
                                        onChange={(e) => setRefundForm({ ...refundForm, account_id: e.target.value })}
                                    >
                                        {orgAccounts.map((a) => (
                                            <MenuItem key={a.id} value={a.id}>
                                                {a.account_type === "cash" ? "💵 " : "🏦 "}
                                                {a.account_name || a.name} (₹{Number(a.current_balance || 0).toLocaleString("en-IN")})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Payment Date:</strong> {paymentToView.payment_date}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Payment Method:</strong>{" "}
                                    {paymentToView.payment_method?.toUpperCase()}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Transaction ID:</strong>{" "}
                                    {paymentToView.transaction_id || "N/A"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Notes:</strong> {paymentToView.notes || "N/A"}
                                </Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialog(false)} variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default InvoicePaymentList;