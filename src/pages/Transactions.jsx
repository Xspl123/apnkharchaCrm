import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTransactions, createTransaction, deleteTransactionApi } from "../redux/features/transactionSlice";
import { getCategoryAPI } from "../redux/features/categorySlice";
import { getAccountAPI } from "../redux/features/accountSlice";
import {
    Container, Typography, Table, TableHead, TableRow, TableCell,
    TableBody, CircularProgress, Alert, Paper, TableContainer,
    TextField, Button, Grid, MenuItem, Select, Snackbar
} from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Transactions = () => {
    const dispatch = useDispatch();
    const { transactions, loading, error } = useSelector((state) => state.transactions);
    const { list: categories } = useSelector((state) => state.category);
    const { list: accounts } = useSelector((state) => state.accounts);
    const loggedInUser = useSelector((state) => state.auth.user);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        date: "",
        description: "",
        category: "",
        account: "",
    });

    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

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
            console.error("API Error:", err);

            // Ensure error message is extracted correctly
            const errorMessage = typeof err === "string" ? err : err?.error || "Failed to add transaction!";

            setSnackbar({ open: true, message: errorMessage, severity: "error" });
        }
    };



    const handleDelete = async (id) => {
        try {
            await dispatch(deleteTransactionApi(id)).unwrap();
            setSnackbar({ open: true, message: "Transaction deleted successfully!", severity: "success" });
        } catch (err) {
            console.error("Delete Error:", err);
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

            <Button
                variant="contained"
                color="primary"
                onClick={() => setShowForm(!showForm)}
                sx={{ mb: 2 }}
            >
                {showForm ? "Cancel" : "Add Transaction"}
            </Button>

            {showForm && (
                <Paper sx={{ padding: 3, marginBottom: 3 }}>
                    <Typography variant="h6" gutterBottom>New Transaction</Typography>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField label="Amount" type="number" name="amount" fullWidth required value={formData.amount} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField label="Date" type="date" name="date" fullWidth required InputLabelProps={{ shrink: true }} value={formData.date} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={6}>
                                <Select name="category" fullWidth required value={formData.category} onChange={(e) => handleChange({ target: { name: "category", value: e.target.value } })} displayEmpty>
                                    <MenuItem value="" disabled>Select Category</MenuItem>
                                    {categories?.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
                                </Select>
                            </Grid>
                            <Grid item xs={6}>
                                <Select name="account" fullWidth required value={formData.account} onChange={(e) => handleChange({ target: { name: "account", value: e.target.value } })} displayEmpty>
                                    <MenuItem value="" disabled>Select Account</MenuItem>
                                    {accounts?.map((acc) => <MenuItem key={acc.id} value={acc.id}>{acc.account_name}</MenuItem>)}
                                </Select>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Description" name="description" fullWidth multiline rows={2} value={formData.description} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12}>
                                <Button type="submit" variant="contained" color="success" fullWidth>Save Transaction</Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            )}

            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#1976d2", color: "white" }}>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {userTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>{transaction.id}</TableCell>
                                <TableCell>{transaction.Category?.name || "N/A"}</TableCell>
                                <TableCell>₹{transaction.amount}</TableCell>
                                <TableCell>{transaction.date}</TableCell>
                                <TableCell>
                                    <Button onClick={() => handleDelete(transaction.id)} color="error">Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "right" }} // 👈 Position at top-right
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

        </Container>
    );
};

export default Transactions;
