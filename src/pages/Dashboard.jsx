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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import TablePagination from "@mui/material/TablePagination";

<<<<<<< HEAD
import { Add, SmartToy } from "@mui/icons-material"; // Import the Add and SmartToy icons
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import "./Dashboard.css"; // Import the CSS file
import Charts from "../components/Charts"; // Import the new Charts component
=======
import { Add, SmartToy, FileDownload, BarChart, ListAlt, PieChart, CompareArrows } from "@mui/icons-material"; // Add FileDownload icon
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import "./Dashboard.css"; // Import the CSS file
import Charts from "../components/Charts"; // Import the new Charts component
import { a } from "framer-motion/client";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "../components/SortableItem"; // Ensure the correct path to SortableItem
>>>>>>> f81c650 (Initial commit)

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
  const { transactions = [] } = useSelector((state) => state.transactions);
<<<<<<< HEAD
  const loggedInUser = useSelector((state) => state.auth.user);

=======
  const { list: accounts } = useSelector((state) => state.accounts);

  const loggedInUser = useSelector((state) => state.auth.user);
>>>>>>> f81c650 (Initial commit)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [popupMonth, setPopupMonth] = useState(new Date().getMonth());
  const [popupYear, setPopupYear] = useState(new Date().getFullYear());
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const [voiceQueryResults, setVoiceQueryResults] = useState([]);
  const [showVoiceResults, setShowVoiceResults] = useState(false);
<<<<<<< HEAD
=======
  const [widgets, setWidgets] = useState([
    { id: "summary", label: "Summary" },
    { id: "charts", label: "Charts" },
    { id: "transactions", label: "Transactions" },
    { id: "monthlyComparison", label: "Month-wise Income and Expenses" },
  ]);
>>>>>>> f81c650 (Initial commit)

  useEffect(() => {
    dispatch(fetchTransactions());
    dispatch(getCategoryAPI());
    dispatch(getUserAPI());
    dispatch(getAccountAPI());
  }, [dispatch]);

<<<<<<< HEAD
=======

  console.log("Ajay", accounts);

  const TotalAccountBalance = accounts
    .filter((account) => account.user_id === loggedInUser?.id)
    .reduce((sum, account) => sum + parseFloat(account.account_balance), 0);
  console.log("TotalAccountBalance", TotalAccountBalance);
