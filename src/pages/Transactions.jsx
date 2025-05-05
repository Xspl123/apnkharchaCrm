import PropTypes from "prop-types";
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
    Alert,
    TablePagination,
    Card, 
    CardContent,
    Modal,
    Box
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { saveAs } from "file-saver";

const Transactions = () => {
    const dispatch = useDispatch();
    const { transactions } = useSelector((state) => state.transactions);
    const { list: categories } = useSelector((state) => state.category);
    const { list: accounts } = useSelector((state) => state.accounts);
    const loggedInUser = useSelector((state) => state.auth.user);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        transaction_date: "",
        description: "",
        category: "",
        account: "",
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [selectedTab, setSelectedTab] = useState(0);
    const [calculatorOpen, setCalculatorOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(""); // State for search query
    const [startDate, setStartDate] = useState(""); // State for start date filter
    const [endDate, setEndDate] = useState(""); // State for end date filter

    const handleCalculatorOpen = () => setCalculatorOpen(true);
    const handleCalculatorClose = () => setCalculatorOpen(false);

    const handleCalculatorSubmit = (value) => {
        setFormData((prev) => ({
            ...prev,
            amount: value,
        }));
        handleCalculatorClose();
    };

    const handleSpeechToText = (fieldName) => {
        if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            setSnackbar({ open: true, message: "Speech recognition not supported in this browser!", severity: "error" });
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {};
        recognition.onend = () => {};

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setFormData((prev) => ({
                ...prev,
                [fieldName]: transcript,
            }));
        };

        recognition.onerror = (event) => {
            const errorMessage = event.error === "no-speech" 
                ? "No speech detected. Please try again." 
                : `Error: ${event.error}`;
            setSnackbar({ open: true, message: errorMessage, severity: "error" });
        };

        recognition.start();
    };

    const Calculator = ({ onSubmit, onClose }) => {
        const [calcValue, setCalcValue] = useState("");

        const handleButtonClick = (value) => {
            if (value === "=") {
                try {
                    const result = eval(calcValue); // Simple evaluation
                    setCalcValue(result.toString());
                } catch {
                    setCalcValue("Error");
                }
            } else if (value === "C") {
                setCalcValue("");
            } else {
                setCalcValue((prev) => prev + value);
            }
        };

        return (
            <Box sx={{ p: 3, backgroundColor: "white", borderRadius: 2, width: 300, textAlign: "center" }}>
                <Typography variant="h6" gutterBottom>Calculator</Typography>
                <TextField value={calcValue} fullWidth disabled sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                    {/* Number Buttons */}
                    <Grid item xs={9}>
                        <Grid container spacing={1}>
                            {["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "."].map((btn, index) => (
                                <Grid item xs={4} key={index}>
                                    <Button variant="outlined" fullWidth onClick={() => handleButtonClick(btn)}>
                                        {btn}
                                    </Button>
                                </Grid>
                            ))}
                            <Grid item xs={4}>
                                <Button variant="outlined" fullWidth onClick={() => handleButtonClick("C")}>
                                    C
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                    {/* Operator Buttons */}
                    <Grid item xs={3}>
                        {["+", "-", "*", "/"].map((btn, index) => (
                            <Grid item xs={12} key={index} sx={{ mb: 1 }}>
                                <Button variant="outlined" fullWidth onClick={() => handleButtonClick(btn)}>
                                    {btn}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>
                    {/* Action Buttons */}
                    <Grid item xs={6}>
                        <Button variant="contained" color="primary" fullWidth onClick={() => handleButtonClick("=")}>
                            =
                        </Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Button variant="contained" color="success" fullWidth onClick={() => onSubmit(calcValue)}>
                            Use
                        </Button>
                    </Grid>
                    <Grid item xs={12}>
                        <Button variant="contained" color="error" fullWidth onClick={onClose}>
                            Close
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        );
    };

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

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(0); // Reset to the first page when search query changes
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.transaction_date || !formData.category || !formData.account) {
            setSnackbar({ open: true, message: "Please fill in all required fields!", severity: "error" });
            return;
        }
        const transactionData = {
            amount: formData.amount,
            transaction_date: formData.transaction_date,
            description: formData.description,
            category_id: formData.category,
            account_id: formData.account,
            user_id: loggedInUser?.id,
        };
        try {
            await dispatch(createTransaction(transactionData)).unwrap();
            setSnackbar({ open: true, message: "Transaction added successfully!", severity: "success" });
            setShowForm(false);
            setFormData({ amount: "", transaction_date: "", description: "", category: "", account: "" });
            dispatch(getAccountAPI())
            dispatch(fetchTransactions());
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

    const exportTransactions = () => {
        if (!startDate || !endDate) {
            setSnackbar({ open: true, message: "Please select both start and end dates to export!", severity: "error" });
            return;
        }

        const transactionsToExport = filteredTransactions.map((transaction) => ({
            "Created At": formatDateTime(transaction.created_at), // Ensure consistent formatting
            "Transaction Date": formatDateTime(transaction.transaction_date), // Ensure consistent formatting
            "Category": transaction.category?.name || "N/A",
            "Account": accounts.find(acc => acc.id === transaction.account_id)?.account_name || "N/A",
            "Amount": transaction.amount,
            "Description": transaction.description || "N/A",
        }));

        if (transactionsToExport.length === 0) {
            setSnackbar({ open: true, message: "No transactions found for the selected date range!", severity: "error" });
            return;
        }

        const csvHeaders = ["Created At", "Transaction Date", "Category", "Account", "Amount", "Description"];
        const csvContent = [
            csvHeaders.join(","), // Ensure consistent headers
            ...transactionsToExport.map((row) =>
                csvHeaders.map((header) => `"${row[header]}"`).join(",") // Ensure values align with headers
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `transactions_${startDate}_to_${endDate}.csv`);
    };

    const userTransactions = transactions.filter(transaction => transaction.user_id === loggedInUser?.id);

    const categoryData = categories
        .map((category) => {
            let totalAmount = 0;

            // Summing transaction amounts
            for (const t of userTransactions) {
                if (t.category_id === category.id) {
                    totalAmount += Number(t.amount);
                }
            }

            // Skip categories with zero value
            if (totalAmount === 0) return null;

            return {
                name: category.name,
                value: totalAmount,
            };
        })
        .filter(Boolean); // Removes null values efficiently

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Filter transactions based on search query and date range
    const filteredTransactions = userTransactions.filter((transaction) => {
        const searchLower = searchQuery.toLowerCase();
        const transactionDate = new Date(transaction.transaction_date);
        const isWithinDateRange =
            (!startDate || transactionDate >= new Date(startDate)) &&
            (!endDate || transactionDate <= new Date(endDate));
        return (
            isWithinDateRange &&
            (transaction.category?.name.toLowerCase().includes(searchLower) ||
            transaction.description?.toLowerCase().includes(searchLower) ||
            transaction.amount.toString().includes(searchLower) ||
            formatDateTime(transaction.transaction_date).toLowerCase().includes(searchLower))
        );
    });

    // Apply pagination to filtered transactions
    const paginatedTransactions = filteredTransactions.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset page to first
    };

    return (
        <Container>
            <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: "bold", color: "#1976d2" }}>
                Transactions
            </Typography>

            {/* Aligned Buttons for Form */}
            <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={6} sm="auto">
                    <Button variant="contained" color="primary" fullWidth onClick={() => setShowForm(!showForm)}>
                        {showForm ? "Cancel" : "Add Transaction"}
                    </Button>
                </Grid>
<<<<<<< HEAD
                <Grid item xs={6} sm="auto">
                    <Button variant="contained" color="secondary" fullWidth onClick={exportTransactions}>
                        Export Transactions
                    </Button>
                </Grid>
=======
>>>>>>> f81c650 (Initial commit)
            </Grid>

            {/* Account Details in Grid */}
            {accounts.length > 0 && (
                <Grid container spacing={2} justifyContent="center">
                    {accounts.map((account, index) => (
                        <Grid item xs={12} sm={6} md={4} key={account.id}>
                            <Card
                                sx={{
                                    borderRadius: 2,
                                    boxShadow: selectedTab === index ? 6 : 2,
                                    backgroundColor: selectedTab === index ? "#f5f5f5" : "white",
                                    cursor: "pointer",
                                }}
                                onClick={() => setSelectedTab(index)}
                            >
                                <CardContent sx={{ textAlign: "center" }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {account.account_name}
                                    </Typography>
                                    <Typography variant="body1" color="textSecondary">
                                        Balance: ₹{account.account_balance}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Animated Form */}
            <Collapse in={showForm}>
                <Paper sx={{ padding: 3, marginBottom: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        New Transaction
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={6} sx={{ display: "flex", alignItems: "center" }}>
                                <TextField
                                    label="Amount"
                                    type="number"
                                    name="amount"
                                    fullWidth
                                    required
                                    value={formData.amount}
                                    onChange={handleChange}
                                />
                                <IconButton onClick={handleCalculatorOpen} color="primary">
                                    <AddIcon />
                                </IconButton>
                                <IconButton onClick={() => handleSpeechToText("amount")} color="secondary">
                                    🎤
                                </IconButton>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Date"
                                    type="date"
                                    name="transaction_date"
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.transaction_date}
                                    onChange={handleChange}
                                />
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
                            <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                                <TextField
                                    label="Description"
                                    name="description"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                                <IconButton onClick={() => handleSpeechToText("description")} color="secondary">
                                    🎤
                                </IconButton>
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

            <Modal open={calculatorOpen} onClose={handleCalculatorClose}>
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                    <Calculator onSubmit={handleCalculatorSubmit} onClose={handleCalculatorClose} />
                </Box>
            </Modal>

            {/* Table is always displayed */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, mt: 2, overflow: "hidden" }}>
                {/* Search Input Inside Table */}
<<<<<<< HEAD
                <Box sx={{ padding: 2 }}>
                    <TextField
                        label="Search Transactions"
                        variant="outlined"
                        fullWidth
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </Box>
                {/* Date Range Filters */}
                <Box sx={{ padding: 2, display: "flex", gap: 2 }}>
                    <TextField
                        label="Start Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="End Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        fullWidth
=======
                <Box sx={{ padding: 2, display: "flex", justifyContent: "flex-end" }}>
                    <TextField
                        label="Search"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        sx={{ width: "300px" }}
>>>>>>> f81c650 (Initial commit)
                    />
                </Box>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#1976d2" }}>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Created At</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "white" }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedTransactions.map((transaction) => (
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
                                <TableCell>{formatDateTime(transaction.created_at)}</TableCell>
                                <TableCell>{formatDateTime(transaction.transaction_date)}</TableCell>
                                <TableCell>{transaction.category?.name || "N/A"}</TableCell>
                                <TableCell>₹{transaction.amount}</TableCell>
                                <TableCell>{transaction.description || "N/A"}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleDelete(transaction.id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {paginatedTransactions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No transactions found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredTransactions.length} // Use filtered transactions count
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>

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

Transactions.propTypes = {
    payload: PropTypes.arrayOf(
        PropTypes.shape({
            dates: PropTypes.string,
        })
    ),
};

export default Transactions;
