import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Container, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { useDispatch, useSelector } from "react-redux";
import { fetchTransactions } from "../redux/features/transactionSlice";
import { getCategoryAPI } from "../redux/features/categorySlice";
import { DataTable, FormSection, PageHeader, SearchFilterBar } from "../components/common";
import "./ProfitLossReport.css";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
});

const bankingKeywords = {
    interestIncome: ["interest income", "loan interest", "emi interest", "interest", "finance income"],
    nonInterestIncome: ["fee", "fees", "charge", "charges", "commission", "processing", "service", "penalty"],
    interestExpense: ["interest paid", "deposit interest", "fd interest", "rd interest", "borrowing", "finance cost"],
    provision: ["provision", "npa", "write off", "write-off", "bad debt", "impairment"],
    tax: ["tax", "tds", "gst", "income tax"],
};

const emptyBankingRow = (month, sortDate) => ({
    month,
    sortDate,
    interestIncome: 0,
    nonInterestIncome: 0,
    interestExpense: 0,
    operatingExpense: 0,
    provisions: 0,
    taxExpense: 0,
    netInterestIncome: 0,
    operatingIncome: 0,
    profitBeforeTax: 0,
    netProfit: 0,
    netMargin: 0,
});

const getCategoryName = (transaction, categories) => {
    const category = transaction.category || categories.find((item) => item.id === transaction.category_id);
    return category?.name || category?.category_name || transaction.category_name || "";
};

const getCategoryType = (transaction, categories) => {
    const category = transaction.category || categories.find((item) => item.id === transaction.category_id);
    return category?.type?.toLowerCase() || transaction.type?.toLowerCase() || transaction.transaction_type?.toLowerCase();
};

const includesAnyKeyword = (value, keywords) => keywords.some((keyword) => value.includes(keyword));

