import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBudgetAPI, createBudgetAPI } from "../redux/features/budgetSlice";
import { getCategoryAPI } from "../redux/features/categorySlice";
import {
    Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
    Snackbar, Alert
} from "@mui/material";
import { DataTable, PageHeader } from "../components/common";
import "./BudgetPage.css";

function BudgetPage() {
    const dispatch = useDispatch();
    
    // Fetch budget, categories, and user
    const { budgets, loading, error } = useSelector((state) => state.budget);
    const { list: categories } = useSelector((state) => state.category);
    const loggedInUser = useSelector((state) => state.auth?.user);

    const [open, setOpen] = useState(false); // Modal state
    const [formData, setFormData] = useState({ category: "", budget_amount: "" });
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    useEffect(() => {
        dispatch(getBudgetAPI());
        dispatch(getCategoryAPI());
    }, [dispatch]);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setFormData({ category: "", budget_amount: "" });
    };

    const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.category || !formData.budget_amount) return;

        dispatch(createBudgetAPI({
            user_id: loggedInUser?.id,
            category_id: formData.category,
            budget_amount: formData.budget_amount
        }))
        .then((res) => {
            if (res.payload && res.payload.success) {
                setSnackbar({ open: true, message: "Budget updated successfully!", severity: "success" });
                dispatch(getBudgetAPI());
            } else {
                setSnackbar({ open: true, message: res.payload?.message || "Failed to update budget", severity: "error" });
            }
            handleClose();
        });
    };

    return (
        <div className="budget-page">
            <PageHeader
                title="Budget Records"
                subtitle={error ? `Error: ${error}` : "Set monthly limits for expense categories."}
                actions={[
                    {
                        label: "Set Budget Amount",
                        onClick: handleOpen,
                    },
                ]}
            />

            <DataTable
                loading={loading}
                emptyMessage="No budget records found."
                rows={budgets || []}
                columns={[
                    {
                        field: "category.name",
                        headerName: "Category",
                        fallback: "N/A",
                    },
                    {
                        field: "total_amount",
                        headerName: "Total Amount (₹)",
                        render: (value) => `₹${value}`,
                    },
                    {
                        field: "budget_amount",
                        headerName: "Budget Amount (₹)",
                        render: (value) => `₹${value}`,
                    },
                    { field: "month", headerName: "Month" },
                ]}
                sx={{ mb: 3 }}
            />

            {/* Dialog for Adding/Editing Budget */}
            <Dialog open={open} onClose={handleClose} fullWidth>
                <DialogTitle>Set Budget Amount</DialogTitle>
                <DialogContent>
                    {/* Category Dropdown (Only Expense Categories) */}
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Select Category</InputLabel>
                        <Select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                        >
                            {categories
                                ?.filter(cat => cat.type?.toLowerCase() === "expense")
                                .map(cat => (
                                    <MenuItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </MenuItem>
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

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} className="budget-page__snackbar">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    ); 
}

export default BudgetPage;
