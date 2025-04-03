import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCategoryAPI } from "../redux/features/categorySlice";
import { getAccountAPI } from "../redux/features/accountSlice";
import { getUserAPI } from "../redux/features/authSlice";
import { fetchTransactions } from "../redux/features/transactionSlice";

import {
    Box, Grid, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField
} from "@mui/material";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, BarChart, Bar } from "recharts";

const generateColor = (index) => {
    const colors = ["#FFC107", "#E91E63", "#03A9F4", "#4CAF50", "#FF5722", "#9C27B0"];
    return colors[index % colors.length];
};

const Dashboard = () => {
    const dispatch = useDispatch();
    const { list: categories = [], loading: categoryLoading } = useSelector((state) => state.category);
    const { list: users = [], loading: userLoading } = useSelector((state) => state.auth);
    const { list: accounts = [], loading: accountLoading } = useSelector((state) => state.accounts);
    const { transactions = [], loading: transactionLoading } = useSelector((state) => state.transactions);
    const loggedInUser = useSelector((state) => state.auth.user);

    useEffect(() => {
        dispatch(fetchTransactions());
        dispatch(getCategoryAPI());
        dispatch(getUserAPI());
        dispatch(getAccountAPI());
    }, [dispatch]);

    const totalCategories = categories.length;
    const totalUsers = users.length;
    const totalAccounts = accounts.length;
    const totalTransactions = transactions.length;
    const [search, setSearch] = useState("");
    const userTransactions = transactions.filter((t) => t.user_id === loggedInUser?.id);
    const totalAmountSpent = userTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // 🟢 Category-wise Expense Data for Line Chart
    const categoryData = categories.map((category, index) => {
        const totalAmount = userTransactions
            .filter((t) => t.category_id === category.id)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        return {
            name: category.name,
            value: totalAmount,
            color: generateColor(index),
            percentage: totalAmountSpent ? ((totalAmount / totalAmountSpent) * 100).toFixed(2) : 0
        };
    }).filter(data => data.value > 0);

    // 🟢 Monthly Expense Data for Bar Chart
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyExpenseData = months.map((month, index) => {
        const totalAmount = userTransactions
            .filter(t => new Date(t.transaction_date).getMonth() === index)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        return { month, total: totalAmount };
    });

    // 🟢 Last 10 Transactions with Search Filter
    const last10Transactions = userTransactions
        .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
        .slice(0, 10)
        .map(transaction => ({
            ...transaction,
            categoryName: categories.find(category => category.id === transaction.category_id)?.name || "Unknown"
        }))
        .filter(t =>
            t.categoryName.toLowerCase().includes(search.toLowerCase()) ||
            t.amount.toString().includes(search)
        );

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, backgroundColor: "#f4f4f4", minHeight: "100vh" }}>
            <Typography variant="h5" sx={{ mb: 3, textAlign: "center" }}>
                Welcome to Admin Dashboard
            </Typography>

            {(categoryLoading || userLoading || accountLoading || transactionLoading) ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={2} justifyContent="center">
                    {[{
                        label: "Total Categories", value: totalCategories, color: "#FF9800"
                    }, {
                        label: "Total Users", value: totalUsers, color: "#FF5733"
                    }, {
                        label: "Total Transactions", value: totalTransactions, color: "#1f232e"
                    }, {
                        label: "Total Accounts", value: totalAccounts, color: "#3357FF"
                    }].map((item, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Paper elevation={4} sx={{ p: 2, backgroundColor: item.color, color: "#fff", textAlign: "center" }}>
                                <Typography variant="h6">{item.label}: {item.value}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Grid container spacing={3} sx={{ mt: 3 }} justifyContent="center">
                {/* Line Chart - Category-wise Expenses */}
                <Grid item xs={12} sm={10} md={6} sx={{ height: "400px" }}>
                    <Paper sx={{ p: 2, backgroundColor: "#FFF", height: "100%" }}>
                        <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>Category-wise Expenses</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => `₹${value}`} />
                                <Legend />
                                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Bar Chart - Monthly Expenses */}
                <Grid item xs={12} sm={10} md={6} sx={{ height: "400px" }}>
                    <Paper sx={{ p: 2, backgroundColor: "#FFF", height: "100%" }}>
                        <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>Monthly Expenses</Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={monthlyExpenseData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value) => `₹${value}`} />
                                <Legend />
                                <Bar dataKey="total" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
                <Paper sx={{ p: 2, backgroundColor: "#FFF" }}>
                    <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>Last 10 Transactions</Typography>

                    {/* 🔍 Search Box */}
                    <TextField
                        label="Search Transactions"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {/* Transactions Table */}
                    <TableContainer sx={{ maxHeight: 400, overflowY: "auto", borderRadius: "10px", border: "2px solid #333", boxShadow: "0px 4px 10px rgba(141, 230, 39, 0.2)" }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{color:"white",backgroundColor:"ActiveBorder",textAlign: "center"}}>Date</TableCell>
                                    <TableCell sx={{color:"white",backgroundColor:"ActiveBorder",textAlign: "center"}}>Category</TableCell>
                                    <TableCell sx={{color:"white",backgroundColor:"ActiveBorder",textAlign: "center"}}>Amount (₹)</TableCell>
                                    <TableCell sx={{color:"white",backgroundColor:"ActiveBorder",textAlign: "center"}}>Description</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {last10Transactions.length > 0 ? (
                                    last10Transactions.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell sx={{textAlign: "center"}}>{new Date(t.transaction_date).toLocaleDateString()}</TableCell>
                                            <TableCell sx={{textAlign: "center"}}>{t.categoryName}</TableCell>
                                            <TableCell sx={{textAlign: "center"}}>₹{t.amount}</TableCell>
                                            <TableCell sx={{textAlign: "center"}}>{t.description}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">No matching transactions found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </Box>
    );
};

export default Dashboard;
