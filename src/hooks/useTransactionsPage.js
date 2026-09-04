import { getErrorMessage } from "../utils/getErrorMessage";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import { fetchTransactions, createTransaction, deleteTransactionApi } from "../redux/features/transactionSlice";
import { getCategoryAPI } from "../redux/features/categorySlice";
import { getAccountAPI } from "../redux/features/accountSlice";
import { fetchLoans } from "../redux/features/loanSlice";
import { getPeriodBalanceSummary } from "../utils/ledgerBalances";
import { getCreditCardAvailableLimit, getCreditCardOutstanding, isCreditCardAccount, withDerivedCreditCardBalances } from "../utils/creditCardAccounts";

export const formatCurrency = (value) => {
    const amount = Number.parseFloat(value ?? 0);
    return `₹${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
};

export const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour12: true });
};

export const useTransactionsPage = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const quickActionAppliedRef = useRef(false);
    const { transactions } = useSelector((state) => state.transactions);
    const { list: categories } = useSelector((state) => state.category);
    const { list: accounts } = useSelector((state) => state.accounts);
    const loggedInUser = useSelector((state) => state.auth.user);
    const loans = useSelector((state) => state.loans);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        transaction_date: "",
        description: "",
        category: "",
        account: "",
        transfer_to: "",
        repayment_date: "",
        repayment_by: "",
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [deleteCandidateId, setDeleteCandidateId] = useState(null);
    const [selectedTab, setSelectedTab] = useState(0);
    const [calculatorOpen, setCalculatorOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate] = useState("");
    const [endDate] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const handleCalculatorOpen = () => setCalculatorOpen(true);
    const handleCalculatorClose = () => setCalculatorOpen(false);

    const handleCalculatorSubmit = (value) => {
        setFormData((prev) => ({ ...prev, amount: value }));
        handleCalculatorClose();
    };

    const handleSpeechToText = (fieldName) => {
        if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
            setSnackbar({ open: true, message: "Speech recognition not supported in this browser!", severity: "error" });
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onstart = () => { };
        recognition.onend = () => { };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setFormData((prev) => ({ ...prev, [fieldName]: transcript }));
        };
        recognition.onerror = (event) => {
            const errorMessage = event.error === "no-speech"
                ? "No speech detected. Please try again."
                : `Error: ${event.error}`;
            setSnackbar({ open: true, message: errorMessage, severity: "error" });
        };
        recognition.start();
    };

    useEffect(() => {
        dispatch(fetchTransactions({ perPage: 1000 }));
        dispatch(getCategoryAPI());
        dispatch(getAccountAPI());
        dispatch(fetchLoans());
    }, [dispatch]);

    useEffect(() => {
        const quickAction = location.state?.quickAction;
        if (!quickAction || quickActionAppliedRef.current || categories.length === 0) return;

        const preferredCategory = categories.find((category) => category.type?.toLowerCase() === quickAction);
        const primaryAccount = accounts[0];
        const secondaryAccount = accounts.find((account) => String(account.id) !== String(primaryAccount?.id));
        const today = new Date().toISOString().split("T")[0];

        setShowForm(true);
        setFormData((prev) => ({
            ...prev,
            transaction_date: today,
            category: preferredCategory?.id || "",
            account: primaryAccount?.id || "",
            transfer_to: quickAction === "transfer" ? secondaryAccount?.id || "" : "",
            description: quickAction === "income"
                ? "Income"
                : quickAction === "expense"
                    ? "Expense"
                    : "Transfer",
        }));
        quickActionAppliedRef.current = true;
    }, [accounts, categories, location.state]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(0);
    };

    const userTransactions = useMemo(
        () => transactions.filter((t) => t.user_id === loggedInUser?.id),
        [loggedInUser?.id, transactions]
    );

    const accountsWithDerivedCardBalances = useMemo(
        () => withDerivedCreditCardBalances(accounts, userTransactions, categories),
        [accounts, categories, userTransactions]
    );

    const categoryType = categories?.find((cat) => cat?.id === formData.category);
    const isRepaymentCategory = [categoryType?.name, categoryType?.type]
        .some((value) => value?.toLowerCase() === "repayment");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.amount || !formData.transaction_date || !formData.category || !formData.account) {
            setSnackbar({ open: true, message: "Please fill in all required fields!", severity: "error" });
            return;
        }

        const selectedCategory = categories.find((cat) => cat.id === formData.category);
        const isRepayment = [selectedCategory?.name, selectedCategory?.type]
            .some((value) => value?.toLowerCase() === "repayment");

        if (isRepayment && (!formData.description || !formData.repayment_date || !formData.repayment_by)) {
            setSnackbar({ open: true, message: "Please select contribution and fill repayment details!", severity: "error" });
            return;
        }

        const transactionData = {
            amount: formData.amount,
            transaction_date: formData.transaction_date,
            description: formData.description,
            category_id: formData.category,
            account_id: formData.account,
            user_id: loggedInUser?.id,
        };

        if (selectedCategory?.type?.toLowerCase() === "transfer") {
            if (!formData.transfer_to) {
                setSnackbar({ open: true, message: "Please select 'To Account' for transfer!", severity: "error" });
                return;
            }
            transactionData.transfer_to = formData.transfer_to;
        }

        if (isRepayment) {
            transactionData.repayment_date = formData.repayment_date;
            transactionData.repayment_by = formData.repayment_by;
        }

        try {
            await dispatch(createTransaction(transactionData)).unwrap();
            setSnackbar({ open: true, message: "Transaction added successfully!", severity: "success" });
            setShowForm(false);
            setFormData({ amount: "", transaction_date: "", description: "", category: "", account: "", transfer_to: "", repayment_date: "", repayment_by: "" });
            dispatch(getAccountAPI());
            dispatch(fetchTransactions({ perPage: 1000 }));
        } catch (err) {
            const errorMessage = getErrorMessage(err, "Failed to add transaction!");
            setSnackbar({ open: true, message: errorMessage, severity: "error" });
        }
    };

    const handleDelete = async (id) => {
        try {
            await dispatch(deleteTransactionApi(id)).unwrap();
            setSnackbar({ open: true, message: "Transaction deleted successfully!", severity: "success" });
            setDeleteCandidateId(null);
            dispatch(getAccountAPI());
        } catch (err) {
            setSnackbar({ open: true, message: getErrorMessage(err, "Failed to delete transaction!"), severity: "error" });
        }
    };

    const requestDeleteConfirmation = (id) => setDeleteCandidateId(id);
    const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));
    const handleDeleteDialogClose = () => setDeleteCandidateId(null);

    // ✅ Month-wise Income / Expense / Reimbursement summary
    // Account balance hamesha running/cumulative total hota hai (backend isko sahi se update karta hai),
    // isliye balance ko "is mahine ka net" samajhna galat hai. Yahan sirf current month ke
    // transactions ko unke category "type" ke hisaab se sahi bucket mein daala ja raha hai:
    //   - income          -> real paisa aaya          -> Income
    //   - Expense         -> real paisa gaya           -> Expense
    //   - reimbursement   -> pehle ka expense wapas mila -> Expense ko reverse/offset karta hai (income nahi)
    //   - saving          -> khud ke paas bacha paisa, kahi gaya nahi -> ignore
    //   - transfer        -> apna hi paisa ek account se doosre mein -> ignore
    //   - borrow          -> liability (udhaar liya)    -> ignore
    //   - borrow_return   -> liability clear ho rahi     -> ignore
    //   - contribution    -> diya, baad mein wapas aayega -> ignore
    //   - repayment       -> contribution ka return       -> ignore
    const monthlyStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthStart = new Date(currentYear, currentMonth, 1);
        const thisMonthTxns = userTransactions.filter((t) => {
            const d = new Date(t.transaction_date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const summarizeProfitLossTxns = (items) => {
            let income = 0;
            let expense = 0;
            let reimbursed = 0;

            items.forEach((t) => {
                const category = t.category || categories.find((c) => c.id === t.category_id);
                const type = category?.type?.toLowerCase();
                const amt = Math.abs(parseFloat(t.amount)) || 0;

                if (type === "income") {
                    income += amt;
                } else if (type === "expense") {
                    expense += amt;
                } else if (type === "reimbursement") {
                    reimbursed += amt; // expense ko reverse/offset karega, naya income nahi
                }
                // saving, transfer, borrow, borrow_return, repayment, contribution -> income/expense pe koi effect nahi
            });

            const netExpense = expense - reimbursed;
            return { income, expense, reimbursed, netExpense, net: income - netExpense };
        };

        const current = summarizeProfitLossTxns(thisMonthTxns);
        const liquidAccounts = accountsWithDerivedCardBalances.filter((account) => !isCreditCardAccount(account));
        const creditCards = accountsWithDerivedCardBalances.filter(isCreditCardAccount);
        const balanceSummary = getPeriodBalanceSummary({
            accounts: liquidAccounts,
            transactions: userTransactions,
            categories,
            periodStart: monthStart,
            periodEnd: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59),
        });

        return {
            ...current,
            openingBalance: balanceSummary.openingBalance,
            closingBalance: balanceSummary.closingBalance,
            availableBalance: balanceSummary.currentBalance,
            periodNet: balanceSummary.periodNet,
            creditCardOutstanding: creditCards.reduce((sum, account) => sum + getCreditCardOutstanding(account), 0),
            creditCardAvailableLimit: creditCards.reduce((sum, account) => sum + getCreditCardAvailableLimit(account), 0),
        };
    }, [accountsWithDerivedCardBalances, categories, userTransactions]);

    const filteredTransactions = useMemo(() => {
        const searchLower = searchQuery.toLowerCase();
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        return userTransactions.filter((transaction) => {
            const transactionDate = new Date(transaction.transaction_date);
            const isWithinDateRange = (!start || transactionDate >= start) && (!end || transactionDate <= end);
            const category = transaction.category || categories.find((cat) => cat.id === transaction.category_id);
            return (
                isWithinDateRange &&
                (category?.name?.toLowerCase().includes(searchLower) ||
                    transaction.description?.toLowerCase().includes(searchLower) ||
                    transaction.amount?.toString().includes(searchLower) ||
                    formatDateTime(transaction.transaction_date).toLowerCase().includes(searchLower))
            );
        });
    }, [categories, endDate, searchQuery, startDate, userTransactions]);

    const paginatedTransactions = useMemo(
        () => filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filteredTransactions, page, rowsPerPage]
    );

    const contributionRepaymentRows = useMemo(() => {
        const contributionTransactions = filteredTransactions.filter((t) => {
            const category = t.category || categories.find((cat) => cat.id === t.category_id);
            return [category?.name, category?.type].some((v) => v?.toLowerCase() === "contribution");
        });
        const repaymentTransactions = filteredTransactions.filter((t) => {
            const category = t.category || categories.find((cat) => cat.id === t.category_id);
            return [category?.name, category?.type].some((v) => v?.toLowerCase() === "repayment");
        });

        return contributionTransactions.map((transaction) => {
            const category = transaction.category || categories.find((cat) => cat.id === transaction.category_id);
            const account = transaction.account || accounts.find((acc) => acc.id === transaction.account_id);
            const linkedRepayments = repaymentTransactions.filter((r) => r.description === transaction.description);
            return {
                id: transaction.id,
                contribution_date: transaction.transaction_date,
                contribution_category: category?.name || "N/A",
                contribution_account: account?.account_name || "N/A",
                contribution_amount: transaction.amount,
                description: transaction.description || "N/A",
                repayment_dates: linkedRepayments.length > 0
                    ? linkedRepayments.map((r) => r.repayment_date || r.transaction_date || "N/A").join(", ")
                    : "N/A",
                repayment_by: linkedRepayments.length > 0
                    ? linkedRepayments.map((r) => r.repayment_by || "N/A").join(", ")
                    : "N/A",
            };
        });
    }, [accounts, categories, filteredTransactions]);

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };

    const handleDownloadContributionReport = async () => {
        if (contributionRepaymentRows.length === 0) {
            setSnackbar({ open: true, message: "No contribution report data found!", severity: "info" });
            return;
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "ApnaKharch";
        const worksheet = workbook.addWorksheet("Contribution Report");

        worksheet.columns = [
            { header: "Date", key: "date", width: 22 },
            { header: "Category", key: "category", width: 16 },
            { header: "Account", key: "account", width: 16 },
            { header: "Amount", key: "amount", width: 14 },
            { header: "Description", key: "description", width: 28 },
            { header: "Payment Date", key: "repayment_dates", width: 22 },
            { header: "Payment By", key: "repayment_by", width: 18 },
            { header: "Status", key: "status", width: 12 },
        ];

        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
            cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 12, name: "Calibri" };
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.border = {
                top: { style: "thin", color: { argb: "FF1E3A8A" } },
                bottom: { style: "thin", color: { argb: "FF1E3A8A" } },
                left: { style: "thin", color: { argb: "FF1E3A8A" } },
                right: { style: "thin", color: { argb: "FF1E3A8A" } },
            };
        });
        headerRow.height = 22;

        contributionRepaymentRows.forEach((row, index) => {
            const isRepaid = row.repayment_dates !== "N/A";

            const dataRow = worksheet.addRow({
                date: formatDateTime(row.contribution_date),
                category: row.contribution_category,
                account: row.contribution_account,
                amount: row.contribution_amount,
                description: row.description,
                repayment_dates: row.repayment_dates,
                repayment_by: row.repayment_by,
                status: isRepaid ? "Repaid" : "Pending",
            });
            dataRow.height = 18;

            const cellBg = isRepaid ? "FFFECACA" : index % 2 === 0 ? "FFDBEAFE" : "FFFEF3C7";
            const cellFont = isRepaid ? "FF7F1D1D" : index % 2 === 0 ? "FF1E3A8A" : "FF92400E";
            const statusBg = isRepaid ? "FFB91C1C" : "FF15803D";

            dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const isStatusCol = colNumber === 8;
                const isRepaymentInfoCol = colNumber === 6 || colNumber === 7;
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: isStatusCol ? statusBg : cellBg },
                };
                cell.font = {
                    name: "Calibri",
                    size: 11,
                    color: { argb: isStatusCol ? "FFFFFFFF" : isRepaymentInfoCol ? "FF7F1D1D" : cellFont },
                    bold: isStatusCol || (isRepaid && !isRepaymentInfoCol),
                    strike: !isStatusCol && !isRepaymentInfoCol && isRepaid,
                };
                cell.alignment = { vertical: "middle", horizontal: isStatusCol ? "center" : "left" };
                cell.border = {
                    top: { style: "thin", color: { argb: "FFCBD5E1" } },
                    bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
                    left: { style: "thin", color: { argb: "FFCBD5E1" } },
                    right: { style: "thin", color: { argb: "FFCBD5E1" } },
                };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
            new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
            `contribution_repayment_report_${new Date().toISOString().split("T")[0]}.xlsx`
        );
        setSnackbar({ open: true, message: "Contribution report downloaded successfully!", severity: "success" });
    };

    const contributionOptions = useMemo(() => {
        const descriptionMap = new Map();
        userTransactions.forEach((transaction) => {
            const isContribution = [transaction.category?.name, transaction.category?.type]
                .some((value) => value?.toLowerCase() === "contribution");
            if (isContribution && transaction.description) {
                descriptionMap.set(transaction.description, { description: transaction.description, amount: transaction.amount ?? "" });
            }
        });
        return Array.from(descriptionMap.values());
    }, [userTransactions]);

    return {
        categories,
        accounts: accountsWithDerivedCardBalances,
        loggedInUser,
        loans,
        showForm,
        setShowForm,
        formData,
        setFormData,
        handleChange,
        handleSubmit,
        categoryType,
        isRepaymentCategory,
        contributionOptions,
        calculatorOpen,
        handleCalculatorOpen,
        handleCalculatorClose,
        handleCalculatorSubmit,
        handleSpeechToText,
        snackbar,
        handleSnackbarClose,
        deleteCandidateId,
        requestDeleteConfirmation,
        handleDeleteDialogClose,
        handleDelete,
        selectedTab,
        setSelectedTab,
        searchQuery,
        handleSearchChange,
        filteredTransactions,
        paginatedTransactions,
        page,
        rowsPerPage,
        handleChangePage,
        handleChangeRowsPerPage,
        monthlyStats,
        handleDownloadContributionReport,
    };
};