const getBankingLine = (type, transaction, categories) => {
    const categoryName = getCategoryName(transaction, categories);
    const haystack = [
        categoryName,
        transaction.description,
        transaction.note,
        transaction.narration,
        transaction.transaction_type,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (type === "income") {
        return includesAnyKeyword(haystack, bankingKeywords.interestIncome) ? "interestIncome" : "nonInterestIncome";
    }

    if (includesAnyKeyword(haystack, bankingKeywords.provision)) return "provisions";
    if (includesAnyKeyword(haystack, bankingKeywords.tax)) return "taxExpense";
    if (includesAnyKeyword(haystack, bankingKeywords.interestExpense)) return "interestExpense";
    return "operatingExpense";
};

const formatCurrency = (value) => currencyFormatter.format(value || 0);
const formatPercent = (value) => `${percentFormatter.format(value || 0)}%`;

const ProfitLossReport = () => {
    const dispatch = useDispatch();
    const isMobile = useMediaQuery("(max-width:600px)");
    const { transactions, loading } = useSelector((state) => state.transactions);
    const { list: categories } = useSelector((state) => state.category);
    const loggedInUser = useSelector((state) => state.auth.user);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        dispatch(fetchTransactions({ perPage: 1000 }));
        dispatch(getCategoryAPI());
    }, [dispatch]);

    const userTransactions = useMemo(
        () => transactions.filter((transaction) => !loggedInUser?.id || transaction.user_id === loggedInUser.id),
        [loggedInUser?.id, transactions]
    );

    const monthData = useMemo(() => {
        const startBoundary = startDate ? new Date(startDate) : null;
        const endBoundary = endDate ? new Date(endDate) : null;
        if (endBoundary) {
            endBoundary.setHours(23, 59, 59, 999);
        }

        const filtered = userTransactions.filter((transaction) => {
            const transactionDate = new Date(transaction.transaction_date);
            return (!startBoundary || transactionDate >= startBoundary) && (!endBoundary || transactionDate <= endBoundary);
        });

        const monthMap = {};
        filtered.forEach((transaction) => {
            const type = getCategoryType(transaction, categories);
            if (!["income", "expense"].includes(type)) return;

            const date = new Date(transaction.transaction_date);
            const month = date.toLocaleString("default", { month: "short" });
            const year = date.getFullYear();
            const key = `${month} ${year}`;

            if (!monthMap[key]) {
                monthMap[key] = emptyBankingRow(key, new Date(`${month} 1, ${year}`));
            }

            const amount = Math.abs(Number(transaction.amount)) || 0;
            monthMap[key][getBankingLine(type, transaction, categories)] += amount;
        });

        return Object.values(monthMap)
            .map((row) => {
                const netInterestIncome = row.interestIncome - row.interestExpense;
                const operatingIncome = netInterestIncome + row.nonInterestIncome;
                const profitBeforeTax = operatingIncome - row.operatingExpense - row.provisions;
                const netProfit = profitBeforeTax - row.taxExpense;
                const netMargin = operatingIncome > 0 ? (netProfit / operatingIncome) * 100 : 0;

                return {
                    ...row,
                    netInterestIncome,
                    operatingIncome,
                    profitBeforeTax,
                    netProfit,
                    netMargin,
                };
            })
            .sort((a, b) => a.sortDate - b.sortDate);
    }, [userTransactions, categories, startDate, endDate]);

    const reportTotals = useMemo(
        () =>
            monthData.reduce(
                (totals, row) => ({
                    interestIncome: totals.interestIncome + row.interestIncome,
                    nonInterestIncome: totals.nonInterestIncome + row.nonInterestIncome,
                    interestExpense: totals.interestExpense + row.interestExpense,
                    operatingExpense: totals.operatingExpense + row.operatingExpense,
                    provisions: totals.provisions + row.provisions,
                    taxExpense: totals.taxExpense + row.taxExpense,
                    netInterestIncome: totals.netInterestIncome + row.netInterestIncome,
                    operatingIncome: totals.operatingIncome + row.operatingIncome,
                    netProfit: totals.netProfit + row.netProfit,
                }),
                {
                    interestIncome: 0,
                    nonInterestIncome: 0,
                    interestExpense: 0,
                    operatingExpense: 0,
                    provisions: 0,
                    taxExpense: 0,
                    netInterestIncome: 0,
                    operatingIncome: 0,
                    netProfit: 0,
                }
            ),
        [monthData]
    );

    const summaryCards = [
        {
            label: "Interest Income",
            value: reportTotals.interestIncome,
            className: "profit-loss-page__summary-card--income",
        },
        {
            label: "Net Interest Income",
            value: reportTotals.netInterestIncome,
            className: "profit-loss-page__summary-card--nii",
        },
        {
            label: "Operating Income",
            value: reportTotals.operatingIncome,
            className: "profit-loss-page__summary-card--operating",
        },
        {
            label: "Net Profit / Loss",
            value: reportTotals.netProfit,
            className: reportTotals.netProfit >= 0
                ? "profit-loss-page__summary-card--profit"
                : "profit-loss-page__summary-card--loss",
        },
    ];

    return (
        <Container className={`profit-loss-page${isMobile ? " profit-loss-page--mobile" : ""}`}>
            <PageHeader
                title="Banking Profit & Loss"
                subtitle="Track interest income, funding cost, operating cost, provisions, and net banking profit."
                icon={<AccountBalanceIcon />}
                meta={[
                    { label: "Banking format", color: "primary" },
                    { label: `${monthData.length} periods`, variant: "outlined" },
                ]}
            />

            <FormSection title="Report Filters" description="Date range applies to transaction date." sx={{ mb: 3 }}>
                <SearchFilterBar sx={{ mb: 0 }}>
                    <TextField
                        label="Start Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        size="small"
                    />
                    <TextField
                        label="End Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        size="small"
                    />
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setStartDate("");
                            setEndDate("");
                        }}
                        className="profit-loss-page__clear"
                    >
                        Clear
                    </Button>
                </SearchFilterBar>

                <Box className="profit-loss-page__summary-grid">
                    {summaryCards.map((card) => (
                        <Box key={card.label} className={`profit-loss-page__summary-card ${card.className}`}>
                            <Typography variant="caption">{card.label}</Typography>
                            <Typography variant="h5">{formatCurrency(card.value)}</Typography>
                        </Box>
                    ))}
                </Box>

                <Stack className="profit-loss-page__metric-strip">
                    <Box>
                        <Typography variant="caption">Non-interest income</Typography>
                        <strong>{formatCurrency(reportTotals.nonInterestIncome)}</strong>
                    </Box>
                    <Box>
                        <Typography variant="caption">Interest expense</Typography>
                        <strong>{formatCurrency(reportTotals.interestExpense)}</strong>
                    </Box>
                    <Box>
                        <Typography variant="caption">Provisions + tax</Typography>
                        <strong>{formatCurrency(reportTotals.provisions + reportTotals.taxExpense)}</strong>
                    </Box>
                    <Box>
                        <Typography variant="caption">Net margin</Typography>
                        <strong>
                            {formatPercent(
                                reportTotals.operatingIncome > 0
                                    ? (reportTotals.netProfit / reportTotals.operatingIncome) * 100
                                    : 0
                            )}
                        </strong>
                    </Box>
                </Stack>

                <Box className="profit-loss-page__opening-note">
                    <Chip size="small" label="Banking P&L mapping" color="primary" variant="outlined" />
                    <Typography variant="body2" color="text.secondary">
                        Income is split into interest and fee/other income. Expenses are grouped into interest expense,
                        operating expense, provisions, and tax by category or transaction narration.
                    </Typography>
                </Box>

                <DataTable
                    dense
                    rows={monthData}
                    loading={loading}
                    emptyMessage="No banking P&L data found."
                    getRowId={(row) => row.month}
                    containerSx={{ overflowX: "auto" }}
                    columns={[
                        { field: "month", headerName: "Period", minWidth: 110, cellSx: { fontWeight: 700 } },
                        {
                            id: "interestIncome",
                            headerName: "Interest Income",
                            align: "right",
                            minWidth: 150,
                            cellSx: { color: "#047857", fontWeight: 800 },
                            render: (_, row) => formatCurrency(row.interestIncome),
                        },
                        {
                            id: "interestExpense",
                            headerName: "Interest Expense",
                            align: "right",
                            minWidth: 150,
                            cellSx: { color: "#c2410c", fontWeight: 800 },
                            render: (_, row) => formatCurrency(row.interestExpense),
                        },
                        {
                            id: "netInterestIncome",
                            headerName: "NII",
                            align: "right",
                            minWidth: 130,
                            cellSx: { color: "#2563eb", fontWeight: 800 },
                            render: (_, row) => formatCurrency(row.netInterestIncome),
                        },
                        {
                            id: "nonInterestIncome",
                            headerName: "Fee & Other Income",
                            align: "right",
                            minWidth: 170,
                            render: (_, row) => formatCurrency(row.nonInterestIncome),
                        },
                        {
                            id: "operatingExpense",
                            headerName: "Operating Expense",
                            align: "right",
                            minWidth: 170,
                            render: (_, row) => formatCurrency(row.operatingExpense),
                        },
                        {
                            id: "provisions",
                            headerName: "Provisions",
                            align: "right",
                            minWidth: 130,
                            render: (_, row) => formatCurrency(row.provisions),
                        },
                        {
                            id: "netProfit",
                            headerName: "Net Profit / Loss",
                            align: "right",
                            minWidth: 160,
                            render: (_, row) => (
                                <Box
                                    component="span"
                                    className={
                                        row.netProfit >= 0
                                            ? "profit-loss-page__value--positive"
                                            : "profit-loss-page__value--negative"
                                    }
                                >
                                    {formatCurrency(row.netProfit)}
                                </Box>
                            ),
                        },
                        {
                            id: "netMargin",
                            headerName: "Net Margin",
                            align: "right",
                            minWidth: 120,
                            render: (_, row) => formatPercent(row.netMargin),
                        },
                    ]}
                />
            </FormSection>
        </Container>
    );
};

export default ProfitLossReport;
