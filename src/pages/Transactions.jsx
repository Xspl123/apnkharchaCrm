import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTransactions, createTransaction,deleteTransactionApi } from "../redux/features/transactionSlice";
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

    // Filter transactions for the logged-in user
    const userTransactions = transactions.filter(transaction =>
        transaction.user_id === loggedInUser?.id
    );

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

    useEffect(() => {
        console.log("Transactions Data:", transactions);
        console.log("Categories Data:", categories);
        console.log("Accounts Data:", accounts);
    }, [transactions, categories, accounts]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
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
            user_id: loggedInUser?.id, // Ensure transactions are linked to the user
        };

        dispatch(createTransaction(transactionData))
            .unwrap()
            .then(() => {
                setSnackbar({ open: true, message: "Transaction added successfully!", severity: "success" });
                setShowForm(false);
                setFormData({ amount: "", date: "", description: "", category: "", account: "" });
            })
            .catch(() => {
                setSnackbar({ open: true, message: "Failed to add transaction!", severity: "error" });
            });
    };

    const generateColor = () => {
        const colors = [
            "#8884d8", "#82ca9d", "#ffc658", "#d0ed57", "#ff7300", 
            "#0088FE", "#00C49F", "#FF6347", "#6A5ACD", "#20B2AA"
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };
    

    const categoryData = categories.map((category, index) => {
        const totalAmount = userTransactions
            .filter((t) => t.category_id === category.id)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return {
            name: category.name,
            value: totalAmount,
            color: generateColor(index) // Assign unique color dynamically
        };
    }).filter((data) => data.value > 0);

    const handleDelete = (id) => {
        dispatch(deleteTransactionApi(id))
            .unwrap()
            .then(() => {
                setSnackbar({ open: true, message: "Transaction deleted successfully!", severity: "success" });
            })
            .catch(() => {
                setSnackbar({ open: true, message: "Failed to delete transaction!", severity: "error" });
            });
    };

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
                                <TextField
                                    label="Amount"
                                    type="number"
                                    name="amount"
                                    fullWidth
                                    required
                                    value={formData.amount}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Date"
                                    type="date"
                                    name="date"
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.date}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Select
                                    name="category"
                                    fullWidth
                                    required
                                    value={formData.category}
                                    onChange={(e) => handleChange({ target: { name: "category", value: e.target.value } })}
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>Select Category</MenuItem>
                                    {categories?.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                    ))}
                                </Select>
                            </Grid>
                            <Grid item xs={6}>
                                <Select
                                    name="account"
                                    fullWidth
                                    required
                                    value={formData.account}
                                    onChange={(e) => handleChange({ target: { name: "account", value: e.target.value } })}
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>Select Account</MenuItem>
                                    {accounts?.map((acc) => (
                                        <MenuItem key={acc.id} value={acc.id}>{acc.account_name}</MenuItem>
                                    ))}
                                </Select>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    name="description"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button type="submit" variant="contained" color="success" fullWidth>
                                    Save Transaction
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            )}

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && transactions && Array.isArray(transactions) && (
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: "#1976d2", color: "white" }}>
                                <TableCell sx={{ fontWeight: "bold", color: "white" }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: "bold", color: "white" }}>User</TableCell>
                                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Account</TableCell>
                                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Amount</TableCell>
                                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: "bold", color: "white" }}>Description</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {userTransactions.length > 0 ? (
                                userTransactions.map((transaction) => (
                                    <TableRow key={transaction.id} hover>
                                        <TableCell>{transaction.id}</TableCell>
                                        <TableCell>{transaction.User?.name || "N/A"}</TableCell>
                                        <TableCell>{transaction.Category?.name || "N/A"}</TableCell>
                                        <TableCell>{transaction.Account?.account_name || "N/A"}</TableCell>
                                        <TableCell>₹{transaction.amount}</TableCell>
                                        <TableCell>{transaction.date}</TableCell>
                                        <TableCell>{transaction.description}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body1" color="textSecondary">
                                            No transactions found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Animated Pie Chart */}
            <Paper sx={{ padding: 3, backgroundColor: "transparent", boxShadow: "none" }}>
                <Typography variant="h6" align="center">Category-wise Expenses</Typography>
                {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%" cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={140} // Increased outer radius
                                innerRadius={60}  // Added inner radius for donut effect
                                dataKey="value"
                                animationDuration={800}
                                isAnimationActive
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.color}
                                        stroke="#fff" 
                                        strokeWidth={2} // White stroke for a polished look
                                        style={{ transition: "transform 0.3s ease-in-out" }} 
                                        onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"} 
                                        onMouseLeave={(e) => e.target.style.transform = "scale(1)"} 
                                    />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "rgba(238, 242, 243, 0.8)", color: "#fff", borderRadius: "8px" }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <Typography align="center" color="textSecondary">No data available</Typography>
                )}
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Container>
    );
};

export default Transactions;
