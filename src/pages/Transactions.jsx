import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTransactions, createTransaction } from "../redux/features/transactionSlice";
import { getCategoryAPI } from "../redux/features/categorySlice";
import { getAccountAPI } from "../redux/features/accountSlice";
import {
    Container, Typography, Table, TableHead, TableRow, TableCell,
    TableBody, CircularProgress, Alert, Paper, TableContainer,
    TextField, Button, Grid, MenuItem, Select, Snackbar
} from "@mui/material";

const Transactions = () => {
    const dispatch = useDispatch();
    const { transactions, loading, error } = useSelector((state) => state.transactions);
    const { list: categories } = useSelector((state) => state.category);
    const { list: accounts } = useSelector((state) => state.accounts);
    const loggedInUser = useSelector((state) => state.auth.user); // Fixed variable name

    const userTransactions = transactions?.filter(transaction => 
        transaction.user_id === loggedInUser?.id
    ) || [];

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
            user_id: loggedInUser?.id, // Ensure user_id is set
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

    return (
        <Container>
            <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: "bold", color: "#1976d2" }}>
                Transactions
            </Typography>

            <Button variant="contained" color="primary" onClick={() => setShowForm(!showForm)} sx={{ mb: 2 }}>
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
                                <Select name="category" fullWidth required value={formData.category} onChange={handleChange} displayEmpty>
                                    <MenuItem value="" disabled>Select Category</MenuItem>
                                    {categories?.map((cat) => (<MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>))}
                                </Select>
                            </Grid>
                            <Grid item xs={6}>
                                <Select name="account" fullWidth required value={formData.account} onChange={handleChange} displayEmpty>
                                    <MenuItem value="" disabled>Select Account</MenuItem>
                                    {accounts?.map((acc) => (<MenuItem key={acc.id} value={acc.id}>{acc.account_name}</MenuItem>))}
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

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

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
                                <TableCell colSpan={7} align="center">No transactions found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default Transactions;