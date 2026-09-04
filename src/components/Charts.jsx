import { memo, useMemo, useState } from "react";
import {
    Grid,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Tabs,
    Tab,
    Box,
    ToggleButton,
    ToggleButtonGroup,
  } from "@mui/material";
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
    AreaChart,
    Area,
    Cell,
    LabelList,
    ReferenceLine,
  } from "recharts";
  import PropTypes from "prop-types";

const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// ✅ "monthYear" string (jaise "January 2026" ya "2026-01") ko Date mein convert karne ki koshish karta hai.
const parseMonthYear = (monthYear) => {
    if (!monthYear) return null;
    const direct = new Date(monthYear);
    if (!Number.isNaN(direct.getTime())) return direct;

    const parts = String(monthYear).split(/[-/]/);
    if (parts.length === 2) {
        const [a, b] = parts.map((p) => Number(p));
        if (a > 999) return new Date(a, (b || 1) - 1, 1); // YYYY-MM
        if (b > 999) return new Date(b, (a || 1) - 1, 1); // MM-YYYY
    }
    return null;
};

// ✅ Custom tooltip taaki ₹ format aur positive/negative color dono dikhe
const SavingsTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const savings = payload[0]?.value ?? 0;
    return (
        <Box
            sx={{
                background: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                p: 1.2,
                boxShadow: 2,
            }}
        >
            <Typography variant="caption" sx={{ fontWeight: "bold" }}>{label}</Typography>
            <Typography
                variant="body2"
                sx={{ color: savings >= 0 ? "#22c55e" : "#ef4444", fontWeight: "bold" }}
            >
                {savings >= 0 ? "Saved" : "Overspent"}: ₹{Math.abs(savings).toLocaleString("en-IN")}
            </Typography>
        </Box>
    );
};
SavingsTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array,
    label: PropTypes.string,
};

