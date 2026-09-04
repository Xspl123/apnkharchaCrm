import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import { saveAs } from "file-saver";
import { getPeriodBalanceSummary } from "../utils/ledgerBalances";
import { getCreditCardAvailableLimit, getCreditCardOutstanding, isCreditCardAccount, withDerivedCreditCardBalances } from "../utils/creditCardAccounts";

import OrgSetupBanner from "../components/OrgSetupBanner";
import useSpeechToText from "../hooks/useSpeechToText";
import { getUserAPI } from "../features/auth/state/authSlice";
import { getAccountAPI } from "../redux/features/accountSlice";
import { getCategoryAPI } from "../redux/features/categorySlice";
import { fetchLoans } from "../redux/features/loanSlice";
import { fetchTransactions } from "../redux/features/transactionSlice";
import AiSummaryPanel from "./dashboard/AiSummaryPanel";
import AnalyticsSection from "./dashboard/AnalyticsSection";
import CashFlowTimeline from "./dashboard/CashFlowTimeline";
import CategoryDetailsDialog from "./dashboard/CategoryDetailsDialog";
import DashboardHero from "./dashboard/DashboardHero";
import DashboardSetupState from "./dashboard/DashboardSetupState";
import InsightsSection from "./dashboard/InsightsSection";
import RecentActivityFeed from "./dashboard/RecentActivityFeed";
import SmartInsightsPanel from "./dashboard/SmartInsightsPanel";
import KpiSection from "./dashboard/KpiSection";
import MonthlySummaryTable from "./dashboard/MonthlySummaryTable";
import TransactionsTable from "./dashboard/TransactionsTable";
import VoiceQueryResults from "./dashboard/VoiceQueryResults";
import {
  findCategoryFromVoiceQuery,
  fmtAmt,
  formatDateInput,
  generateColor,
  getCategoryForTransaction,
  getMonthFromVoiceQuery,
  getTransactionDateValue,
  getYearFromVoiceQuery,
  monthAliases,
  months,
  normalizeVoiceText,
  parseTransactionDate,
  summarizeProfitLoss,
} from "./dashboard/dashboardUtils";
import "./Dashboard.css";

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: categories = [], loading: categoriesLoading = false } = useSelector((s) => s.category);
  const { list: accounts = [], loading: accountsLoading = false } = useSelector((s) => s.accounts);
  const { transactions = [], loading: transactionsLoading = false } = useSelector((s) => s.transactions);
  const loggedInUser = useSelector((s) => s.auth.user);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [popupMonth, setPopupMonth] = useState(new Date().getMonth());
  const [popupYear, setPopupYear] = useState(new Date().getFullYear());
  const [voiceQueryResults, setVoiceQueryResults] = useState([]);
  const [showVoiceResults, setShowVoiceResults] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const { isListening, startListening, supported } = useSpeechToText();

  useEffect(() => {
    dispatch(fetchTransactions({ page: 1, perPage: 1000 }));
    dispatch(getCategoryAPI());
    dispatch(getUserAPI());
    dispatch(getAccountAPI());
    dispatch(fetchLoans());
  }, [dispatch]);

  const userTransactions = useMemo(
    () => transactions.filter((t) => t.user_id === loggedInUser?.id),
    [loggedInUser?.id, transactions]
  );

  const dashboardLoading = accountsLoading || categoriesLoading || transactionsLoading;
  const accountsWithDerivedCardBalances = useMemo(
    () => withDerivedCreditCardBalances(accounts, userTransactions, categories),
    [accounts, categories, userTransactions]
  );
  const mainAccounts = useMemo(() => accountsWithDerivedCardBalances.filter((account) => !isCreditCardAccount(account)), [accountsWithDerivedCardBalances]);
  const creditCards = useMemo(() => accountsWithDerivedCardBalances.filter(isCreditCardAccount), [accountsWithDerivedCardBalances]);
  const creditCardSummary = useMemo(() => creditCards.reduce((summary, account) => ({
    outstanding: summary.outstanding + getCreditCardOutstanding(account),
    availableLimit: summary.availableLimit + getCreditCardAvailableLimit(account),
    creditLimit: summary.creditLimit + (Number(account.credit_limit) || 0),
  }), { outstanding: 0, availableLimit: 0, creditLimit: 0 }), [creditCards]);
  const mainAccountIds = useMemo(() => new Set(mainAccounts.map((account) => String(account.id))), [mainAccounts]);
  const creditCardIds = useMemo(() => new Set(creditCards.map((account) => String(account.id))), [creditCards]);
  const hasAccounts = accountsWithDerivedCardBalances.length > 0;
  const hasCategories = categories.length > 0;
  const hasTransactions = userTransactions.length > 0;

  const filteredTransactions = useMemo(() =>
    userTransactions.filter((t) => {
      const date = parseTransactionDate(t.transaction_date);
      if (!date) return false;
      if (startDate || endDate) {
        const d = getTransactionDateValue(t.transaction_date);
        return (!startDate || d >= startDate) && (!endDate || d <= endDate);
      }
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    }), [endDate, selectedMonth, selectedYear, startDate, userTransactions]);

  const availableTypes = useMemo(() =>
    [...new Set(categories.map((c) => c.type?.toLowerCase()).filter(Boolean))],
    [categories]);

  const visibleCategories = useMemo(() =>
    categories.filter((c) => selectedTypeFilter === "all" ? true : c.type?.toLowerCase() === selectedTypeFilter),
    [categories, selectedTypeFilter]);

  useEffect(() => {
    if (selectedCategoryFilter !== "all" && !visibleCategories.some((c) => String(c.id) === String(selectedCategoryFilter))) {
      setSelectedCategoryFilter("all");
    }
  }, [selectedCategoryFilter, visibleCategories]);

  useEffect(() => {
    setPage(0);
  }, [endDate, search, selectedCategoryFilter, selectedMonth, selectedTypeFilter, selectedYear, startDate]);

  const dashboardTransactions = useMemo(() =>
    filteredTransactions.filter((t) => {
      const category = getCategoryForTransaction(t, categories);
      const catType = category?.type?.toLowerCase();
      const catId = category?.id ?? t.category_id;
      return (selectedTypeFilter === "all" || catType === selectedTypeFilter) &&
        (selectedCategoryFilter === "all" || String(catId) === String(selectedCategoryFilter));
    }), [categories, filteredTransactions, selectedCategoryFilter, selectedTypeFilter]);

  const monthCategoryData = useMemo(() =>
    visibleCategories.map((cat) => {
      let expense = 0;
      let income = 0;
      dashboardTransactions.forEach((t) => {
        const category = getCategoryForTransaction(t, categories);
        if (String(category?.id ?? t.category_id) !== String(cat.id)) return;
        const amt = parseFloat(t.amount) || 0;
        const type = category?.type?.toLowerCase();
        if (type === "expense") expense += amt;
        if (type === "income") income += amt;
      });
      return { name: cat.name, Expense: expense, Income: income };
    }).filter((c) => c.Expense > 0 || c.Income > 0),
    [categories, dashboardTransactions, visibleCategories]);

  const dayWiseChartData = useMemo(() => {
    const map = dashboardTransactions.reduce((acc, t) => {
      const day = getTransactionDateValue(t.transaction_date);
      if (!day) return acc;
      const category = getCategoryForTransaction(t, categories);
      const type = category?.type?.toLowerCase();
      const amt = parseFloat(t.amount) || 0;
      const cat = category?.name || "Uncategorized";
      if (!acc[day]) acc[day] = { date: day, Income: 0, Expense: 0, categories: {} };
      if (!acc[day].categories[cat]) acc[day].categories[cat] = { Income: 0, Expense: 0 };
      if (type === "income") {
        acc[day].Income += amt;
        acc[day].categories[cat].Income += amt;
      }
      if (type === "expense") {
        acc[day].Expense += amt;
        acc[day].categories[cat].Expense += amt;
      }
      return acc;
    }, {});
    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [categories, dashboardTransactions]);

  const filteredTableData = useMemo(() =>
    dashboardTransactions.filter((t) => {
      const category = getCategoryForTransaction(t, categories);
      const query = search.toLowerCase();
      return t.description?.toLowerCase().includes(query) ||
        category?.name?.toLowerCase().includes(query) ||
        category?.type?.toLowerCase().includes(query);
    }), [categories, dashboardTransactions, search]);

  const paginatedTableData = useMemo(() =>
    filteredTableData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredTableData, page, rowsPerPage]);

  const pieChartData = useMemo(() =>
    visibleCategories.map((cat, i) => {
      const total = dashboardTransactions
        .filter((t) => {
          const category = getCategoryForTransaction(t, categories);
          return String(category?.id ?? t.category_id) === String(cat.id) && category?.type?.toLowerCase() === "expense";
        })
        .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
      return { name: cat.name, value: total, color: generateColor(i), fill: generateColor(i) };
    }).filter((d) => d.value > 0), [categories, dashboardTransactions, visibleCategories]);

  const monthlyComparisonData = useMemo(() =>
    months.map((month) => {
      let expense = 0;
      let income = 0;
      userTransactions.forEach((t) => {
        const d = parseTransactionDate(t.transaction_date);
        if (!d) return;
        const category = getCategoryForTransaction(t, categories);
        const ct = category?.type?.toLowerCase();
        const cid = category?.id ?? t.category_id;
        if (d.getMonth() !== month.value || d.getFullYear() !== selectedYear) return;
        if (selectedTypeFilter !== "all" && ct !== selectedTypeFilter) return;
        if (selectedCategoryFilter !== "all" && String(cid) !== String(selectedCategoryFilter)) return;
        const amt = parseFloat(t.amount) || 0;
        if (ct === "expense") expense += amt;
        if (ct === "income") income += amt;
      });
      return { name: month.name, Expense: expense, Income: income };
    }).filter((m) => m.Expense > 0 || m.Income > 0),
    [categories, selectedCategoryFilter, selectedTypeFilter, selectedYear, userTransactions]);

  const yearlyComparisonData = useMemo(() =>
    [...Array(5)].map((_, i) => {
      const year = new Date().getFullYear() - i;
      let expense = 0;
      let income = 0;
      userTransactions.forEach((t) => {
        const d = parseTransactionDate(t.transaction_date);
        if (!d) return;
        const category = getCategoryForTransaction(t, categories);
        const ct = category?.type?.toLowerCase();
        const cid = category?.id ?? t.category_id;
        if (d.getFullYear() !== year) return;
        if (selectedTypeFilter !== "all" && ct !== selectedTypeFilter) return;
        if (selectedCategoryFilter !== "all" && String(cid) !== String(selectedCategoryFilter)) return;
        const amt = parseFloat(t.amount) || 0;
        if (ct === "expense") expense += amt;
        if (ct === "income") income += amt;
      });
      return { name: String(year), Expense: expense, Income: income };
    }).filter((y) => y.Expense > 0 || y.Income > 0),
    [categories, selectedCategoryFilter, selectedTypeFilter, userTransactions]);

  const calculateHighestExpenseCategory = useCallback(() => {
    const mce = {};
    userTransactions.forEach((t) => {
      const d = parseTransactionDate(t.transaction_date);
      if (!d) return;
      const my = `${d.getMonth() + 1}-${d.getFullYear()}`;
      const category = getCategoryForTransaction(t, categories);
      const cn = category?.name;
      const ct = category?.type?.toLowerCase();
      const cid = category?.id ?? t.category_id;
      if (!cn || ct !== "expense") return;
      if ((selectedTypeFilter !== "all" && ct !== selectedTypeFilter) ||
        (selectedCategoryFilter !== "all" && String(cid) !== String(selectedCategoryFilter))) return;
      if (!mce[my]) mce[my] = {};
      if (!mce[my][cn]) mce[my][cn] = 0;
      mce[my][cn] += parseFloat(t.amount) || 0;
    });
    const cmy = `${new Date().getMonth() + 1}-${new Date().getFullYear()}`;
    const cmc = mce[cmy] || {};
    const hc = Object.entries(cmc).reduce((max, [cat, amt]) => amt > max.amount ? { category: cat, amount: amt } : max, { category: null, amount: 0 });
    return hc.category ? [{ monthYear: cmy, ...hc }] : [];
  }, [categories, selectedCategoryFilter, selectedTypeFilter, userTransactions]);

  const calculateAllMonthsHighestExpenseCategories = useCallback(() => {
    const mce = {};
    userTransactions.forEach((t) => {
      const d = parseTransactionDate(t.transaction_date);
      if (!d) return;
      const my = `${d.getMonth() + 1}-${d.getFullYear()}`;
      const category = getCategoryForTransaction(t, categories);
      const cn = category?.name;
      const ct = category?.type?.toLowerCase();
      const cid = category?.id ?? t.category_id;
      if (!cn || ct !== "expense") return;
      if ((selectedTypeFilter !== "all" && ct !== selectedTypeFilter) ||
        (selectedCategoryFilter !== "all" && String(cid) !== String(selectedCategoryFilter))) return;
      if (!mce[my]) mce[my] = {};
      if (!mce[my][cn]) mce[my][cn] = 0;
      mce[my][cn] += parseFloat(t.amount) || 0;
    });
    return Object.entries(mce).map(([my, cats]) => {
      const hc = Object.entries(cats).reduce((max, [cat, amt]) => amt > max.amount ? { category: cat, amount: amt } : max, { category: null, amount: 0 });
      return { monthYear: my, ...hc };
    });
  }, [categories, selectedCategoryFilter, selectedTypeFilter, userTransactions]);

  const highestExpenseCategories = useMemo(() => calculateHighestExpenseCategory(), [calculateHighestExpenseCategory]);
  const allMonthsHighestExpenseCategories = useMemo(() => calculateAllMonthsHighestExpenseCategories(), [calculateAllMonthsHighestExpenseCategories]);

  const dashboardSummary = useMemo(() => {
    const periodStart = startDate ? new Date(`${startDate}T00:00:00`) : new Date(selectedYear, selectedMonth, 1);
    const periodEnd = endDate ? new Date(endDate + "T23:59:59") : new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
    const periodTotals = summarizeProfitLoss(dashboardTransactions, categories);
    const balanceSummary = getPeriodBalanceSummary({
      accounts: mainAccounts,
      transactions: userTransactions,
      categories,
      periodStart,
      periodEnd,
    });
    const categoriesUsed = dashboardTransactions.reduce((set, t) => {
      const category = getCategoryForTransaction(t, categories);
      if (category?.name) set.add(category.name);
      return set;
    }, new Set());
    const totalExpense = periodTotals.grossExpense - periodTotals.reimbursed;

    return {
      ...periodTotals,
      totalExpense,
      openingBalance: balanceSummary.openingBalance,
      periodNet: balanceSummary.periodNet,
      closingBalance: balanceSummary.closingBalance,
      currentBalance: balanceSummary.currentBalance,
      creditCardOutstanding: creditCardSummary.outstanding,
      creditCardAvailableLimit: creditCardSummary.availableLimit,
      creditCardLimit: creditCardSummary.creditLimit,
      transactionCount: dashboardTransactions.length,
      activeCategoryCount: categoriesUsed.size,
    };
  }, [categories, creditCardSummary, dashboardTransactions, endDate, mainAccounts, selectedMonth, selectedYear, startDate, userTransactions]);

  const previousPeriodSummary = useMemo(() => {
    const prev = new Date(selectedYear, selectedMonth - 1, 1);
    const pm = prev.getMonth();
    const py = prev.getFullYear();
    const transactionsForPeriod = userTransactions.filter((t) => {
      const d = parseTransactionDate(t.transaction_date);
      if (!d) return false;
      const category = getCategoryForTransaction(t, categories);
      const ct = category?.type?.toLowerCase();
      const cid = category?.id ?? t.category_id;
      if (d.getMonth() !== pm || d.getFullYear() !== py) return false;
      if (selectedTypeFilter !== "all" && ct !== selectedTypeFilter) return false;
      if (selectedCategoryFilter !== "all" && String(cid) !== String(selectedCategoryFilter)) return false;
      return true;
    });
    const totals = summarizeProfitLoss(transactionsForPeriod, categories);
    return { ...totals, totalExpense: totals.grossExpense - totals.reimbursed, transactionCount: transactionsForPeriod.length };
  }, [categories, selectedCategoryFilter, selectedMonth, selectedTypeFilter, selectedYear, userTransactions]);

  const activeFilterLabel = useMemo(() => {
    const cat = categories.find((c) => String(c.id) === String(selectedCategoryFilter));
    if (cat) return `${cat.name} (${cat.type || "Type"})`;
    if (selectedTypeFilter !== "all") return `${selectedTypeFilter.charAt(0).toUpperCase()}${selectedTypeFilter.slice(1)} categories`;
    return "All categories";
  }, [categories, selectedCategoryFilter, selectedTypeFilter]);

  const aiSummaryText = useMemo(() => {
    const periodNet = dashboardSummary.periodNet;
    const closingBalance = dashboardSummary.closingBalance;
    const expRatio = dashboardSummary.totalIncome > 0
      ? ((dashboardSummary.totalExpense / dashboardSummary.totalIncome) * 100).toFixed(1) : "0.0";

    let trend;
    if (periodNet >= 0) {
      trend = closingBalance >= 0
        ? "a healthy positive balance"
        : "an improving balance — this period was net-positive, though the closing balance is still recovering from an earlier shortfall";
    } else {
      trend = closingBalance >= 0
        ? `a net outflow this period (expenses were ${expRatio}% of income) — the closing balance stays positive only because of the opening balance carried forward`
        : "negative balance pressure, with expenses exceeding income both this period and cumulatively";
    }

    const topCat = pieChartData[0]?.name || "no dominant expense category";
    const topAmt = pieChartData[0]?.value || 0;
    return `For ${activeFilterLabel}, the dashboard shows ${trend}. Opening balance is ${fmtAmt(dashboardSummary.openingBalance)}, period net is ${fmtAmt(dashboardSummary.periodNet)}, and main closing balance is ${fmtAmt(dashboardSummary.closingBalance)}. Credit card outstanding is ${fmtAmt(dashboardSummary.creditCardOutstanding)}. Income is ${fmtAmt(dashboardSummary.totalIncome)} against net expense of ${fmtAmt(dashboardSummary.totalExpense)}, so expense utilization is ${expRatio}% of income. Strongest expense concentration is in ${topCat} at ${fmtAmt(topAmt)}.`;
  }, [activeFilterLabel, dashboardSummary, pieChartData]);

  const cashFlowData = useMemo(() => {
    const dailyMap = dashboardTransactions.reduce((acc, transaction) => {
      const date = getTransactionDateValue(transaction.transaction_date);
      if (!date) return acc;

      const category = getCategoryForTransaction(transaction, categories);
      const type = category?.type?.toLowerCase();
      const amount = Math.abs(parseFloat(transaction.amount)) || 0;

      if (!acc[date]) acc[date] = { date, Income: 0, Expense: 0, Net: 0, Closing: dashboardSummary.openingBalance };
      const accountId = String(transaction.account_id);
      const transferToId = String(transaction.transfer_to || "");
      const isMainAccountTransaction = mainAccountIds.has(accountId);
      const isCreditCardPayment = type === "transfer" && mainAccountIds.has(accountId) && creditCardIds.has(transferToId);

      if ((type === "income" || type === "reimbursement") && isMainAccountTransaction) {
        acc[date].Income += amount;
        acc[date].Net += amount;
      }
      if ((type === "expense" && isMainAccountTransaction) || isCreditCardPayment) {
        acc[date].Expense += amount;
        acc[date].Net -= amount;
      }
      return acc;
    }, {});

    let runningBalance = dashboardSummary.openingBalance;
    return Object.values(dailyMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((item) => {
        runningBalance += item.Net;
        return { ...item, Closing: runningBalance };
      });
  }, [categories, creditCardIds, dashboardSummary.openingBalance, dashboardTransactions, mainAccountIds]);

  const topSpendingCategories = useMemo(() => {
    const maxExpense = Math.max(...monthCategoryData.map((item) => item.Expense), 0);

    return monthCategoryData
      .filter((item) => item.Expense > 0)
      .map((item) => {
        const share = dashboardSummary.totalExpense > 0 ? (item.Expense / dashboardSummary.totalExpense) * 100 : 0;
        const utilization = maxExpense > 0 ? (item.Expense / maxExpense) * 100 : 0;
        const tone = share >= 45 ? "danger" : share >= 25 ? "warning" : "success";
        return { ...item, share, utilization, tone };
      })
      .sort((a, b) => b.Expense - a.Expense)
      .slice(0, 5);
  }, [dashboardSummary.totalExpense, monthCategoryData]);

  const categoryExpenseChange = useMemo(() => {
    const top = topSpendingCategories[0];
    if (!top) return null;

    const prev = new Date(selectedYear, selectedMonth - 1, 1);
    const previousExpense = userTransactions.reduce((sum, transaction) => {
      const date = parseTransactionDate(transaction.transaction_date);
      if (!date || date.getMonth() !== prev.getMonth() || date.getFullYear() !== prev.getFullYear()) return sum;

      const category = getCategoryForTransaction(transaction, categories);
      if (category?.type?.toLowerCase() !== "expense" || category?.name !== top.name) return sum;
      return sum + (Math.abs(parseFloat(transaction.amount)) || 0);
    }, 0);

    if (previousExpense <= 0) return { category: top.name, current: top.Expense, previous: 0, percent: null };
    return {
      category: top.name,
      current: top.Expense,
      previous: previousExpense,
      percent: ((top.Expense - previousExpense) / previousExpense) * 100,
    };
  }, [categories, selectedMonth, selectedYear, topSpendingCategories, userTransactions]);

  const smartInsights = useMemo(() => {
    const periodDays = cashFlowData.length > 0
      ? Math.max(1, cashFlowData.length)
      : Math.max(1, new Date(selectedYear, selectedMonth + 1, 0).getDate());
    const expenseRatio = dashboardSummary.totalIncome > 0
      ? (dashboardSummary.totalExpense / dashboardSummary.totalIncome) * 100
      : 0;
    const averageDailyExpense = dashboardSummary.totalExpense / periodDays;
    const coverDays = averageDailyExpense > 0
      ? Math.max(0, dashboardSummary.closingBalance / averageDailyExpense)
      : null;

    return {
      expenseRatio,
      categoryExpenseChange,
      averageDailyExpense,
      coverDays,
    };
  }, [cashFlowData.length, categoryExpenseChange, dashboardSummary, selectedMonth, selectedYear]);

  const recentTransactions = useMemo(() =>
    [...userTransactions]
      .sort((a, b) => {
        const dateA = parseTransactionDate(a.transaction_date)?.getTime() || 0;
        const dateB = parseTransactionDate(b.transaction_date)?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 5),
    [userTransactions]);

  const popupData = useMemo(() =>
    dashboardTransactions.filter((t) => {
      const d = parseTransactionDate(t.transaction_date);
      if (!d) return false;
      const category = getCategoryForTransaction(t, categories);
      return String(category?.id ?? t.category_id) === String(selectedCategory) &&
        d.getMonth() === popupMonth && d.getFullYear() === popupYear;
    }), [categories, dashboardTransactions, popupMonth, popupYear, selectedCategory]);

  const exportToCSV = () => {
    const csv = [
      ["Date", "Description", "Amount", "Type", "Category"],
      ...filteredTableData.map((t) => {
        const category = getCategoryForTransaction(t, categories);
        return [
          new Date(t.transaction_date).toLocaleDateString(),
          t.description,
          t.amount,
          category?.type,
          category?.name,
        ];
      }),
    ].map((r) => r.join(",")).join("\n");
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `transactions_${selectedYear}_${months[selectedMonth].name}.csv`);
  };

  const handleExportSummaryPDF = useCallback(async () => {
    const el = document.createElement("div");
    el.innerHTML = `
      <div style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">
        <h1 style="margin:0 0 8px;font-size:24px;">Dashboard Summary</h1>
        <p style="margin:0 0 20px;color:#475569;">${activeFilterLabel}</p>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;">
          <div style="padding:16px;border:1px solid #cbd5e1;border-radius:12px;"><strong>Opening Balance</strong><br/>${fmtAmt(dashboardSummary.openingBalance)}</div>
          <div style="padding:16px;border:1px solid #cbd5e1;border-radius:12px;"><strong>Period Net</strong><br/>${fmtAmt(dashboardSummary.periodNet)}</div>
          <div style="padding:16px;border:1px solid #cbd5e1;border-radius:12px;"><strong>Closing Balance</strong><br/>${fmtAmt(dashboardSummary.closingBalance)}</div>
          <div style="padding:16px;border:1px solid #cbd5e1;border-radius:12px;"><strong>Net Expense</strong><br/>${fmtAmt(dashboardSummary.totalExpense)}</div>
        </div>
        <p style="padding:16px;background:#eff6ff;border-radius:12px;line-height:1.5;">${aiSummaryText}</p>
      </div>`;
    const { default: html2pdf } = await import("html2pdf.js");
    await html2pdf().set({
      margin: 0.5,
      filename: `dashboard_${selectedYear}_${selectedMonth + 1}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    }).from(el).save();
  }, [activeFilterLabel, aiSummaryText, dashboardSummary, selectedMonth, selectedYear]);

  const handleAskMe = () => {
    setVoiceError("");
    startListening({
      lang: "en-IN",
      onResult: (transcript) => {
        const normalized = normalizeVoiceText(transcript);
        const monthIndex = getMonthFromVoiceQuery(transcript, selectedMonth);
        const year = getYearFromVoiceQuery(transcript, selectedYear);
        const monthName = months[monthIndex]?.name || months[selectedMonth].name;
        const expenseTransactions = userTransactions.filter((t) => getCategoryForTransaction(t, categories)?.type?.toLowerCase() === "expense");
        const monthTransactions = expenseTransactions.filter((t) => {
          const d = new Date(t.transaction_date);
          return d.getMonth() === monthIndex && d.getFullYear() === year;
        });

        const monthCategoryTotals = monthTransactions.reduce((acc, t) => {
          const categoryName = getCategoryForTransaction(t, categories)?.name || "Uncategorized";
          acc[categoryName] = (acc[categoryName] || 0) + (parseFloat(t.amount) || 0);
          return acc;
        }, {});

        const topCategoryEntry = Object.entries(monthCategoryTotals).sort((a, b) => b[1] - a[1])[0];
        const yearlyMonthTotals = expenseTransactions.reduce((acc, t) => {
          const d = new Date(t.transaction_date);
          if (d.getFullYear() !== year) return acc;
          const key = d.getMonth();
          acc[key] = (acc[key] || 0) + (parseFloat(t.amount) || 0);
          return acc;
        }, {});

        const topMonthEntry = Object.entries(yearlyMonthTotals).sort((a, b) => b[1] - a[1])[0];
        const matchedCategory = findCategoryFromVoiceQuery(transcript, categories);
        const hasExplicitMonth =
          monthAliases.some((aliases) => aliases.some((alias) => normalized.includes(normalizeVoiceText(alias)))) ||
          normalized.includes("this month") ||
          normalized.includes("current month") ||
          normalized.includes("is month") ||
          normalized.includes("is mahine") ||
          normalized.includes("iss mahine") ||
          normalized.includes("last month") ||
          normalized.includes("previous month") ||
          normalized.includes("pichle mahine") ||
          normalized.includes("pichhle mahine");
        const hasExplicitYear = /\b20\d{2}\b/.test(normalized) ||
          normalized.includes("last year") ||
          normalized.includes("pichle saal");
        const asksTopMonthOnly =
          normalized.includes("kis mahine") ||
          normalized.includes("kaunse mahine") ||
          normalized.includes("konse mahine") ||
          normalized.includes("which month");
        const asksTopCategory =
          (normalized.includes("sabse jyada") || normalized.includes("sabse zyada") || normalized.includes("highest") || normalized.includes("most")) &&
          (
            normalized.includes("category") ||
            normalized.includes("categary") ||
            normalized.includes("kis category") ||
            normalized.includes("kharcha kis") ||
            normalized.includes("expense kis")
          );
        const asksTopMonth =
          asksTopMonthOnly ||
          (
            (normalized.includes("sabse jyada") || normalized.includes("sabse zyada") || normalized.includes("highest") || normalized.includes("most")) &&
            (normalized.includes("month") || normalized.includes("mahina") || normalized.includes("mahine") || normalized.includes("महीने"))
          );
        const asksCategoryTotal =
          matchedCategory &&
          (
            normalized.includes("kitna") ||
            normalized.includes("total") ||
            normalized.includes("kharcha") ||
            normalized.includes("expense") ||
            normalized.includes("kitne") ||
            hasExplicitMonth ||
            hasExplicitYear
          );

        let resultPayload = null;

        if (asksTopMonth) {
          if (!topMonthEntry) {
            setShowVoiceResults(false);
            setVoiceQueryResults([]);
            setVoiceError(`${year} ke liye expense data nahi mila.`);
            return;
          }
          const winningMonthIndex = parseInt(topMonthEntry[0], 10);
          const winningMonthTransactions = expenseTransactions.filter((t) => {
            const d = new Date(t.transaction_date);
            return d.getFullYear() === year && d.getMonth() === winningMonthIndex;
          });
          resultPayload = {
            category: "Highest Expense Month",
            month: months[winningMonthIndex].name,
            year,
            totalIncome: 0,
            totalExpense: topMonthEntry[1],
            transactions: winningMonthTransactions.map((t) => {
              const category = getCategoryForTransaction(t, categories);
              return {
                date: new Date(t.transaction_date).toLocaleDateString(),
                description: t.description,
                amount: t.amount,
                type: category?.type,
              };
            }),
          };
        } else if (asksCategoryTotal) {
          const matched = userTransactions.filter((t) => {
            const d = new Date(t.transaction_date);
            const category = getCategoryForTransaction(t, categories);
            return String(category?.id ?? t.category_id) === String(matchedCategory.id) &&
              d.getMonth() === monthIndex &&
              d.getFullYear() === year;
          });
          const totalIncome = matched.filter((t) => getCategoryForTransaction(t, categories)?.type?.toLowerCase() === "income").reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
          const totalExpense = matched.filter((t) => getCategoryForTransaction(t, categories)?.type?.toLowerCase() === "expense").reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
          resultPayload = {
            category: matchedCategory.name,
            month: monthName,
            year,
            totalIncome,
            totalExpense,
            transactions: matched.map((t) => {
              const category = getCategoryForTransaction(t, categories);
              return {
                date: new Date(t.transaction_date).toLocaleDateString(),
                description: t.description,
                amount: t.amount,
                type: category?.type,
              };
            }),
          };
        } else if (asksTopCategory || !matchedCategory || normalized.includes("kharcha")) {
          if (!topCategoryEntry) {
            setShowVoiceResults(false);
            setVoiceQueryResults([]);
            setVoiceError(`${monthName} ${year} ke liye category expense data nahi mila.`);
            return;
          }
          const winningCategory = topCategoryEntry[0];
          const winningTransactions = monthTransactions.filter((t) => (getCategoryForTransaction(t, categories)?.name || "Uncategorized") === winningCategory);
          resultPayload = {
            category: winningCategory,
            month: monthName,
            year,
            totalIncome: 0,
            totalExpense: topCategoryEntry[1],
            transactions: winningTransactions.map((t) => {
              const category = getCategoryForTransaction(t, categories);
              return {
                date: new Date(t.transaction_date).toLocaleDateString(),
                description: t.description,
                amount: t.amount,
                type: category?.type,
              };
            }),
          };
        }

        if (!resultPayload) {
          setShowVoiceResults(false);
          setVoiceQueryResults([]);
          setVoiceError("Query samajh nahi aayi. Example: March me sabse jyada kharcha kis category me hua.");
          return;
        }

        setVoiceError("");
        setVoiceQueryResults([resultPayload]);
        setShowVoiceResults(true);
      },
      onError: (msg) => {
        setShowVoiceResults(false);
        setVoiceQueryResults([]);
        setVoiceError(msg);
      },
    });
  };

  const handleQuickPeriod = useCallback((period) => {
    const now = new Date();

    if (period === "current") {
      setSelectedMonth(now.getMonth());
      setSelectedYear(now.getFullYear());
      setStartDate(formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1)));
      setEndDate(formatDateInput(now));
    } else if (period === "previous") {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      setSelectedMonth(prev.getMonth());
      setSelectedYear(prev.getFullYear());
      setStartDate(formatDateInput(prev));
      setEndDate(formatDateInput(new Date(prev.getFullYear(), prev.getMonth() + 1, 0)));
    } else if (period === "reset") {
      setSelectedTypeFilter("all");
      setSelectedCategoryFilter("all");
      setStartDate("");
      setEndDate("");
    }
  }, []);

  return (
    <Box p={3} className="dashboard-shell">
      <OrgSetupBanner />

      <DashboardHero
        activeFilterLabel={activeFilterLabel}
        availableTypes={availableTypes}
        dashboardSummary={dashboardSummary}
        endDate={endDate}
        exportToCSV={exportToCSV}
        filterOpen={filterOpen}
        handleAskMe={handleAskMe}
        handleExportSummaryPDF={handleExportSummaryPDF}
        handleQuickPeriod={handleQuickPeriod}
        isListening={isListening}
        navigate={navigate}
        selectedCategoryFilter={selectedCategoryFilter}
        selectedMonth={selectedMonth}
        selectedTypeFilter={selectedTypeFilter}
        selectedYear={selectedYear}
        setEndDate={setEndDate}
        setFilterOpen={setFilterOpen}
        setIsPopupOpen={setIsPopupOpen}
        setSelectedCategoryFilter={setSelectedCategoryFilter}
        setSelectedMonth={setSelectedMonth}
        setSelectedTypeFilter={setSelectedTypeFilter}
        setSelectedYear={setSelectedYear}
        setStartDate={setStartDate}
        startDate={startDate}
        supported={supported}
        visibleCategories={visibleCategories}
      />

      <VoiceQueryResults
        setShowVoiceResults={setShowVoiceResults}
        setVoiceError={setVoiceError}
        setVoiceQueryResults={setVoiceQueryResults}
        showVoiceResults={showVoiceResults}
        voiceError={voiceError}
        voiceQueryResults={voiceQueryResults}
      />

      <Box className="dashboard-single-column">
        <KpiSection dashboardSummary={dashboardSummary} previousPeriodSummary={previousPeriodSummary} />
        <CashFlowTimeline cashFlowData={cashFlowData} dashboardSummary={dashboardSummary} />
        <DashboardSetupState
          hasAccounts={hasAccounts}
          hasCategories={hasCategories}
          hasTransactions={hasTransactions}
          loading={dashboardLoading && !hasTransactions}
          navigate={navigate}
        />
        <SmartInsightsPanel insights={smartInsights} />
        <InsightsSection topSpendingCategories={topSpendingCategories} />
        <AnalyticsSection
          activeFilterLabel={activeFilterLabel}
          allMonthsHighestExpenseCategories={allMonthsHighestExpenseCategories}
          dayWiseChartData={dayWiseChartData}
          highestExpenseCategories={highestExpenseCategories}
          monthCategoryData={monthCategoryData}
          monthlyComparisonData={monthlyComparisonData}
          pieChartData={pieChartData}
          yearlyComparisonData={yearlyComparisonData}
        />
        <RecentActivityFeed accounts={accountsWithDerivedCardBalances} categories={categories} navigate={navigate} transactions={recentTransactions} />
        <AiSummaryPanel aiSummaryText={aiSummaryText} />
      </Box>

      <Box className="dashboard-records-grid">
        <TransactionsTable
          accounts={accountsWithDerivedCardBalances}
          categories={categories}
          filteredTableData={filteredTableData}
          page={page}
          paginatedTableData={paginatedTableData}
          rowsPerPage={rowsPerPage}
          search={search}
          setPage={setPage}
          setRowsPerPage={setRowsPerPage}
          setSearch={setSearch}
        />
        <MonthlySummaryTable monthlyComparisonData={monthlyComparisonData} selectedYear={selectedYear} />
      </Box>
      <CategoryDetailsDialog
        categories={categories}
        isPopupOpen={isPopupOpen}
        popupData={popupData}
        popupMonth={popupMonth}
        popupYear={popupYear}
        selectedCategory={selectedCategory}
        setIsPopupOpen={setIsPopupOpen}
        setPopupMonth={setPopupMonth}
        setPopupYear={setPopupYear}
        setSelectedCategory={setSelectedCategory}
      />
    </Box>
  );
}