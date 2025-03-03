import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
    createAccountAPI, 
    getAccountAPI, 
    updateAccountAPI, 
    deleteAccountAPI 
} from "../redux/features/accountSlice";
import {
    Container, Typography, Table, TableHead, TableRow, TableCell,
    TableBody, CircularProgress, Alert, Paper, TableContainer,
    TextField, Button, Grid, Snackbar, IconButton, Box
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

const AccountPage = () => {
    const dispatch = useDispatch();
    const [accountName, setAccountName] = useState("");
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [visibleCount, setVisibleCount] = useState(5);

    const { list: accounts, loading, error } = useSelector((state) => state.accounts);

    useEffect(() => {
        dispatch(getAccountAPI());
    }, [dispatch]);

    const handleAddOrUpdateAccount = async (e) => {
        e.preventDefault();
        if (!accountName.trim()) {
            showSnackbar("Account name is required!", "error");
            return;
        }

        try {
            if (editId) {
                await dispatch(updateAccountAPI({ id: editId, account_name: accountName })).unwrap();
                showSnackbar("Account updated successfully!", "success");
            } else {
                await dispatch(createAccountAPI({ account_name: accountName })).unwrap();
                showSnackbar("Account added successfully!", "success");
            }
            resetForm();
            dispatch(getAccountAPI());
        } catch (error) {
            showSnackbar(error?.message || "Failed to process account!", "error");
        }
    };

    const handleEdit = (account) => {
        setAccountName(account.account_name);
        setEditId(account.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this account?")) {
            try {
                await dispatch(deleteAccountAPI(id)).unwrap();
                setSnackbarMessage("Account deleted successfully!");
                setSnackbarSeverity("success");
                dispatch(getAccountAPI());
            } catch (error) {
                console.error("Delete Error:", error); // Debugging: Print full error in console
    
                let errorMessage = "Failed to delete account!";
                
                // Handle different possible error structures
                if (typeof error === "string") {
                    errorMessage = error;
                } else if (error?.message) {
                    errorMessage = error.message;
                } else if (error?.error) {
                    errorMessage = error.error;
                } else if (error?.response?.data?.message) {
                    errorMessage = error.response.data.message;
                }
    
                // Check for specific transaction-related error
                if (errorMessage.includes("associated transactions")) {
                    setSnackbarMessage("Cannot delete this account because it has transactions. Delete the transactions first.");
                } else {
                    setSnackbarMessage(errorMessage);
                }
                setSnackbarSeverity("error");
            }
            setOpenSnackbar(true);
        }
    };
    
    

    const resetForm = () => {
        setAccountName("");
        setEditId(null);
        setShowForm(false);
    };

    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    return (
        <Container>
            <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: "bold", color: "#1976d2" }}>
                Accounts
            </Typography>

            <Button variant="contained" color="primary" onClick={() => setShowForm(!showForm)} sx={{ mb: 2 }}>
                {showForm ? "Cancel" : "Add Account"}
            </Button>

            {showForm && (
                <Grid item xs={12} md={6}>
                    <Box p={4} sx={{ border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#fff", boxShadow: 2, maxWidth: "500px", mx: "auto" }}>
                        <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold", textAlign: "center" }}>
                            {editId ? "Edit Account" : "Add New Account"}
                        </Typography>
                        <form onSubmit={handleAddOrUpdateAccount}>
                            <TextField fullWidth label="Account Name" variant="outlined" value={accountName} onChange={(e) => setAccountName(e.target.value)} sx={{ mb: 2 }} />
                            <Button variant="contained" color="primary" type="submit" fullWidth sx={{ py: 1.5, fontSize: "16px" }}>
                                {editId ? "Update Account" : "Add Account"}
                            </Button>
                        </form>
                    </Box>
                </Grid>
            )}

            {loading ? (
                <CircularProgress />
            ) : error ? (
                <Alert severity="error">{error.includes("Forbidden") ? "Access Denied: Admin access required" : error}</Alert>
            ) : accounts?.length === 0 ? (
                <Alert severity="info">No accounts found.</Alert>
            ) : (
                <>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#1976d2" }}>
                                    <TableCell sx={{ color: "white" }}><strong>ID</strong></TableCell>
                                    <TableCell sx={{ color: "white" }}><strong>Account Name</strong></TableCell>
                                    <TableCell sx={{ color: "white" }}><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {accounts.slice(0, visibleCount).map((item, index) => (
                                    <TableRow key={item?.id || index}>
                                        <TableCell>{item?.id ?? "N/A"}</TableCell>
                                        <TableCell>{item?.account_name ?? "Unnamed"}</TableCell>
                                        <TableCell>
                                            <IconButton color="primary" onClick={() => handleEdit(item)}>
                                                <Edit />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => handleDelete(item?.id)}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {visibleCount < accounts.length && (
                        <Button variant="contained" color="secondary" onClick={() => setVisibleCount(visibleCount + 5)} sx={{ mt: 2 }}>
                            Load More
                        </Button>
                    )}
                </>
            )}

            <Snackbar open={openSnackbar} autoHideDuration={5000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AccountPage;
