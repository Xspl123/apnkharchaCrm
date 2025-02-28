import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createAccountAPI, getAccountAPI, updateAccountAPI, deleteAccountAPI } from "../redux/features/accountSlice";
import {
    Container,
    TextField,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Box,
    IconButton,
    Snackbar,
    Grid
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

const AccountPage = () => {
    const dispatch = useDispatch();
    const { list = [], loading, error } = useSelector((state) => state.accounts);

    const [accountData, setAccountData] = useState({
        account_name: "",
        account_balance: "",
    });
    const [visibleAccounts, setVisibleAccounts] = useState(6);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    useEffect(() => {
        dispatch(getAccountAPI());
    }, [dispatch]);

    const handleChange = (e) => {
        setAccountData({ ...accountData, [e.target.name]: e.target.value });
    };

    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleSubmit = useCallback(
        (e) => {
            e.preventDefault();
            if (!accountData.account_name || !accountData.account_balance) return;

            if (editMode) {
                dispatch(updateAccountAPI({ id: editId, ...accountData })).then(() => {
                    setEditMode(false);
                    setEditId(null);
                    setAccountData({ account_name: "", account_balance: "" });
                    showSnackbar("Account updated successfully", "success");
                });
            } else {
                dispatch(createAccountAPI(accountData)).then(() => {
                    setAccountData({ account_name: "", account_balance: "" });
                    showSnackbar("Account created successfully", "success");
                });
            }
        },
        [dispatch, editMode, editId, accountData]
    );

    const handleEdit = useCallback((account) => {
        setAccountData({ account_name: account.account_name, account_balance: account.account_balance });
        setEditMode(true);
        setEditId(account.id);
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this account?")) {
            try {
                await dispatch(deleteAccountAPI(id)).unwrap();
                showSnackbar("Account deleted successfully", "success");
            } catch (error) {
                showSnackbar(error || "Failed to delete account", "error");
            }
        }
    };

    const displayedAccounts = useMemo(() => list.slice(0, visibleAccounts), [list, visibleAccounts]);

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" align="center" gutterBottom>
                Manage Accounts
            </Typography>

            {/* ✅ Grid Layout for Side-by-Side Form & Table */}
            <Grid container spacing={3}>
                {/* ✅ Form Section */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ padding: 3 }}>
                        <Typography variant="h6" gutterBottom>{editMode ? "Edit Account" : "Create New Account"}</Typography>
                        <form onSubmit={handleSubmit}>
                            <TextField
                                label="Account Name"
                                name="account_name"
                                value={accountData.account_name}
                                onChange={handleChange}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <TextField
                                label="Balance"
                                name="account_balance"
                                type="number"
                                value={accountData.account_balance}
                                onChange={handleChange}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <Button type="submit" variant="contained" color="primary" fullWidth>
                                {editMode ? "Update Account" : "Create Account"}
                            </Button>
                        </form>
                    </Paper>
                </Grid>

                {/* ✅ Table Section */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ padding: 3 }}>
                        <Typography variant="h6" gutterBottom>Account List</Typography>
                        {loading ? (
                            <CircularProgress />
                        ) : error ? (
                            <Alert severity="error">{error}</Alert>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>#</TableCell>
                                            <TableCell>Account Name</TableCell>
                                            <TableCell>Balance</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {displayedAccounts.map((account, index) => (
                                            <TableRow key={account.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{account.account_name}</TableCell>
                                                <TableCell>₹ {account.account_balance}</TableCell>
                                                <TableCell>
                                                    <IconButton color="primary" onClick={() => handleEdit(account)}>
                                                        <Edit />
                                                    </IconButton>
                                                    <IconButton color="error" onClick={() => handleDelete(account.id)}>
                                                        <Delete />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {/* ✅ Load More Button */}
                        {list.length > visibleAccounts && (
                            <Box textAlign="center" mt={2}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => setVisibleAccounts(visibleAccounts + 6)}
                                >
                                    Load More
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* ✅ Snackbar for notifications */}
            <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AccountPage;
