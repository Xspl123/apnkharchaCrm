import {
<<<<<<< HEAD
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
} from "recharts";
import PropTypes from "prop-types";

const Charts = ({
  pieChartData,
  monthCategoryData,
  dayWiseChartData,
  monthlyComparisonData,
  yearlyComparisonData,
  highestExpenseCategories,
  allMonthsHighestExpenseCategories,
}) => {
  return (
    <>
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
          <Typography variant="h6" align="center">Category-wise Expense vs Income</Typography>
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

      <Grid item xs={12} md={6}>
        <Paper elevation={3} style={{ padding: 16, height: 350 }}>
          <Typography variant="h6" align="center">Yearly Comparison of Expense vs Income</Typography>
          <ResponsiveContainer width="100%" height="90%">
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
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper elevation={3} style={{ padding: 16, marginBottom: 16 }}>
          <Typography variant="h6" align="center" gutterBottom>
            Highest Expense Category for Current Month
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: "bold" }}>Month-Year</TableCell>
                  <TableCell style={{ fontWeight: "bold" }}>Category</TableCell>
                  <TableCell style={{ fontWeight: "bold" }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {highestExpenseCategories.length > 0 ? (
                  highestExpenseCategories.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.monthYear}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>₹{item.amount}</TableCell>
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
        <Paper elevation={3} style={{ padding: 16, marginBottom: 16 }}>
          <Typography variant="h6" align="center" gutterBottom>
            Highest Expense Category by Month
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: "bold" }}>Month-Year</TableCell>
                  <TableCell style={{ fontWeight: "bold" }}>Category</TableCell>
                  <TableCell style={{ fontWeight: "bold" }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allMonthsHighestExpenseCategories.length > 0 ? (
                  allMonthsHighestExpenseCategories.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.monthYear}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>₹{item.amount}</TableCell>
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
};

export default Charts;
=======
    Grid,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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
  } from "recharts";
  import PropTypes from "prop-types";
  
  const Charts = ({
    pieChartData,
    monthCategoryData,
    dayWiseChartData,
    monthlyComparisonData,
    yearlyComparisonData,
    highestExpenseCategories,
    allMonthsHighestExpenseCategories,
  }) => {
    return (
      <>
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
            <Typography variant="h6" align="center">Category-wise Expense vs Income</Typography>
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
  
        <Grid item xs={12} md={6}>
          <Paper elevation={3} style={{ padding: 16, height: 350 }}>
            <Typography variant="h6" align="center">Yearly Comparison of Expense vs Income</Typography>
            <ResponsiveContainer width="100%" height="90%">
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
          </Paper>
        </Grid>
  
        <Grid item xs={12}>
          <Paper elevation={3} style={{ padding: 16, marginBottom: 16 }}>
            <Typography variant="h6" align="center" gutterBottom>
              Highest Expense Category for Current Month
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ fontWeight: "bold" }}>Month-Year</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Category</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {highestExpenseCategories.length > 0 ? (
                    highestExpenseCategories.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.monthYear}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>₹{item.amount}</TableCell>
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
          <Paper elevation={3} style={{ padding: 16, marginBottom: 16 }}>
            <Typography variant="h6" align="center" gutterBottom>
              Highest Expense Category by Month
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ fontWeight: "bold" }}>Month-Year</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Category</TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allMonthsHighestExpenseCategories.length > 0 ? (
                    allMonthsHighestExpenseCategories.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.monthYear}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>₹{item.amount}</TableCell>
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
  };
  
  export default Charts;
>>>>>>> f81c650 (Initial commit)
