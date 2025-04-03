import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBudgetAPI, createBudgetAPI } from "../redux/features/budgetSlice";
import { getCategoryAPI } from "../redux/features/categorySlice";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    CircularProgress, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
    Snackbar, Alert
} from "@mui/material";

function BudgetPage() {
    const dispatch = useDispatch();
    
    // Fetch budget, categories, and user
    const { budgets, loading, error } = useSelector((state) => state.budget);
    const { list: categories } = useSelector((state) => state.category);
    console.log("Categories: ---", categories);
    console.log("budgets: ---", budgets);
    const loggedInUser = useSelector((state) => state.auth?.user);

    const [open, setOpen] = useState(false); // State for modal
    const [formData, setFormData] = useState({ category: "", budget_amount: "" });

    // Snackbar states for success and error messages
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    useEffect(() => {
        dispatch(getBudgetAPI());
        dispatch(getCategoryAPI());
    }, [dispatch]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setFormData({ category: "", budget_amount: "" }); // Reset form
    };

    const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.category || !formData.budget_amount) return;

        // Create or update budget
        dispatch(createBudgetAPI({
            user_id: loggedInUser?.id,
            category_id: formData.category,
            budget_amount: formData.budget_amount
        }))
        .then((res) => {
            if (res.payload && res.payload.success) {
                setSnackbar({ open: true, message: "Budget updated successfully!", severity: "success" });
                dispatch(getBudgetAPI()); // Refresh budget list
            } else {
                setSnackbar({ open: true, message: res.payload?.message || "Failed to update budget", severity: "error" });
            }
            handleClose(); // Close modal
        });
    };
    
    return (
        <>
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, p: 2 }}>
                {/* Open Form Button */}
                <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={handleOpen}>
                    Set Budget Amount
                </Button>

                <Typography variant="h5" sx={{ textAlign: "center", mb: 2 }}>
                    Budget Records
                </Typography>

                {/* Table */}
                {loading ? (
                    <CircularProgress sx={{ display: "block", margin: "auto", mt: 4 }} />
                ) : error ? (
                    <Typography color="error" sx={{ textAlign: "center", mt: 2 }}>Error: {error}</Typography>
                ) : budgets && budgets.length > 0 ? (
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: "#1976d2" }}>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Category</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Total Amount (₹)</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Budget Amount (₹)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {budgets?.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.category?.name || "N/A"}</TableCell>
                                    <TableCell>₹{item.total_amount}</TableCell>
                                    <TableCell>₹{item.budget_amount}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <Typography sx={{ textAlign: "center", mt: 2 }}>No budget records found.</Typography>
                )}

                {/* Dialog (Modal) for Budget Amount */}
                <Dialog open={open} onClose={handleClose} fullWidth>
                    <DialogTitle>Set Budget Amount</DialogTitle>
                    <DialogContent>
                        {/* Category Dropdown */}
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Select Category</InputLabel>
                            <Select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                {categories?.map((cat) => (
                                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Budget Amount Input */}
                        <TextField
                            fullWidth
                            label="Budget Amount (₹)"
                            name="budget_amount"
                            type="number"
                            value={formData.budget_amount}
                            onChange={handleChange}
                            margin="normal"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} color="secondary">Cancel</Button>
                        <Button onClick={handleSubmit} variant="contained" color="primary">Save</Button>
                    </DialogActions>
                </Dialog>
            </TableContainer>

            {/* ✅ Snackbar for Success & Error Messages */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

export default BudgetPage;