const Charts = ({
    pieChartData,
    monthCategoryData,
    dayWiseChartData,
    monthlyComparisonData,
    yearlyComparisonData,
    highestExpenseCategories,
    allMonthsHighestExpenseCategories,
    activeFilterLabel,
  }) => {
    const [activeTab, setActiveTab] = useState("distribution");
    const [distributionMode, setDistributionMode] = useState("expense");

    // ✅ "Highest Expense Category by Month" table ki pagination
    const [expenseCategoryPage, setExpenseCategoryPage] = useState(0);
    const [expenseCategoryRowsPerPage, setExpenseCategoryRowsPerPage] = useState(3);

    const distributionData =
      distributionMode === "expense"
        ? [...pieChartData].sort((a, b) => b.value - a.value).slice(0, 7)
        : [...monthCategoryData]
            .map((item, index) => ({
              ...item,
              color: pieChartData.find((entry) => entry.name === item.name)?.color || "#2563eb",
              order: index,
            }))
            .sort((a, b) => (b.Expense + b.Income) - (a.Expense + a.Income))
            .slice(0, 7);

    // ✅ Har month ka Savings (Income - Expense) nikalo, monthlyComparisonData se hi derive karke
    const savingsTrendData = useMemo(
      () =>
        (monthlyComparisonData || []).map((item) => ({
          name: item.name,
          Savings: (item.Income || 0) - (item.Expense || 0),
        })),
      [monthlyComparisonData]
    );

    // ✅ Overall average savings — quick summary line ke liye
    const averageSavings = useMemo(() => {
      if (!savingsTrendData.length) return 0;
      const total = savingsTrendData.reduce((sum, item) => sum + item.Savings, 0);
      return total / savingsTrendData.length;
    }, [savingsTrendData]);

    // ✅ Latest month ka savings — current month kaisa perform kar raha hai
    const latestMonthSavings = savingsTrendData.length
      ? savingsTrendData[savingsTrendData.length - 1].Savings
      : 0;

    // ✅ Current month ko sabse upar rakhte hue, latest → oldest order mein sort karo.
    const sortedAllMonthsHighestExpenseCategories = useMemo(() => {
      const today = new Date();
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      return [...allMonthsHighestExpenseCategories]
        .filter((item) => {
          const d = parseMonthYear(item.monthYear);
          return !d || d <= currentMonthStart;
        })
        .sort((a, b) => {
          const dateA = parseMonthYear(a.monthYear) || new Date(0);
          const dateB = parseMonthYear(b.monthYear) || new Date(0);
          return dateB - dateA; // newest (current month) pehle
        });
    }, [allMonthsHighestExpenseCategories]);

    return (
      <>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Analytics Workspace</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Explore distribution, category performance, trend movement, and long-term comparisons for {activeFilterLabel}.
            </Typography>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              <Tab value="distribution" label="Distribution" />
              <Tab value="category" label="Category Mix" />
              <Tab value="trend" label="Daily Trend" />
              <Tab value="monthly" label="Monthly" />
              <Tab value="yearly" label="Yearly" />
              <Tab value="savings" label="Savings Trend" />
            </Tabs>

            {activeTab === "distribution" && (
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={distributionMode}
                  onChange={(_, value) => value && setDistributionMode(value)}
                >
                  <ToggleButton value="expense">Expense Only</ToggleButton>
                  <ToggleButton value="mix">Income vs Expense</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

            {activeTab === "savings" && (
              <Box sx={{ display: "flex", gap: 3, mb: 2, flexWrap: "wrap" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Average Monthly Savings</Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: averageSavings >= 0 ? "#22c55e" : "#ef4444" }}
                  >
                    ₹{Math.abs(averageSavings).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    {averageSavings < 0 ? " (overspent)" : ""}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Latest Month</Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: latestMonthSavings >= 0 ? "#22c55e" : "#ef4444" }}
                  >
                    ₹{Math.abs(latestMonthSavings).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    {latestMonthSavings < 0 ? " (overspent)" : ""}
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ height: 360 }}>
              {activeTab === "distribution" && (
                <ResponsiveContainer width="100%" height="100%">
                  {distributionMode === "expense" ? (
                    <BarChart
                      data={distributionData}
                      layout="vertical"
                      margin={{ top: 8, right: 32, left: 24, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={120} />
                      <Tooltip formatter={(value) => [formatCurrency(value), "Expense"]} />
                      <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                        {distributionData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                        <LabelList dataKey="value" position="right" formatter={(value) => formatCurrency(value)} />
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart
                      data={distributionData}
                      layout="vertical"
                      margin={{ top: 8, right: 32, left: 24, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={120} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="Expense" radius={[0, 10, 10, 0]} fill="#ef4444">
                        <LabelList dataKey="Expense" position="right" formatter={(value) => (value ? formatCurrency(value) : "")} />
                      </Bar>
                      <Bar dataKey="Income" radius={[0, 10, 10, 0]} fill="#22c55e">
                        <LabelList dataKey="Income" position="right" formatter={(value) => (value ? formatCurrency(value) : "")} />
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}

              {activeTab === "category" && (
                <ResponsiveContainer width="100%" height="100%">
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
              )}

              {activeTab === "trend" && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dayWiseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Expense" stroke="#f44336" />
                    <Line type="monotone" dataKey="Income" stroke="#4caf50" />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeTab === "monthly" && (
                <ResponsiveContainer width="100%" height="100%">
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
              )}

              {activeTab === "yearly" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Expense" fill="#f44336" />
                    <Bar dataKey="Income" fill="#4caf50" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeTab === "savings" && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsTrendData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                    <defs>
                      <linearGradient id="savingsPositive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<SavingsTooltip />} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                    <Area
                      type="monotone"
                      dataKey="Savings"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#savingsPositive)"
                      dot={{ r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
  
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <Typography variant="h6" align="center" gutterBottom>
              Highest Expense Category for Current Filter
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Month-Year</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {highestExpenseCategories.length > 0 ? (
                    highestExpenseCategories.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.monthYear}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No expense data available for the current month
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
  
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <Typography variant="h6" align="center" gutterBottom>
              Highest Expense Category by Month for Current Filter
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Month-Year</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedAllMonthsHighestExpenseCategories.length > 0 ? (
                    sortedAllMonthsHighestExpenseCategories
                      .slice(
                        expenseCategoryPage * expenseCategoryRowsPerPage,
                        expenseCategoryPage * expenseCategoryRowsPerPage + expenseCategoryRowsPerPage
                      )
                      .map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.monthYear}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No expense data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {sortedAllMonthsHighestExpenseCategories.length > 0 && (
              <TablePagination
                component="div"
                count={sortedAllMonthsHighestExpenseCategories.length}
                page={expenseCategoryPage}
                onPageChange={(e, newPage) => setExpenseCategoryPage(newPage)}
                rowsPerPage={expenseCategoryRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setExpenseCategoryRowsPerPage(parseInt(e.target.value, 10));
                  setExpenseCategoryPage(0);
                }}
                rowsPerPageOptions={[3, 6, 12, 24]}
              />
            )}
          </Paper>
        </Grid>
      </>
    );
  };
  
  Charts.propTypes = {
    pieChartData: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
      })
    ).isRequired,
    monthCategoryData: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        Expense: PropTypes.number.isRequired,
        Income: PropTypes.number.isRequired,
      })
    ).isRequired,
    dayWiseChartData: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string.isRequired,
        Expense: PropTypes.number.isRequired,
        Income: PropTypes.number.isRequired,
      })
    ).isRequired,
    monthlyComparisonData: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        Expense: PropTypes.number.isRequired,
        Income: PropTypes.number.isRequired,
      })
    ).isRequired,
    yearlyComparisonData: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        Expense: PropTypes.number.isRequired,
        Income: PropTypes.number.isRequired,
      })
    ).isRequired,
    highestExpenseCategories: PropTypes.arrayOf(
      PropTypes.shape({
        monthYear: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
      })
    ).isRequired,
    allMonthsHighestExpenseCategories: PropTypes.arrayOf(
      PropTypes.shape({
        monthYear: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
      })
    ).isRequired,
    activeFilterLabel: PropTypes.string.isRequired,
  };
  
  export default memo(Charts);