>>>>>>> f81c650 (Initial commit)
  const userTransactions = transactions.filter((t) => t.user_id === loggedInUser?.id);

  const filteredTransactions = userTransactions.filter((t) => {
    const date = new Date(t.transaction_date);
    const isSameMonth = date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    return isSameMonth;
  });

  const monthCategoryData = categories.map((category) => {
    const totalExpense = filteredTransactions
      .filter((t) => t.category_id === category.id && t.category?.type?.toLowerCase() === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalIncome = filteredTransactions
      .filter((t) => t.category_id === category.id && t.category?.type?.toLowerCase() === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      name: category.name,
      Expense: totalExpense || 0, // Ensure zero if no expense
      Income: totalIncome || 0,  // Ensure zero if no income
    };
  }); // Remove the filter to include all categories

  const dayWiseData = filteredTransactions.reduce((acc, t) => {
    const day = new Date(t.transaction_date).toISOString().split("T")[0];
    const type = t.category?.type?.toLowerCase();
    const amount = parseFloat(t.amount);
    const categoryName = t.category?.name || "Uncategorized";

    if (!acc[day]) acc[day] = { date: day, Income: 0, Expense: 0, categories: {} };
    if (!acc[day].categories[categoryName]) acc[day].categories[categoryName] = { Income: 0, Expense: 0 };

    if (type === "income") {
      acc[day].Income += amount;
      acc[day].categories[categoryName].Income += amount;
    } else if (type === "expense") {
      acc[day].Expense += amount;
      acc[day].categories[categoryName].Expense += amount;
    }

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

  // Calculate yearly comparison data
  const yearlyComparisonData = [...Array(5)].map((_, i) => {
    const year = new Date().getFullYear() - i;

    const yearTransactions = userTransactions.filter((t) => {
      const date = new Date(t.transaction_date);
      return date.getFullYear() === year;
    });

    const totalExpense = yearTransactions
      .filter((t) => t.category?.type?.toLowerCase() === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalIncome = yearTransactions
      .filter((t) => t.category?.type?.toLowerCase() === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      name: year.toString(),
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



  // Function to calculate the highest expense category for each month
  const calculateHighestExpenseCategory = () => {
    const monthlyCategoryExpenses = {};

    userTransactions.forEach((t) => {
      const date = new Date(t.transaction_date);
      const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`; // Corrected to use 1-based month
      const categoryName = t.category?.name;

      if (!monthlyCategoryExpenses[monthYear]) {
        monthlyCategoryExpenses[monthYear] = {};
      }

      if (!monthlyCategoryExpenses[monthYear][categoryName]) {
        monthlyCategoryExpenses[monthYear][categoryName] = 0;
      }

      if (t.category?.type?.toLowerCase() === "expense") {
        monthlyCategoryExpenses[monthYear][categoryName] += parseFloat(t.amount);
      }
    });

    const currentMonthYear = `${new Date().getMonth() + 1}-${new Date().getFullYear()}`; // Corrected to use 1-based month
    const currentMonthCategories = monthlyCategoryExpenses[currentMonthYear] || {};

    const highestCategory = Object.entries(currentMonthCategories).reduce(
      (max, [category, amount]) => (amount > max.amount ? { category, amount } : max),
      { category: null, amount: 0 }
    );

    return highestCategory.category ? [{ monthYear: currentMonthYear, ...highestCategory }] : [];
  };

  const highestExpenseCategories = calculateHighestExpenseCategory();

  const calculateAllMonthsHighestExpenseCategories = () => {
    const monthlyCategoryExpenses = {};

    userTransactions.forEach((t) => {
      const date = new Date(t.transaction_date);
      const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`; // 1-based month
      const categoryName = t.category?.name;

      if (!monthlyCategoryExpenses[monthYear]) {
        monthlyCategoryExpenses[monthYear] = {};
      }

      if (!monthlyCategoryExpenses[monthYear][categoryName]) {
        monthlyCategoryExpenses[monthYear][categoryName] = 0;
      }

      if (t.category?.type?.toLowerCase() === "expense") {
        monthlyCategoryExpenses[monthYear][categoryName] += parseFloat(t.amount);
      }
    });

    return Object.entries(monthlyCategoryExpenses).map(([monthYear, categories]) => {
      const highestCategory = Object.entries(categories).reduce(
        (max, [category, amount]) => (amount > max.amount ? { category, amount } : max),
        { category: null, amount: 0 }
      );
      return { monthYear, ...highestCategory };
    });
  };

  const allMonthsHighestExpenseCategories = calculateAllMonthsHighestExpenseCategories();

  const handleOpenPopup = () => setIsPopupOpen(true);
  const handleClosePopup = () => setIsPopupOpen(false);

  const popupData = filteredTransactions.filter((t) => {
    const date = new Date(t.transaction_date);
    return (
      t.category?.id === selectedCategory &&
      date.getMonth() === popupMonth &&
      date.getFullYear() === popupYear
    );
  });

  const totalPopupIncome = popupData
    .filter((t) => t.category?.type?.toLowerCase() === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalPopupExpense = popupData
    .filter((t) => t.category?.type?.toLowerCase() === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const handleVoiceQuery = () => {
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true });
  };

  const handleResetResults = () => {
    setShowVoiceResults(false);
    setVoiceQueryResults([]);
    resetTranscript();
  };

  useEffect(() => {
    if (!isListening) return;

    const processVoiceQuery = () => {
      const lowerTranscript = transcript.toLowerCase();
      const categoryMatch = categories.find((category) =>
        lowerTranscript.includes(category.name.toLowerCase())
      );

      const monthMatch = months.find((month) =>
        lowerTranscript.includes(month.name.toLowerCase())
      );

      const yearMatch = [...Array(5)].map((_, i) => {
        const year = new Date().getFullYear() - i;
        return year.toString();
      }).find((year) => lowerTranscript.includes(year));

      if (categoryMatch && monthMatch) {
        const year = yearMatch ? parseInt(yearMatch) : new Date().getFullYear();
        const filteredData = userTransactions.filter((t) => {
          const date = new Date(t.transaction_date);
          return (
            t.category?.id === categoryMatch.id &&
            date.getMonth() === monthMatch.value &&
            date.getFullYear() === year
          );
        });

        const totalIncome = filteredData
          .filter((t) => t.category?.type?.toLowerCase() === "income")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const totalExpense = filteredData
          .filter((t) => t.category?.type?.toLowerCase() === "expense")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const transactions = filteredData.map((t) => ({
          date: new Date(t.transaction_date).toLocaleDateString(),
          description: t.description,
          amount: t.amount,
          type: t.category?.type,
        }));

        setVoiceQueryResults([
          {
            category: categoryMatch.name,
            month: monthMatch.name,
            year,
            totalIncome,
            totalExpense,
            transactions,
          },
        ]);

        setShowVoiceResults(true);

        // Hide results after 20 seconds
        setTimeout(() => {
          setShowVoiceResults(false);
          setVoiceQueryResults([]);
        }, 20000);

        SpeechRecognition.stopListening();
        setIsListening(false);
        resetTranscript();
      }
    };

    processVoiceQuery();
  }, [transcript, isListening, categories, resetTranscript, userTransactions]);

<<<<<<< HEAD
  return (
    <Box p={3} style={{ overflowX: "auto" }}>
=======
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setWidgets((prevWidgets) => {
        const oldIndex = prevWidgets.findIndex((widget) => widget.id === active.id);
        const newIndex = prevWidgets.findIndex((widget) => widget.id === over.id);
        return arrayMove(prevWidgets, oldIndex, newIndex);
      });
    }
  };

  const toggleWidget = (id) => {
    setWidgets((prevWidgets) =>
      prevWidgets.some((widget) => widget.id === id)
        ? prevWidgets.filter((widget) => widget.id !== id)
        : [...prevWidgets, { id, label: id.charAt(0).toUpperCase() + id.slice(1) }]
    );
  };

  const getGridColumns = () => {
    if (widgets.length === 1 && widgets[0].id === "charts") {
      return "1fr"; // Full width for charts
    }
    return "1fr"; // Default full width for all sections
  };

  return (
    <Box p={3} style={{ overflowX: "auto", minHeight: "100vh" }}> {/* Ensure full screen height */}
>>>>>>> f81c650 (Initial commit)
      <Typography variant="h4" align="center" gutterBottom>
        Dashboard - {months[selectedMonth].name}
      </Typography>

<<<<<<< HEAD
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

        <button
          onClick={exportToCSV}
          className="dashboard-button export-button"
        >
          Export to CSV
        </button>

        <button
          onClick={() => navigate("/transactions")}
          className="dashboard-button add-transaction-button"
        >
          <Add /> Add Transaction
        </button>

        <button
          onClick={handleOpenPopup}
          className="dashboard-button view-category-button"
        >
          View Category Details
        </button>

        <button
          onClick={handleVoiceQuery}
          className="dashboard-button voice-query-button"
        >
          <SmartToy /> Ask me your income and expense
        </button>

        <button
          onClick={handleResetResults}
          className="dashboard-button reset-results-button"
        >
          Reset Results
        </button>
      </Box>

=======
      <Box mb={3}>
        <Grid container spacing={1}

          direction="row"
          sx={{
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          {/* Month Selector */}
          <Grid item xs={12} sm={6} md={1}>
            <TextField
              select
              fullWidth
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
          </Grid>

          {/* Year Selector */}
          <Grid item xs={12} sm={6} md={1}>
            <TextField
              select
              fullWidth
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
          </Grid>

          {/* Export to CSV Button */}
          <Grid item xs={12} sm={6} md={1}>
            <Button
              onClick={exportToCSV}
              variant="outlined"
              size="large"
              title="Export Transactions to CSV"
              startIcon={<FileDownload />}
              fullWidth
            >
            </Button>
          </Grid>

          {/* View Category Button */}
          <Grid item xs={12} sm={6} md={1}>
            <Button
              onClick={handleOpenPopup}
              variant="outlined"
              size="large"
              title="View Category Details"
              fullWidth
              style={{
                transition: "background-color 0.3s, color 0.3s",
                backgroundColor: "#f5f5f5",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#e0f7fa";
                e.target.style.color = "#00796b";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#f5f5f5";
                e.target.style.color = "inherit";
              }}
            >
              <ListAlt /> {/* Replaced text with a related icon */}
            </Button>
          </Grid>

          {/* Voice Query Button */}
          <Grid item xs={12} sm={6} md={1}>
            <Button
              onClick={handleVoiceQuery}
              variant="outlined"
              size="large"
              title="Voice Query"
              startIcon={<SmartToy />}
              fullWidth
            >
            </Button>
          </Grid>

          {/* Toggle Buttons */}
          <Grid item xs={12} sm={6} md={1}>
            <Button
              onClick={() => toggleWidget("summary")}
              variant="outlined"
              size="large"
              fullWidth
              title="Summary"
            >
              <ListAlt />
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={1}>
            <Button
              onClick={() => toggleWidget("charts")}
              variant="outlined"
              size="large"
              fullWidth
              title="Charts"
            >
              <PieChart />
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={1}>
            <Button
              onClick={() => toggleWidget("transactions")}
              variant="outlined"
              size="large"
              fullWidth
              title="Transactions"
            >
              <BarChart />
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={1}>
            <Button
              onClick={() => toggleWidget("monthlyComparison")}
              variant="outlined"
              size="large"
              fullWidth
              title="Monthly Comparison"
            >
              <CompareArrows />
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                setWidgets([
                  { id: "summary", label: "Summary" },
                  { id: "charts", label: "Charts" },
                  { id: "transactions", label: "Transactions" },
                  { id: "monthlyComparison", label: "Month-wise Income and Expenses" },
                ]);
              }}
              startIcon={<Add />}
              fullWidth
              title="Reset Widgets"
            >
            </Button>
          </Grid>
        </Grid>


      </Box>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((widget) => widget.id)} strategy={verticalListSortingStrategy}>
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: getGridColumns(),
              gap: "16px", // Add spacing between widgets
              minHeight: "100vh", // Ensure full screen height
            }}
          >
            {widgets.map((widget) => (
              <SortableItem key={widget.id} id={widget.id}>
                <Box
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "16px",
                    backgroundColor: widget.id === "summary"
                      ? "#e8f5e9"
                      : widget.id === "charts"
                      ? "#e3f2fd"
                      : widget.id === "transactions"
                      ? "#ffebee"
                      : "#ede7f6", // Multicolor combination
                    maxHeight: "100%",
                    overflowY: "auto",
                  }}
                >
                  {widget.id === "summary" && (
                    <Box>
                      <Box mb={3} p={2} style={{ backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
                        <Typography variant="h6" align="center" gutterBottom>
                          Summary for {months[selectedMonth].name} {selectedYear}
                        </Typography>
                        <Grid container spacing={2} justifyContent="center">
                          <Grid item xs={12} sm={3}>
                            <Paper
                              elevation={3}
                              style={{
                                padding: "12px",
                                textAlign: "center",
                                backgroundColor: "#e8f5e9",
                                borderRadius: "8px",
                              }}
                            >
                              <Typography variant="subtitle1" style={{ color: "#4caf50", fontWeight: "bold" }}>
                                Total Income
                              </Typography>
                              <Typography variant="h5" style={{ color: "#4caf50", fontWeight: "bold" }}>
                                ₹
                                {filteredTransactions
                                  .filter((t) => t.category?.type?.toLowerCase() === "income")
                                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Paper
                              elevation={3}
                              style={{
                                padding: "12px",
                                textAlign: "center",
                                backgroundColor: "#ffebee",
                                borderRadius: "8px",
                              }}
                            >
                              <Typography variant="subtitle1" style={{ color: "#f44336", fontWeight: "bold" }}>
                                Total Expense
                              </Typography>
                              <Typography variant="h5" style={{ color: "#f44336", fontWeight: "bold" }}>
                                ₹
                                {filteredTransactions
                                  .filter((t) => t.category?.type?.toLowerCase() === "expense")
                                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Paper
                              elevation={3}
                              style={{
                                padding: "12px",
                                textAlign: "center",
                                backgroundColor: "#e3f2fd",
                                borderRadius: "8px",
                              }}
                            >
                              <Typography variant="subtitle1" style={{ color: "#2196f3", fontWeight: "bold" }}>
                                Net Savings
                              </Typography>
                              <Typography variant="h5" style={{ color: "#2196f3", fontWeight: "bold" }}>
                                ₹
                                {filteredTransactions
                                  .filter((t) => t.category?.type?.toLowerCase() === "income")
                                  .reduce((sum, t) => sum + parseFloat(t.amount), 0) -
                                  filteredTransactions
                                    .filter((t) => t.category?.type?.toLowerCase() === "expense")
                                    .reduce((sum, t) => sum + parseFloat(t.amount), 0)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Paper
                              elevation={3}
                              style={{
                                padding: "12px",
                                textAlign: "center",
                                backgroundColor: "#ede7f6",
                                borderRadius: "8px",
                              }}
                            >
                              <Typography variant="subtitle1" style={{ color: "#673ab7", fontWeight: "bold" }}>
                                Current Balance
                              </Typography>
                              <Typography variant="h5" style={{ color: "#673ab7", fontWeight: "bold" }}>
                                ₹{TotalAccountBalance}
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  )}
                  {widget.id === "charts" && (
                    <Box>
                      <Typography variant="h6" align="center" gutterBottom>
                        Charts
                      </Typography>
                      <Grid container spacing={3}>
                        <Charts
                          pieChartData={pieChartData}
                          monthCategoryData={monthCategoryData}
                          dayWiseChartData={dayWiseChartData}
                          monthlyComparisonData={monthlyComparisonData}
                          yearlyComparisonData={yearlyComparisonData}
                          highestExpenseCategories={highestExpenseCategories}
                          allMonthsHighestExpenseCategories={allMonthsHighestExpenseCategories}
                        />
                      </Grid>
                    </Box>
                  )}
                  {widget.id === "transactions" && (
                    <Box>
                      <Typography variant="h6" align="center" gutterBottom>
                        Transactions
                      </Typography>
                      <Box mb={2} display="flex" justifyContent="flex-end">
                        <TextField
                          label="Search by Description"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          size="small"
                          style={{ width: "300px" }}
                        />
                      </Box>
                      <TableContainer
                        style={{
                          maxHeight: "400px", // Set a maximum height for the table container
                          overflowY: "auto", // Enable vertical scrolling
                          backgroundColor: "rgba(255, 255, 255, 0.8)", // Transparent background
                          borderRadius: "8px",
                          width: "100%", // Ensure the table container takes full width
                        }}
                      >
                        <style>
                          {`
                            ::-webkit-scrollbar {
                              width: 8px;
                            }
                            ::-webkit-scrollbar-thumb {
                              background-color: rgba(0, 0, 0, 0.2); /* Visible scrollbar thumb */
                              border-radius: 4px;
                            }
                            ::-webkit-scrollbar-track {
                              background-color: transparent;
                            }
                          `}
                        </style>
                        <Table size="small" style={{ minWidth: 650 }}>
                          <TableHead>
                            <TableRow style={{ backgroundColor: "#e0e0e0" }}>
                              <TableCell style={{ fontWeight: "bold" }}>Date</TableCell>
                              <TableCell style={{ fontWeight: "bold" }}>Desc</TableCell> {/* Shortened Description */}
                              <TableCell style={{ fontWeight: "bold" }}>Amt (₹)</TableCell> {/* Shortened Amount */}
                              <TableCell style={{ fontWeight: "bold" }}>Type</TableCell>
                              <TableCell style={{ fontWeight: "bold" }}>Cat</TableCell> {/* Shortened Category */}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredTableData.map((t, index) => (
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
                            {filteredTableData.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} align="center">
                                  No transactions found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                  {widget.id === "monthlyComparison" && (
                    <Box>
                      <Typography variant="h6" align="center" gutterBottom>
                        Month-wise Income and Expenses
                      </Typography>
                      <TableContainer
                        style={{
                          maxHeight: "300px", // Scrollable height for the table
                          overflowY: "auto",
                          backgroundColor: "rgba(255, 255, 255, 0.8)", // Transparent background
                          borderRadius: "8px",
                        }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell style={{ fontWeight: "bold" }}>Month</TableCell>
                              <TableCell style={{ fontWeight: "bold" }}>Total Income</TableCell>
                              <TableCell style={{ fontWeight: "bold" }}>Total Expense</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {monthlyComparisonData.map((data, index) => (
                              <TableRow key={index}>
                                <TableCell>{data.name}</TableCell>
                                <TableCell>₹{data.Income}</TableCell>
                                <TableCell>₹{data.Expense}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              </SortableItem>
            ))}
          </Box>
        </SortableContext>
      </DndContext>

>>>>>>> f81c650 (Initial commit)
      {showVoiceResults && voiceQueryResults.length > 0 && (
        <Box mb={3} p={2} style={{ backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
          <Typography variant="h6" gutterBottom>
            Your Voice Query Results
          </Typography>
          {voiceQueryResults.map((result, index) => (
            <Box key={index} mb={2}>
              <Typography variant="body1">
                <strong>Category:</strong> {result.category}
              </Typography>
              <Typography variant="body1">
                <strong>Month:</strong> {result.month}
              </Typography>
              <Typography variant="body1">
                <strong>Year:</strong> {result.year}
              </Typography>
              <Typography variant="body1">
                <strong>Total Income:</strong> ₹{result.totalIncome}
              </Typography>
              <Typography variant="body1">
                <strong>Total Expense:</strong> ₹{result.totalExpense}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ fontWeight: "bold" }}>Date</TableCell>
                      <TableCell style={{ fontWeight: "bold" }}>Description</TableCell>
                      <TableCell style={{ fontWeight: "bold" }}>Amount</TableCell>
                      <TableCell style={{ fontWeight: "bold" }}>Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.transactions.map((t, tIndex) => (
                      <TableRow key={tIndex}>
                        <TableCell>{t.date}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>₹{t.amount}</TableCell>
                        <TableCell>{t.type}</TableCell>
                      </TableRow>
                    ))}
                    {result.transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
<<<<<<< HEAD
        </Box>
      )}

      <Grid container spacing={3}>
        <Charts
          pieChartData={pieChartData}
          monthCategoryData={monthCategoryData}
          dayWiseChartData={dayWiseChartData}
          monthlyComparisonData={monthlyComparisonData}
          yearlyComparisonData={yearlyComparisonData}
          highestExpenseCategories={highestExpenseCategories}
          allMonthsHighestExpenseCategories={allMonthsHighestExpenseCategories}
        />
      </Grid>

      <Grid item xs={12}>
        <Paper elevation={3} style={{ padding: 16 }}>
          <Typography variant="h6" align="center" gutterBottom>Transactions</Typography>
          <Box mb={2} display="flex" justifyContent="flex-end">
            <TextField
              label="Search by Description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              style={{ width: "300px" }}
            />
          </Box>
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

=======
          <Box display="flex" justifyContent="flex-end">
            <button
              onClick={handleResetResults}
              className="dashboard-button reset-results-button"
            >
              Reset Results
            </button>
          </Box>
        </Box>
      )}

>>>>>>> f81c650 (Initial commit)
      <Dialog open={isPopupOpen} onClose={handleClosePopup} fullWidth maxWidth="sm">
        <DialogTitle>Category Details</DialogTitle>
        <DialogContent>
          <Box display="flex" gap={2} mb={2}>
            <TextField
              select
              label="Select Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              size="small"
              fullWidth
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Select Month"
              value={popupMonth}
              onChange={(e) => setPopupMonth(parseInt(e.target.value))}
              size="small"
              fullWidth
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
              value={popupYear}
              onChange={(e) => setPopupYear(parseInt(e.target.value))}
              size="small"
              fullWidth
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
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: "bold" }}>Date</TableCell>
<<<<<<< HEAD
                  <TableCell style={{ fontWeight: "bold" }}>Description</TableCell>
                  <TableCell style={{ fontWeight: "bold" }}>Amount</TableCell>
=======
                  <TableCell style={{ fontWeight: "bold" }}>Desc</TableCell> {/* Shortened Description */}
                  <TableCell style={{ fontWeight: "bold" }}>Amt (₹)</TableCell> {/* Shortened Amount */}
>>>>>>> f81c650 (Initial commit)
                  <TableCell style={{ fontWeight: "bold" }}>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {popupData.map((t, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(t.transaction_date).toLocaleDateString()}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>₹{t.amount}</TableCell>
                    <TableCell>{t.category?.type}</TableCell>
                  </TableRow>
                ))}
                {popupData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box mt={2}>
            <Typography variant="body1">
              <strong>Total Income:</strong> ₹{totalPopupIncome}
            </Typography>
            <Typography variant="body1">
              <strong>Total Expense:</strong> ₹{totalPopupExpense}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePopup} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
