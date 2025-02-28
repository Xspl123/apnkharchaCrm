import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCategoryAPI } from "../redux/features/categorySlice";
import { getAccountAPI } from "../redux/features/accountSlice";
import { getUserAPI } from "../redux/features/authSlice";
import { Box, Grid, Paper, Typography, CircularProgress } from "@mui/material";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// ✅ Dummy Data (Baad mein API se replace kar sakte ho)
const dummyTransactions = 10;
const Dashboard = () => {
    const dispatch = useDispatch();

    const { list: categories, loading: categoryLoading, error: categoryError } = useSelector((state) => state.category);
    const { list: users, loading: userLoading, error: userError } = useSelector((state) => state.auth);
    const { list: accounts, loading: accountLoading, error: accountError } = useSelector((state) => state.accounts);

    useEffect(() => {
        dispatch(getCategoryAPI());
        dispatch(getUserAPI());
        dispatch(getAccountAPI());
    }, [dispatch]);

    // ✅ Total Counts
    const totalCategories = categories.length;
    const totalUsers = users.length;
    const totalAccount = accounts.length;

    // ✅ Count Categories by Type
    const categoryTypesCount = categories.reduce((acc, category) => {
        acc[category.type] = (acc[category.type] || 0) + 1;
        return acc;
    }, {});

    // ✅ Pie Chart Data for Categories
    const chartData = Object.keys(categoryTypesCount).map((type, index) => ({
        name: type,
        value: categoryTypesCount[type],
        color: ["#FFC107", "#E91E63", "#03A9F4"][index % 3], // Dynamic colors
    }));

    return (
        <Box sx={{ flexGrow: 1, p: 3, backgroundColor: "#f4f4f4", minHeight: "100vh" }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Welcome to Admin Dashboard
            </Typography>

            {(categoryLoading || userLoading)  || accountLoading ? (
                <CircularProgress />
            ) : (categoryError || userError || accountError) ? (
                <Typography color="error">{categoryError || userError || accountError }</Typography>
            ) : (
                <Grid container spacing={3}>
                    {/* ✅ Total Categories Count */}
                    <Grid item xs={12} sm={6} md={3}>
                        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 200 }}>
                            <Paper elevation={4} sx={{ p: 3, backgroundColor: "#FF9800", minHeight: "120px", display: "flex", justifyContent: "center", alignItems: "center", color: "#fff" }}>
                                <Typography variant="h6">Total Categories: {totalCategories}</Typography>
                            </Paper>
                        </motion.div>
                    </Grid>
                    {/* ✅ Total Users Count (Dynamic) */}
                    <Grid item xs={12} sm={6} md={3}>
                        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 200 }}>
                            <Paper elevation={4} sx={{ p: 3, backgroundColor: "#FF5733", minHeight: "120px", display: "flex", justifyContent: "center", alignItems: "center", color: "#fff" }}>
                                <Typography variant="h6">Total Users: {totalUsers}</Typography>
                            </Paper>
                        </motion.div>
                    </Grid>
                    {/* ✅ Total Transactions Count (Dummy) */}
                    <Grid item xs={12} sm={6} md={3}>
                        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 200 }}>
                            <Paper elevation={4} sx={{ p: 3, backgroundColor: "#1f232e", minHeight: "120px", display: "flex", justifyContent: "center", alignItems: "center", color: "#fff" }}>
                                <Typography variant="h6">Total Transactions: {dummyTransactions}</Typography>
                            </Paper>
                        </motion.div>
                    </Grid>
                    {/* ✅ Total Accounts Count (Dummy) */}
                    <Grid item xs={12} sm={6} md={3}>
                        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 200 }}>
                            <Paper elevation={4} sx={{ p: 3, backgroundColor: "#3357FF", minHeight: "120px", display: "flex", justifyContent: "center", alignItems: "center", color: "#fff" }}>
                                <Typography variant="h6">Total Accounts: {totalAccount}</Typography>
                            </Paper>
                        </motion.div>
                    </Grid>
                </Grid>
            )}

            {/* ✅ Charts Section */}
            <Grid container spacing={3} sx={{ mt: 3 }}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={4} sx={{ p: 3, backgroundColor: "#FFF", minHeight: "250px" }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Category Type Count</Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={chartData} dataKey="value" outerRadius={80}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper elevation={4} sx={{ p: 3, backgroundColor: "#FFF", minHeight: "250px" }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Transaction Overview</Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={[
                                    { name: "Users", count: totalUsers, color: "#FF5733" },
                                    { name: "Transactions", count: dummyTransactions, color: "#1f232e" },
                                    { name: "Accounts", count: totalAccount, color: "#3357FF" },
                                ]} dataKey="count" outerRadius={80}>
                                    {[
                                        { name: "Users", count: totalUsers, color: "#FF5733" },
                                        { name: "Transactions", count: dummyTransactions, color: "#1f232e" },
                                        { name: "Accounts", count: totalAccount, color: "#3357FF" },
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
