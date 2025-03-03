import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCategoryAPI } from "../redux/features/categorySlice";
import { getAccountAPI } from "../redux/features/accountSlice";
import { getUserAPI } from "../redux/features/authSlice";
import { fetchTransactions } from "../redux/features/transactionSlice";

import { Box, Grid, Paper, Typography, CircularProgress } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

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
    const [hoveredIndex, setHoveredIndex] = useState(null);

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
    const userTransactions = transactions.filter((t) => t.user_id === loggedInUser?.id);

    const totalAmountSpent = userTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
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

    return (
        <Box sx={{ flexGrow: 1, p: 3, backgroundColor: "#f4f4f4", minHeight: "100vh" }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Welcome to Admin Dashboard
            </Typography>
            {(categoryLoading || userLoading || accountLoading || transactionLoading) ? (
                <CircularProgress />
            ) : (
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}><Paper elevation={4} sx={{ p: 3, backgroundColor: "#FF9800", color: "#fff" }}><Typography variant="h6">Total Categories: {totalCategories}</Typography></Paper></Grid>
                    <Grid item xs={12} sm={6} md={3}><Paper elevation={4} sx={{ p: 3, backgroundColor: "#FF5733", color: "#fff" }}><Typography variant="h6">Total Users: {totalUsers}</Typography></Paper></Grid>
                    <Grid item xs={12} sm={6} md={3}><Paper elevation={4} sx={{ p: 3, backgroundColor: "#1f232e", color: "#fff" }}><Typography variant="h6">Total Transactions: {totalTransactions}</Typography></Paper></Grid>
                    <Grid item xs={12} sm={6} md={3}><Paper elevation={4} sx={{ p: 3, backgroundColor: "#3357FF", color: "#fff" }}><Typography variant="h6">Total Accounts: {totalAccounts}</Typography></Paper></Grid>
                </Grid>
            )}
            <Grid container spacing={3} sx={{ mt: 3 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, backgroundColor: "#FFF" }}>
                        <Typography variant="h6">Category-wise Expenses</Typography>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie 
                                        data={categoryData} 
                                        cx="50%" 
                                        cy="50%" 
                                        label={({ name, value, percentage }) => `${name}: ₹${value} (${percentage}%)`}
                                        outerRadius={100} 
                                        innerRadius={50} 
                                        dataKey="value"
                                        onMouseEnter={(_, index) => setHoveredIndex(index)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.color} 
                                                style={{ transition: "transform 0.2s ease-in-out" }}
                                                transform={hoveredIndex === index ? "scale(1.1)" : "scale(1)"}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name, props) => [`₹${value}`, name]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Typography align="center" color="textSecondary">No data available</Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
