import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { Suspense, lazy } from "react";

const Charts = lazy(() => import("../../components/Charts"));

export default function AnalyticsSection({
  activeFilterLabel,
  allMonthsHighestExpenseCategories,
  dayWiseChartData,
  highestExpenseCategories,
  monthCategoryData,
  monthlyComparisonData,
  pieChartData,
  yearlyComparisonData,
}) {
  return (
    <>
      <Box mb={2}>
        <Typography variant="h6" fontWeight={700}>Analytics Overview</Typography>
        <Typography variant="body2" color="text.secondary">Distribution, category mix, trends, and comparisons</Typography>
      </Box>
      <Grid container spacing={3} mb={3}>
        <Suspense
          fallback={
            <Box sx={{ display: "flex", justifyContent: "center", py: 6, width: "100%" }}>
              <CircularProgress size={28} />
            </Box>
          }
        >
          <Charts
            pieChartData={pieChartData}
            monthCategoryData={monthCategoryData}
            dayWiseChartData={dayWiseChartData}
            monthlyComparisonData={monthlyComparisonData}
            yearlyComparisonData={yearlyComparisonData}
            highestExpenseCategories={highestExpenseCategories}
            allMonthsHighestExpenseCategories={allMonthsHighestExpenseCategories}
            activeFilterLabel={activeFilterLabel}
          />
        </Suspense>
      </Grid>
    </>
  );
}
