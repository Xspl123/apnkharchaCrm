import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCategoryAPI } from "../redux/features/categorySlice";
import { getAccountAPI } from "../redux/features/accountSlice";
import { getUserAPI } from "../redux/features/authSlice";
import { fetchTransactions } from "../redux/features/transactionSlice";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import TablePagination from "@mui/material/TablePagination";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Add } from "@mui/icons-material"; // Import the Add icon

const generateColor = (index) => {
  const colors = ["#FF5722", "#03A9F4", "#4CAF50", "#E91E63", "#FFC107", "#9C27B0"];
  return colors[index % colors.length];
};

const months = [
  { name: "January", value: 0 },
  { name: "February", value: 1 },
  { name: "March", value: 2 },
  { name: "April", value: 3 },
  { name: "May", value: 4 },
  { name: "June", value: 5 },
  { name: "July", value: 6 },
  { name: "August", value: 7 },
  { name: "September", value: 8 },
  { name: "October", value: 9 },
  { name: "November", value: 10 },
  { name: "December", value: 11 },
];

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: categories = [] } = useSelector((state) => state.category);
  const { list: users = [] } = useSelector((state) => state.auth);
  const { list: accounts = [] } = useSelector((state) => state.accounts);
  const { transactions = [] } = useSelector((state) => state.transactions);
  const loggedInUser = useSelector((state) => state.auth.user);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchTransactions());
    dispatch(getCategoryAPI());
    dispatch(getUserAPI());
    dispatch(getAccountAPI());
  }, [dispatch]);

  const userTransactions = transactions.filter((t) => t.user_id === loggedInUser?.id);

  const filteredTransactions = userTransactions.filter((t) => {
    const date = new Date(t.transaction_date);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });

  const totalAmountSpent = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const categoryData = categories
    .map((category, index) => {
      const totalAmount = filteredTransactions
        .filter((t) => t.category_id === category.id)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return {
        name: category.name,
        value: totalAmount,
        color: generateColor(index),
      };
    })
    .filter((data) => data.value > 0);

  const monthCategoryData = categories
    .map((category) => {
      const totalExpense = filteredTransactions
        .filter((t) => t.category_id === category.id && t.category?.type?.toLowerCase() === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const totalIncome = filteredTransactions
        .filter((t) => t.category_id === category.id && t.category?.type?.toLowerCase() === "income")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return {
        name: category.name,
        Expense: totalExpense,
        Income: totalIncome,
      };
    })
    .filter((data) => data.Expense > 0 || data.Income > 0);

  const dayWiseData = filteredTransactions.reduce((acc, t) => {
    const day = new Date(t.transaction_date).toISOString().split("T")[0];
    const type = t.category?.type?.toLowerCase();
    const amount = parseFloat(t.amount);
    if (!acc[day]) acc[day] = { date: day, Income: 0, Expense: 0 };
    if (type === "income") acc[day].Income += amount;
    else if (type === "expense") acc[day].Expense += amount;
    return acc;
  }, {});

  const dayWiseChartData = Object.values(dayWiseData).sort((a, b) => new Date(a.date) - new Date(b.date));

  const filteredTableData = filteredTransactions.filter((t) => {
    return t.description?.toLowerCase().includes(search.toLowerCase());
  });

  const paginatedTableData = filteredTableData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const pieChartData = categories
    .map((category, index) => {
      const totalExpense = filteredTransactions
        .filter((t) => t.category_id === category.id && t.category?.type?.toLowerCase() === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return {
        name: category.name,
        value: totalExpense,
        color: generateColor(index),
      };
    })
    .filter((data) => data.value > 0);

  const monthlyComparisonData = months.map((month) => {
    const monthTransactions = userTransactions.filter((t) => {
      const date = new Date(t.transaction_date);
      return date.getMonth() === month.value && date.getFullYear() === selectedYear;
    });

    const totalExpense = monthTransactions
      .filter((t) => t.category?.type?.toLowerCase() === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalIncome = monthTransactions
      .filter((t) => t.category?.type?.toLowerCase() === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      name: month.name,
      Expense: totalExpense,
      Income: totalIncome,
    };
  });

  const exportToCSV = () => {
    const csvContent = [
      ["Date", "Description", "Amount", "Type", "Category"],
      ...filteredTableData.map((t) => [
        new Date(t.transaction_date).toLocaleDateString(),
        t.description,
        t.amount,
        t.category?.type,
        t.category?.name,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `transactions_${selectedYear}_${months[selectedMonth].name}.csv`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const totalCategories = categories.length;
  const totalTransactions = filteredTransactions.length;
  const totalAccount = new Set(userTransactions.map((t) => t.account_id)).size;

  return (
    <Box p={3} style={{ overflowX: "auto" }}>
      <Typography variant="h4" align="center" gutterBottom>
        Dashboard - {months[selectedMonth].name}
      </Typography>

      <Box mb={3} display="flex" justifyContent="center" gap={2} flexWrap="wrap">
        <TextField
          select
          label="Select Month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          size="small"
        >
          {months.map((month) => (
            <MenuItem key={month.value} value={month.value}>
              {month.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Select Year"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          size="small"
        >
          {[...Array(5)].map((_, i) => {
            const year = new Date().getFullYear() - i;
            return (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            );
          })}
        </TextField>

        <TextField
          label="Search by Description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
        />

        <button
          onClick={exportToCSV}
          style={{
            padding: "8px 16px",
            backgroundColor: "#03A9F4",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Export to CSV
        </button>

        <button
          onClick={() => navigate("/transactions")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Add /> Add Transaction
        </button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} style={{ padding: 16, marginBottom: 16 }}>
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={2}
                  style={{
                    padding: 16,
                    textAlign: "center",
                    backgroundColor: "#FF5722",
                    color: "#fff",
                  }}
                >
                  <Typography variant="h6">Total Categories</Typography>
                  <Typography variant="h4">{totalCategories}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={2}
                  style={{
                    padding: 16,
                    textAlign: "center",
                    backgroundColor: "#03A9F4",
                    color: "#fff",
                  }}
                >
                  <Typography variant="h6">Total Transactions</Typography>
                  <Typography variant="h4">{totalTransactions}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={2}
                  style={{
                    padding: 16,
                    textAlign: "center",
                    backgroundColor: "#4CAF50",
                    color: "#fff",
                  }}
                >
                  <Typography variant="h6">Total Account</Typography>
                  <Typography variant="h4">{totalAccount}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: 16, height: 350 }}>
            <Typography variant="h6" align="center">Category-wise Expense (Line Chart)</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={pieChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: 16, height: 350 }}>
            <Typography variant="h6" align="center">Category-wise Expense</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: 16, height: 350 }}>
            <Typography variant="h6" align="center">Day-wise Expense/Income</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={dayWiseChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Expense" fill="#f44336" />
                <Bar dataKey="Income" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: 16, height: 350 }}>
            <Typography variant="h6" align="center">Month & Category-wise Expense vs Income</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={monthCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Expense" fill="#f44336" />
                <Bar dataKey="Income" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: 16, height: 350 }}>
            <Typography variant="h6" align="center">Monthly Comparison of Expense vs Income</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={monthlyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Expense" fill="#f44336" />
                <Bar dataKey="Income" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} style={{ padding: 16 }}>
            <Typography variant="h6" align="center" gutterBottom>Transactions</Typography>
            <TableContainer
              style={{
                maxHeight: 400,
                overflowY: "auto",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
              }}
            >
              <Table size="small" style={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow style={{ backgroundColor: "#e0e0e0" }}>
                    <TableCell style={{ fontWeight: "bold" }}>Date</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Description</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Amount</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Type</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Category</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTableData.map((t, index) => (
                    <TableRow
                      key={index}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9f9f9",
                      }}
                    >
                      <TableCell>{new Date(t.transaction_date).toLocaleDateString()}</TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell>₹{t.amount}</TableCell>
                      <TableCell>{t.category?.type}</TableCell>
                      <TableCell>{t.category?.name}</TableCell>
                    </TableRow>
                  ))}
                  {paginatedTableData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredTableData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
