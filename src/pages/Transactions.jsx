import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTransactions, createTransaction, deleteTransactionApi } from "../redux/features/transactionSlice";
import { getCategoryAPI } from "../redux/features/categorySlice";
import { getAccountAPI } from "../redux/features/accountSlice";
import {
    Container,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    TableContainer,
    TextField,
    Button,
    Grid,
    MenuItem,
    Select,
    Snackbar,
    IconButton,
    Collapse,
    Alert
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Transactions = () => {
    const dispatch = useDispatch();
    const { transactions } = useSelector((state) => state.transactions);
    const { list: categories } = useSelector((state) => state.category);
    const { list: accounts } = useSelector((state) => state.accounts);
    const loggedInUser = useSelector((state) => state.auth.user);

    const [showForm, setShowForm] = useState(false);
    const [showTable, setShowTable] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        date: "",
        description: "",
        category: "",
        account: "",
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // Helper function to format the createdAt date
    const formatDateTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const options = {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        };
        return date.toLocaleString('en-US', options);
    };

    useEffect(() => {
        dispatch(fetchTransactions());
        dispatch(getCategoryAPI());
        dispatch(getAccountAPI());
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
        if (!formData.amount || !formData.date || !formData.category || !formData.account) {
            setSnackbar({ open: true, message: "Please fill in all required fields!", severity: "error" });
            return;
        }
        const transactionData = {
            amount: formData.amount,
            date: formData.date,
            description: formData.description,
            category_id: formData.category,
            account_id: formData.account,
            user_id: loggedInUser?.id,
        };
        try {
            await dispatch(createTransaction(transactionData)).unwrap();
            setSnackbar({ open: true, message: "Transaction added successfully!", severity: "success" });
            setShowForm(false);
            setFormData({ amount: "", date: "", description: "", category: "", account: "" });
        } catch (err) {
            const errorMessage = typeof err === "string" ? err : err?.error || "Failed to add transaction!";
            setSnackbar({ open: true, message: errorMessage, severity: "error" });
        }
    };

    const handleDelete = async (id) => {
        try {
            await dispatch(deleteTransactionApi(id)).unwrap();
            setSnackbar({ open: true, message: "Transaction deleted successfully!", severity: "success" });
        } catch (err) {
            setSnackbar({ open: true, message: err?.message || "Failed to delete transaction!", severity: "error" });
        }
    };

    const generateColor = () => {
        const colors = [
            "#8884d8", "#82ca9d", "#ffc658", "#d0ed57", "#ff7300",
            "#0088FE", "#00C49F", "#FF6347", "#6A5ACD", "#20B2AA"
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const userTransactions = transactions.filter(transaction => transaction.user_id === loggedInUser?.id);

    const categoryData = categories.map((category) => {
        const totalAmount = userTransactions
            .filter((t) => t.category_id === category.id)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        return { name: category.name, value: totalAmount, color: generateColor() };
    }).filter((data) => data.value > 0);

    return (
        <Container>
            <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: "bold", color: "#1976d2" }}>
                Transactions
            </Typography>

            {/* Aligned Buttons for Form and Table */}
            <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={6} sm="auto">
                    <Button variant="contained" color="primary" fullWidth onClick={() => setShowForm(!showForm)}>
                        {showForm ? "Cancel" : "Add Transaction"}
                    </Button>
                </Grid>
                <Grid item xs={6} sm="auto">
                    <Button variant="contained" color="secondary" fullWidth onClick={() => setShowTable(!showTable)}>
                        {showTable ? "Hide Transactions" : "Show Transactions"}
                    </Button>
                </Grid>
            </Grid>

            {/* Animated Form */}
            <Collapse in={showForm}>
                <Paper sx={{ padding: 3, marginBottom: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        New Transaction
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField label="Amount" type="number" name="amount" fullWidth required value={formData.amount} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField label="Date" type="date" name="date" fullWidth required InputLabelProps={{ shrink: true }} value={formData.date} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <Select name="category" fullWidth required value={formData.category} onChange={handleChange} displayEmpty>
                                    <MenuItem value="" disabled>Select Category</MenuItem>
                                    {categories?.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                    ))}
                                </Select>
                            </Grid>
                            <Grid item xs={6}>
                                <Select name="account" fullWidth required value={formData.account} onChange={handleChange} displayEmpty>
                                    <MenuItem value="" disabled>Select Account</MenuItem>
                                    {accounts?.map((acc) => (
                                        <MenuItem key={acc.id} value={acc.id}>{acc.account_name}</MenuItem>
                                    ))}
                                </Select>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Description" name="description" fullWidth multiline rows={2} value={formData.description} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12}>
                                <Button type="submit" variant="contained" color="success" fullWidth>
                                    Save Transaction
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Collapse>

            {/* Animated Table */}
            <Collapse in={showTable}>
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, mt: 2, overflow: "hidden" }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: "#1976d2" }}>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Created At</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Date</TableCell> 
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {userTransactions.map((transaction) => (
                                <TableRow
                                    key={transaction.id}
                                    sx={{
                                        transition: "all 0.3s ease",
                                        cursor: "pointer",
                                        "&:hover": {
                                            backgroundColor: "#f0f0f0",
                                            boxShadow: "0px 4px 12px rgba(0,0,0,0.1)"
                                        }
                                    }}
                                >
                                    <TableCell>{formatDateTime(transaction.createdAt)}</TableCell>
                                    <TableCell>{formatDateTime(transaction.date)}</TableCell>
                                    <TableCell>{transaction.Category?.name || "N/A"}</TableCell>
                                    <TableCell>₹{transaction.amount}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleDelete(transaction.id)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Collapse>

            {/* Always Visible Chart */}
            <Paper sx={{ padding: 3, marginTop: 3 }} elevation={3}>
                <Typography variant="h6" gutterBottom align="center">
                    Transaction Categories
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Paper>

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

export default Transactions;
