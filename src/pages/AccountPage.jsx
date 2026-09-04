import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getErrorMessage } from "../utils/getErrorMessage";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    createAccountAPI,
    getAccountAPI,
    updateAccountAPI,
    deleteAccountAPI
} from "../redux/features/accountSlice";
import { fetchTransactions } from "../redux/features/transactionSlice";
import { getCategoryAPI } from "../redux/features/categorySlice";
import { getCompanies } from "../redux/features/companySlice";
import {
    Container, Typography, Table, TableHead, TableRow, TableCell,
    TableBody, TableFooter, CircularProgress, Alert, Paper, TableContainer,
    TextField, Button, Grid, Snackbar, IconButton, Box,
    TablePagination, Select, MenuItem
} from "@mui/material";
import { Edit, Delete, Download } from "@mui/icons-material";
import { ConfirmDialog, DataTable, FormSection, PageHeader, SearchFilterBar } from "../components/common";
import { getCreditCardAvailableLimit, getCreditCardOutstanding, isCreditCardAccount, withDerivedCreditCardBalances } from "../utils/creditCardAccounts";
import "./AccountPage.css";

const formatCurrency = (value) => {
    const amount = Number.parseFloat(value ?? 0);
    return `₹${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// ✅ "YYYY-MM" key nikaalne ke liye — filter aur dropdown grouping dono ke liye use hota hai
const getMonthKey = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const MONTH_LABELS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split("-");
    return `${MONTH_LABELS[Number(month) - 1]} ${year}`;
};

const getLastPage = (rowCount, rowsPerPage) => Math.max(0, Math.ceil(rowCount / rowsPerPage) - 1);

const sanitizeFilePart = (value) => String(value || "all")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "all";

const getLedgerPeriodLabel = ({ dateRangeActive, ledgerFromDate, ledgerToDate, ledgerMonthFilter }) => {
    if (dateRangeActive) {
        return (ledgerFromDate || "Start") + " to " + (ledgerToDate || "Today");
    }

    if (ledgerMonthFilter !== "all") {
        return formatMonthLabel(ledgerMonthFilter);
    }

    return "All Periods";
};

const getLedgerPeriodStart = ({ dateRangeActive, ledgerFromDate, ledgerMonthFilter }) => {
    if (dateRangeActive) {
        if (!ledgerFromDate) return null;
        return new Date(ledgerFromDate + "T00:00:00");
    }

    if (ledgerMonthFilter !== "all") {
        const [year, month] = ledgerMonthFilter.split("-").map(Number);
        return new Date(year, month - 1, 1);
    }

    return null;
};

const createOpeningBalanceRow = ({ ledgerRows, accounts, ledgerAccountFilter, periodStartDate }) => {
    if (!periodStartDate || Number.isNaN(periodStartDate.getTime())) return null;

    const selectedAccounts = ledgerAccountFilter === "all"
        ? accounts
        : accounts.filter((account) => String(account.id) === String(ledgerAccountFilter));

    if (selectedAccounts.length === 0) return null;

    const openingBalance = selectedAccounts.reduce((sum, account) => {
        const accountRows = ledgerRows
            .filter((row) => row.accountId === String(account.id))
            .sort((a, b) => {
                const dateDiff = new Date(a.sortDate || 0) - new Date(b.sortDate || 0);
                if (dateDiff !== 0) return dateDiff;
                return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
            });

        const previousRow = [...accountRows]
            .reverse()
            .find((row) => new Date(row.sortDate || row.transactionDate || 0) < periodStartDate);

        if (previousRow) return sum + previousRow.closingBalance;

        const firstPeriodOrFutureRow = accountRows.find((row) => new Date(row.sortDate || row.transactionDate || 0) >= periodStartDate);
        if (firstPeriodOrFutureRow) {
            return sum + firstPeriodOrFutureRow.closingBalance - firstPeriodOrFutureRow.credit + firstPeriodOrFutureRow.debit;
        }

        return sum + (Number(account.account_balance) || 0);
    }, 0);

    return {
        id: "opening-balance-" + ledgerAccountFilter + "-" + periodStartDate.toISOString(),
        isOpeningBalance: true,
        transactionDate: periodStartDate.toISOString(),
        sortDate: periodStartDate.toISOString(),
        accountId: ledgerAccountFilter === "all" ? "all" : String(ledgerAccountFilter),
        accountName: ledgerAccountFilter === "all" ? "All Accounts" : selectedAccounts[0]?.account_name || "Account",
        categoryName: "Opening Balance",
        description: "Balance brought forward",
        credit: 0,
        debit: 0,
        closingBalance: openingBalance,
    };
};

const loadImageAsDataUrl = async (imageUrl) => {
    if (!imageUrl) return null;

    try {
        const response = await fetch(imageUrl, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "image/*" },
        });

        if (!response.ok) return null;

        const blob = await response.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
};

const createFadedLogoDataUrl = async (imageDataUrl, opacity = 0.12) => {
    if (!imageDataUrl) return null;

    return await new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement("canvas");
            const maxWidth = 520;
            const scale = Math.min(1, maxWidth / image.width);
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));

            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = opacity;
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/png"));
        };
        image.onerror = () => resolve(null);
        image.src = imageDataUrl;
    });
};

const getTransactionType = (transaction, categories) => {
    const category = transaction.category || categories.find((cat) => cat.id === transaction.category_id);
    return category?.type?.toLowerCase() || "";
};

// ✅ Backend TransactionService::createTransaction() ke switch-case ke EXACT hisaab se:
//    - income, borrow, reimbursement          -> account_balance ADD hota hai (credit)
//    - expense, saving, borrow_return, repayment -> account_balance SUBTRACT hota hai (debit)
//    - transfer                                -> from-account debit, to-account credit
//    - contribution, special, koi aur type     -> balance ko touch hi nahi karta (backend "default" case)
// Frontend ledger ko bilkul isi rule se banna chahiye, warna ledger ka total account_balance se match nahi karega.
const CREDIT_TYPES = ["income", "borrow", "reimbursement"];
const DEBIT_TYPES = ["expense", "saving", "borrow_return", "repayment"];

const createLedgerEntries = (transactions, accounts, categories) => {
    const accountById = new Map(accounts.map((account) => [String(account.id), account]));
    const sortedTransactions = [...transactions].sort((a, b) => {
        const dateDiff = new Date(a.transaction_date || a.created_at || 0) - new Date(b.transaction_date || b.created_at || 0);
        if (dateDiff !== 0) return dateDiff;
        return (a.id || 0) - (b.id || 0);
    });

    const rowsByAccount = new Map(accounts.map((account) => [String(account.id), []]));
    const netImpactByAccount = new Map(accounts.map((account) => [String(account.id), 0]));

    const addEntry = (transaction, accountId, direction) => {
        const accountKey = String(accountId || "");
        if (!accountById.has(accountKey)) return;

        const amount = Math.abs(Number(transaction.amount)) || 0;
        if (!amount) return;

        const credit = direction === "credit" ? amount : 0;
        const debit = direction === "debit" ? amount : 0;
        const category = transaction.category || categories.find((cat) => cat.id === transaction.category_id);
        const account = accountById.get(accountKey);

        rowsByAccount.get(accountKey).push({
            id: `${transaction.id}-${accountKey}-${direction}`,
            transactionDate: transaction.transaction_date,
            sortDate: transaction.transaction_date || transaction.created_at,
            monthKey: getMonthKey(transaction.transaction_date),
            accountId: accountKey,
            accountName: account.account_name,
            categoryName: category?.name || "N/A",
            description: transaction.description || "N/A",
            credit,
            debit,
            closingBalance: 0, // niche running-balance pass mein sahi value se overwrite hota hai
        });
        netImpactByAccount.set(accountKey, (netImpactByAccount.get(accountKey) || 0) + credit - debit);
    };

    sortedTransactions.forEach((transaction) => {
        const type = getTransactionType(transaction, categories);

        if (type === "transfer") {
            // backend jaisa: from-account se debit, to-account mein credit
            addEntry(transaction, transaction.account_id, "debit");
            addEntry(transaction, transaction.transfer_to, "credit");
            return;
        }

        if (CREDIT_TYPES.includes(type)) {
            addEntry(transaction, transaction.account_id, "credit");
        } else if (DEBIT_TYPES.includes(type)) {
            addEntry(transaction, transaction.account_id, "debit");
        }
        // baaki types (contribution, special, etc.) — backend "default" case, balance change nahi hota,
        // isliye inki ledger entry bhi nahi banti
    });

    // ✅ Har account ka apna running balance nikaalo taaki last row hamesha
    // account ke asli current `account_balance` (DB column) pe match kare.
    // Opening balance ko back-calculate karte hain: current balance − is account
    // ki saari ledger entries ka net impact.
    const accountTotals = accounts.map((account) => {
        const accountKey = String(account.id);
        const rows = rowsByAccount.get(accountKey) || [];
        const closingBalance = Number(account.account_balance) || 0;
        const netImpact = netImpactByAccount.get(accountKey) || 0;

        let runningBalance = closingBalance - netImpact; // back-calculated opening balance
        rows.forEach((row) => {
            runningBalance += row.credit - row.debit;
            row.closingBalance = runningBalance;
        });

        const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0);
        const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0);

        return {
            id: account.id,
            accountName: account.account_name,
            totalCredit,
            totalDebit,
            closingBalance,
        };
    });

    const ledgerRows = Array.from(rowsByAccount.values())
        .flat()
        .sort((a, b) => {
            const dateDiff = new Date(b.sortDate || 0) - new Date(a.sortDate || 0);
            if (dateDiff !== 0) return dateDiff;
            return String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
        });

    return { accountTotals, ledgerRows };
};

const AccountPage = () => {
    const dispatch = useDispatch();
    const [accountName, setAccountName] = useState("");
    const [accountBalance, setAccountBalance] = useState(0);
    const [accountType, setAccountType] = useState("cash");
    const [creditLimit, setCreditLimit] = useState("");
    const [billingCycleDay, setBillingCycleDay] = useState("");
    const [paymentDueDay, setPaymentDueDay] = useState("");
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [deleteCandidateId, setDeleteCandidateId] = useState(null);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    // ✅ Accounts table pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // ✅ Ledger table pagination + filters
    const [ledgerPage, setLedgerPage] = useState(0);
    const [ledgerRowsPerPage, setLedgerRowsPerPage] = useState(10);
    const [ledgerAccountFilter, setLedgerAccountFilter] = useState("all"); // ✅ ledger ko account-wise dekhne ke liye
    const [ledgerMonthFilter, setLedgerMonthFilter] = useState("all"); // ✅ ledger ko month-year wise dekhne ke liye ("YYYY-MM")
    const [ledgerFromDate, setLedgerFromDate] = useState(""); // ✅ custom date range filter — from ("YYYY-MM-DD")
    const [ledgerToDate, setLedgerToDate] = useState(""); // ✅ custom date range filter — to ("YYYY-MM-DD")

    const { list: accounts, loading, error } = useSelector((state) => state.accounts);
    const { transactions } = useSelector((state) => state.transactions);
    const { list: categories } = useSelector((state) => state.category);
    const companyList = useSelector((state) => state.companies?.companies || []);
    const organisation = useSelector((state) => state.orgs?.organisation);
    const loggedInUser = useSelector((state) => state.auth.user);

    useEffect(() => {
        dispatch(getAccountAPI());
        dispatch(fetchTransactions({ perPage: 1000 }));
        dispatch(getCategoryAPI());
        dispatch(getCompanies());
    }, [dispatch]);

    const userTransactions = useMemo(
        () => transactions.filter((transaction) => !loggedInUser?.id || transaction.user_id === loggedInUser.id),
        [loggedInUser?.id, transactions]
    );

    const accountsWithDerivedCardBalances = useMemo(
        () => withDerivedCreditCardBalances(accounts || [], userTransactions, categories || []),
        [accounts, categories, userTransactions]
    );

    const { accountTotals, ledgerRows } = useMemo(
        () => createLedgerEntries(userTransactions, accountsWithDerivedCardBalances, categories || []),
        [accountsWithDerivedCardBalances, categories, userTransactions]
    );
    useEffect(() => {
        setPage((currentPage) => Math.min(currentPage, getLastPage(accountsWithDerivedCardBalances?.length || 0, rowsPerPage)));
    }, [accountsWithDerivedCardBalances?.length, rowsPerPage]);


    // ✅ Ledger mein maujood saare distinct months (naye se purane order mein) — dropdown banane ke liye
    const availableMonths = useMemo(() => {
        const monthSet = new Set(ledgerRows.map((row) => row.monthKey).filter(Boolean));
        return Array.from(monthSet).sort((a, b) => (a < b ? 1 : -1));
    }, [ledgerRows]);

    // ✅ Jab bhi from/to date mein se koi ek bhi bhara ho, custom date-range mode active ho jaata hai
    // aur month dropdown us waqt ke liye ignore ho jaata hai (dono ek saath clash na karein isliye)
    const dateRangeActive = Boolean(ledgerFromDate || ledgerToDate);

    // ✅ Account filter + month filter + date-range filter — sab ek saath apply, asli ledger-book jaisa
    const filteredLedgerRows = useMemo(() => {
        return ledgerRows.filter((row) => {
            const accountMatch = ledgerAccountFilter === "all" || row.accountId === String(ledgerAccountFilter);
            const monthMatch = dateRangeActive || ledgerMonthFilter === "all" || row.monthKey === ledgerMonthFilter;

            const rowDate = row.transactionDate ? new Date(row.transactionDate) : null;
            const fromMatch = !ledgerFromDate || (rowDate && rowDate >= new Date(ledgerFromDate));
            const toMatch = !ledgerToDate || (rowDate && rowDate <= new Date(`${ledgerToDate}T23:59:59`));

            return accountMatch && monthMatch && fromMatch && toMatch;
        });
    }, [ledgerAccountFilter, ledgerMonthFilter, ledgerFromDate, ledgerToDate, dateRangeActive, ledgerRows]);

    // ✅ Current filter (account + month/date-range) ke hisaab se ledger ka total credit/debit
    // NOTE: yeh useMemo component ke ANDAR hona chahiye (filteredLedgerRows ke baad),
    // bahar rakhne se "filteredLedgerRows is not defined" / invalid hook call error aata hai.
    const filteredLedgerTotals = useMemo(() => ({
        totalCredit: filteredLedgerRows.reduce((sum, row) => sum + row.credit, 0),
        totalDebit: filteredLedgerRows.reduce((sum, row) => sum + row.debit, 0),
    }), [filteredLedgerRows]);

    const ledgerPeriodStart = useMemo(
        () => getLedgerPeriodStart({ dateRangeActive, ledgerFromDate, ledgerMonthFilter }),
        [dateRangeActive, ledgerFromDate, ledgerMonthFilter]
    );

    const openingBalanceRow = useMemo(
        () => createOpeningBalanceRow({
            ledgerRows,
            accounts: accountsWithDerivedCardBalances || [],
            ledgerAccountFilter,
            periodStartDate: ledgerPeriodStart,
        }),
        [accountsWithDerivedCardBalances, ledgerAccountFilter, ledgerPeriodStart, ledgerRows]
    );

    const displayedLedgerRows = useMemo(
        () => openingBalanceRow ? [openingBalanceRow, ...filteredLedgerRows] : filteredLedgerRows,
        [filteredLedgerRows, openingBalanceRow]
    );

    const filteredLedgerClosingBalance = useMemo(() => {
        if (openingBalanceRow) {
            return openingBalanceRow.closingBalance + filteredLedgerTotals.totalCredit - filteredLedgerTotals.totalDebit;
        }

        const latestRow = filteredLedgerRows[0];
        return latestRow ? latestRow.closingBalance : 0;
    }, [filteredLedgerRows, filteredLedgerTotals, openingBalanceRow]);

    // ✅ Koi bhi filter badalne par ledger pagination reset (warna out-of-range blank page dikh sakta hai)
    useEffect(() => {
        setLedgerPage(0);
    }, [ledgerAccountFilter, ledgerMonthFilter, ledgerFromDate, ledgerToDate]);

    useEffect(() => {
        setLedgerPage((currentPage) => Math.min(currentPage, getLastPage(displayedLedgerRows.length, ledgerRowsPerPage)));
    }, [displayedLedgerRows.length, ledgerRowsPerPage]);

    const accountOverview = useMemo(() => ({
        totalCredit: accountTotals.reduce((sum, account) => sum + account.totalCredit, 0),
        totalDebit: accountTotals.reduce((sum, account) => sum + account.totalDebit, 0),
        closingBalance: accountTotals.reduce((sum, account) => sum + account.closingBalance, 0),
    }), [accountTotals]);

    const handleAddOrUpdateAccount = async (e) => {
        e.preventDefault();

        if (!accountName.trim()) {
            showSnackbar("Account name is required!", "error");
            return;
        }

        if (accountType !== "credit_card" && accountBalance < 0) {
            showSnackbar("Account balance cannot be negative!", "error");
            return;
        }

        if (accountType === "credit_card" && (!creditLimit || Number(creditLimit) <= 0)) {
            showSnackbar("Credit limit is required for credit card accounts!", "error");
            return;
        }

        try {
            let message = "";

            const accountPayload = {
                account_name: accountName,
                account_type: accountType,
                account_balance: accountType === "credit_card" ? -Math.abs(Number(accountBalance) || 0) : accountBalance,
                credit_limit: accountType === "credit_card" ? Number(creditLimit) : null,
                billing_cycle_day: accountType === "credit_card" && billingCycleDay ? Number(billingCycleDay) : null,
                payment_due_day: accountType === "credit_card" && paymentDueDay ? Number(paymentDueDay) : null,
            };

            if (editId) {
                await dispatch(updateAccountAPI({ id: editId, ...accountPayload })).unwrap();
                message = "Account updated successfully!";
            } else {
                await dispatch(createAccountAPI(accountPayload)).unwrap();
                message = "Account added successfully!";
            }

            showSnackbar(message, "success");
            resetForm();
            dispatch(getAccountAPI());
        } catch (error) {
            showDynamicErrors(error);
        }
    };

    const handleEdit = (account) => {
        setAccountName(account.account_name);
        setAccountType(account.account_type || "cash");
        setAccountBalance(isCreditCardAccount(account) ? getCreditCardOutstanding(account) : account.account_balance);
        setCreditLimit(account.credit_limit ?? "");
        setBillingCycleDay(account.billing_cycle_day ?? "");
        setPaymentDueDay(account.payment_due_day ?? "");
        setEditId(account.id);
        setShowForm(true);
    };

    const requestDelete = (id) => {
        setDeleteCandidateId(id);
    };

    const handleDelete = async () => {
        if (!deleteCandidateId) return;

        try {
            await dispatch(deleteAccountAPI(deleteCandidateId)).unwrap();
            showSnackbar("Account deleted successfully!", "success");
            setDeleteCandidateId(null);
            dispatch(getAccountAPI());
        } catch (error) {
            showDynamicErrors(error);
        }
    };

    const resetForm = () => {
        setAccountName("");
        setAccountBalance(0);
        setAccountType("cash");
        setCreditLimit("");
        setBillingCycleDay("");
        setPaymentDueDay("");
        setEditId(null);
        setShowForm(false);
    };

    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const showDynamicErrors = (error) => {
        if (Array.isArray(error)) {
            error.forEach(errMsg => showSnackbar(errMsg, "error"));
        } else {
            showSnackbar(getErrorMessage(error, "An unknown error occurred!"), "error");
        }
    };

    const handleDownloadLedgerStatement = async () => {
        if (displayedLedgerRows.length === 0) {
            showSnackbar("No ledger data found for selected filters!", "info");
            return;
        }

        const selectedAccount = ledgerAccountFilter === "all"
            ? null
            : accountsWithDerivedCardBalances.find((account) => String(account.id) === String(ledgerAccountFilter));
        const accountLabel = selectedAccount?.account_name || "All Accounts";
        const periodLabel = getLedgerPeriodLabel({ dateRangeActive, ledgerFromDate, ledgerToDate, ledgerMonthFilter });
        const logoUrl = companyList[0]?.logo_url || organisation?.logo || "";
        const logoDataUrl = await loadImageAsDataUrl(logoUrl);
        const watermarkDataUrl = await createFadedLogoDataUrl(logoDataUrl);
        const statementRows = [...displayedLedgerRows].sort((a, b) => {
            if (a.isOpeningBalance) return -1;
            if (b.isOpeningBalance) return 1;
            const dateDiff = new Date(a.sortDate || 0) - new Date(b.sortDate || 0);
            if (dateDiff !== 0) return dateDiff;
            return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
        });
        const openingBalance = openingBalanceRow
            ? openingBalanceRow.closingBalance
            : statementRows[0].closingBalance - statementRows[0].credit + statementRows[0].debit;
        const closingBalance = filteredLedgerClosingBalance;

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "ApnaKharch";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet("Ledger Statement", {
            views: [{ state: "frozen", ySplit: 6 }],
        });

        worksheet.columns = [
            { header: "Date", key: "date", width: 16 },
            { header: "Particulars", key: "particulars", width: 34 },
            { header: "Category", key: "category", width: 20 },
            { header: "Credit", key: "credit", width: 16 },
            { header: "Debit", key: "debit", width: 16 },
            { header: "Balance", key: "balance", width: 18 },
        ];

        worksheet.spliceRows(1, 1);
        worksheet.addRow(["Account Ledger Statement"]);
        worksheet.addRow(["Account", accountLabel, "", "Period", periodLabel]);
        worksheet.addRow(["Opening Balance", openingBalance, "", "Closing Balance", closingBalance]);
        worksheet.addRow(["Total Credit", filteredLedgerTotals.totalCredit, "", "Total Debit", filteredLedgerTotals.totalDebit]);
        worksheet.addRow([]);
        worksheet.addRow(["Date", "Particulars", "Category", "Credit", "Debit", "Balance"]);

        if (watermarkDataUrl) {
            const watermarkImageId = workbook.addImage({
                base64: watermarkDataUrl,
                extension: "png",
            });
            worksheet.addImage(watermarkImageId, {
                tl: { col: 1.1, row: 8 },
                ext: { width: 420, height: 160 },
                editAs: "oneCell",
            });
        }

        worksheet.mergeCells("A1:F1");
        worksheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
        worksheet.getCell("A1").alignment = { horizontal: "center" };
        worksheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };

        [2, 3, 4].forEach((rowNumber) => {
            const row = worksheet.getRow(rowNumber);
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.font = { bold: true, color: { argb: "FF0F172A" } };
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
                cell.border = { bottom: { style: "thin", color: { argb: "FFCBD5E1" } } };
            });
        });

        const headerRow = worksheet.getRow(6);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
            cell.alignment = { horizontal: "center" };
            cell.border = {
                top: { style: "thin", color: { argb: "FF334155" } },
                bottom: { style: "thin", color: { argb: "FF334155" } },
                left: { style: "thin", color: { argb: "FF334155" } },
                right: { style: "thin", color: { argb: "FF334155" } },
            };
        });

        statementRows.forEach((row, index) => {
            const dataRow = worksheet.addRow({
                date: formatDate(row.transactionDate),
                particulars: row.description,
                category: row.categoryName,
                credit: row.credit || null,
                debit: row.debit || null,
                balance: row.closingBalance,
            });

            dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: index % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC" } };
                cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
                cell.alignment = { vertical: "middle", horizontal: colNumber >= 4 ? "right" : "left" };
                if (colNumber >= 4) cell.numFmt = "₹#,##0.00;[Red]-₹#,##0.00";
            });
        });

        ["B3", "E3", "B4", "E4"].forEach((cellRef) => {
            worksheet.getCell(cellRef).numFmt = "₹#,##0.00;[Red]-₹#,##0.00";
        });

        worksheet.addRow([]);
        const footerRow = worksheet.addRow(["Generated On", new Date().toLocaleString("en-IN"), "", "Rows", statementRows.length]);
        footerRow.font = { italic: true, color: { argb: "FF475569" } };

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
            new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
            "ledger_statement_" + sanitizeFilePart(accountLabel) + "_" + sanitizeFilePart(periodLabel) + ".xlsx"
        );
        showSnackbar("Ledger statement downloaded successfully!", "success");
    };

    return (
        <Container className="page-shell">
            <PageHeader
                title="Accounts"
                subtitle="Manage cash, bank and ledger balances in one place."
                actions={[
                    {
                        label: showForm ? "Cancel" : "Add Account",
                        onClick: () => setShowForm(!showForm),
                    },
                ]}
            />

            {showForm && (
                <FormSection
                    title={editId ? "Edit Account" : "Add New Account"}
                    sx={{ mb: 3 }}
                >
                    <form onSubmit={handleAddOrUpdateAccount}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth label="Account Name" variant="outlined" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Select fullWidth value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                                    <MenuItem value="cash">Cash</MenuItem>
                                    <MenuItem value="bank">Bank</MenuItem>
                                    <MenuItem value="credit_card">Credit Card</MenuItem>
                                </Select>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={accountType === "credit_card" ? "Opening Outstanding" : "Account Balance"}
                                    type="number"
                                    variant="outlined"
                                    value={accountBalance}
                                    onChange={(e) => setAccountBalance(Number(e.target.value))}
                                />
                            </Grid>
                            {accountType === "credit_card" && (
                                <>
                                    <Grid item xs={12} md={6}>
                                        <TextField fullWidth required label="Credit Limit" type="number" variant="outlined" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField fullWidth label="Billing Cycle Day" type="number" inputProps={{ min: 1, max: 31 }} variant="outlined" value={billingCycleDay} onChange={(e) => setBillingCycleDay(e.target.value)} />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField fullWidth label="Payment Due Day" type="number" inputProps={{ min: 1, max: 31 }} variant="outlined" value={paymentDueDay} onChange={(e) => setPaymentDueDay(e.target.value)} />
                                    </Grid>
                                </>
                            )}
                            <Grid item xs={12}>
                                <Button variant="contained" color="primary" type="submit">
                                    {editId ? "Update Account" : "Add Account"}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </FormSection>
            )}

            {loading ? (
                <CircularProgress />
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : accountsWithDerivedCardBalances?.length === 0 ? (
                <Alert severity="info">No accounts found.</Alert>
            ) : (
                <>
                    <Box className="account-page__overview-grid">
                        {/* <Paper elevation={0} className="account-page__overview-card account-page__overview-card--credit">
                            <Typography variant="caption">Total Credit</Typography>
                            <Typography variant="h5">{formatCurrency(accountOverview.totalCredit)}</Typography>
                        </Paper>
                        <Paper elevation={0} className="account-page__overview-card account-page__overview-card--debit">
                            <Typography variant="caption">Total Debit</Typography>
                            <Typography variant="h5">{formatCurrency(accountOverview.totalDebit)}</Typography>
                        </Paper> */}
                        {/* <Paper elevation={0} className="account-page__overview-card account-page__overview-card--balance">
                            <Typography variant="caption">Current Balance</Typography>
                            <Typography variant="h5">{formatCurrency(accountOverview.closingBalance)}</Typography>
                        </Paper> */}
                    </Box>

                    <FormSection
                        title="Accounts"
                        description="Credit, debit and current balance by account"
                        sx={{ mb: 3 }}
                    >
                        <DataTable
                            dense
                            rows={accountsWithDerivedCardBalances.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
                            getRowId={(row, index) => row?.id || index}
                            columns={[
                                { field: "account_name", headerName: "Account Name", fallback: "Unnamed" },
                                {
                                    id: "accountType",
                                    headerName: "Type",
                                    render: (_, item) => isCreditCardAccount(item) ? "Credit Card" : (item.account_type || "cash").replace("_", " "),
                                },
                                // {
                                //     id: "creditTotal",
                                //     headerName: "Credit Total",
                                //     align: "right",
                                //     cellSx: { color: "success.main", fontWeight: 700 },
                                //     render: (_, item) => formatCurrency(accountTotals.find((account) => account.id === item.id)?.totalCredit),
                                // },
                                // {
                                //     id: "debitTotal",
                                //     headerName: "Debit Total",
                                //     align: "right",
                                //     cellSx: { color: "error.main", fontWeight: 700 },
                                //     render: (_, item) => formatCurrency(accountTotals.find((account) => account.id === item.id)?.totalDebit),
                                // },
                                {
                                    id: "currentBalance",
                                    headerName: "Balance / Outstanding",
                                    align: "right",
                                    render: (_, item) => {
                                        if (isCreditCardAccount(item)) {
                                            return `Outstanding ${formatCurrency(getCreditCardOutstanding(item))}`;
                                        }
                                        const totals = accountTotals.find((account) => account.id === item.id);
                                        return formatCurrency(totals?.closingBalance ?? item?.account_balance);
                                    },
                                },
                                {
                                    id: "availableLimit",
                                    headerName: "Available Limit",
                                    align: "right",
                                    render: (_, item) => isCreditCardAccount(item) ? formatCurrency(getCreditCardAvailableLimit(item)) : "-",
                                },
                                {
                                    id: "actions",
                                    headerName: "Actions",
                                    render: (_, item) => (
                                        <>
                                            <IconButton color="primary" onClick={() => handleEdit(item)}>
                                                <Edit />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => requestDelete(item?.id)}>
                                                <Delete />
                                            </IconButton>
                                        </>
                                    ),
                                },
                            ]}
                            pagination={{
                                count: accountsWithDerivedCardBalances.length,
                                page,
                                rowsPerPage,
                                rowsPerPageOptions: [5, 10, 25, 50],
                                onPageChange: (e, newPage) => setPage(newPage),
                                onRowsPerPageChange: (e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(0);
                                },
                            }}
                        />
                    </FormSection>

                    <Box className="account-page__section-header account-page__section-header--ledger">
                        <Box>
                            <Typography variant="h6">Account Ledger</Typography>
                            <Typography variant="body2">Date-wise credit, debit aur running (closing) balance</Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={handleDownloadLedgerStatement}
                            disabled={displayedLedgerRows.length === 0}
                        >
                            Download Ledger
                        </Button>
                    </Box>
                    <SearchFilterBar
                        sx={{ mb: 0 }}
                        filters={[
                            {
                                name: "account",
                                label: "Account",
                                value: ledgerAccountFilter,
                                onChange: setLedgerAccountFilter,
                                options: [
                                    { label: "All Accounts", value: "all" },
                                    ...accountsWithDerivedCardBalances.map((acc) => ({ label: acc.account_name, value: String(acc.id) })),
                                ],
                            },
                            {
                                name: "month",
                                label: "Month",
                                value: ledgerMonthFilter,
                                disabled: dateRangeActive,
                                onChange: setLedgerMonthFilter,
                                options: [
                                    { label: "All Months", value: "all" },
                                    ...availableMonths.map((monthKey) => ({ label: formatMonthLabel(monthKey), value: monthKey })),
                                ],
                            },
                        ]}
                    >
                        <TextField
                            size="small"
                            type="date"
                            label="From Date"
                            InputLabelProps={{ shrink: true }}
                            value={ledgerFromDate}
                            onChange={(e) => setLedgerFromDate(e.target.value)}
                            sx={{ minWidth: 160 }}
                        />
                        <TextField
                            size="small"
                            type="date"
                            label="To Date"
                            InputLabelProps={{ shrink: true }}
                            value={ledgerToDate}
                            onChange={(e) => setLedgerToDate(e.target.value)}
                            sx={{ minWidth: 160 }}
                        />
                        {dateRangeActive && (
                            <Button size="small" onClick={() => { setLedgerFromDate(""); setLedgerToDate(""); }}>
                                Clear Dates
                            </Button>
                        )}
                    </SearchFilterBar>
                    <TableContainer component={Paper} className="data-table-shell account-page__table-shell account-page__ledger-shell">
                        <Table size="small">
                            <TableHead>
                                <TableRow className="account-page__table-head">
                                    <TableCell className="account-page__head-cell">Date</TableCell>
                                    <TableCell className="account-page__head-cell">Account</TableCell>
                                    <TableCell className="account-page__head-cell">Category</TableCell>
                                    <TableCell className="account-page__head-cell">Description</TableCell>
                                    <TableCell className="account-page__head-cell" align="right">Credit</TableCell>
                                    <TableCell className="account-page__head-cell" align="right">Debit</TableCell>
                                    <TableCell className="account-page__head-cell" align="right">Closing Balance</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {displayedLedgerRows
                                    .slice(ledgerPage * ledgerRowsPerPage, ledgerPage * ledgerRowsPerPage + ledgerRowsPerPage)
                                    .map((row) => (
                                        <TableRow key={row.id} className={row.isOpeningBalance ? "account-page__opening-row" : undefined}>
                                            <TableCell>{formatDate(row.transactionDate)}</TableCell>
                                            <TableCell>{row.accountName}</TableCell>
                                            <TableCell>{row.categoryName}</TableCell>
                                            <TableCell>{row.description}</TableCell>
                                            <TableCell align="right" className="account-page__value--credit">{row.credit ? formatCurrency(row.credit) : "-"}</TableCell>
                                            <TableCell align="right" className="account-page__value--debit">{row.debit ? formatCurrency(row.debit) : "-"}</TableCell>
                                            <TableCell align="right" className={row.closingBalance >= 0 ? "account-page__value--positive" : "account-page__value--negative"}>{formatCurrency(row.closingBalance)}</TableCell>
                                        </TableRow>
                                    ))}
                                {displayedLedgerRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">No ledger entries found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="account-page__table-head">
                                    <TableCell colSpan={4} align="right"><strong>Total (filtered)</strong></TableCell>
                                    <TableCell align="right" className="account-page__value--credit">
                                        <strong>{formatCurrency(filteredLedgerTotals.totalCredit)}</strong>
                                    </TableCell>
                                    <TableCell align="right" className="account-page__value--debit">
                                        <strong>{formatCurrency(filteredLedgerTotals.totalDebit)}</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>{formatCurrency(filteredLedgerClosingBalance)}</strong>
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        component="div"
                        count={displayedLedgerRows.length}
                        page={ledgerPage}
                        onPageChange={(e, newPage) => setLedgerPage(newPage)}
                        rowsPerPage={ledgerRowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setLedgerRowsPerPage(parseInt(e.target.value, 10));
                            setLedgerPage(0);
                        }}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                    />
                </>
            )}

            <ConfirmDialog
                open={Boolean(deleteCandidateId)}
                title="Delete account?"
                description="Are you sure you want to delete this account?"
                confirmLabel="Delete"
                onClose={() => setDeleteCandidateId(null)}
                onConfirm={handleDelete}
            />

            <Snackbar open={openSnackbar} autoHideDuration={5000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AccountPage;