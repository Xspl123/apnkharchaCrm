const CREDIT_TYPES = ["income", "borrow", "reimbursement"];
const DEBIT_TYPES = ["expense", "saving", "borrow_return", "repayment"];

const getCategoryType = (transaction, categories = []) => {
  const category = transaction.category || categories.find((cat) => String(cat.id) === String(transaction.category_id));
  return category?.type?.toLowerCase() || "";
};

const getTransactionDate = (transaction) => {
  const date = new Date(transaction.transaction_date || transaction.created_at || 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isCreditCardAccount = (account) => account?.account_type === "credit_card";

const getAccountImpact = (transaction, categories, accountIds, accountById) => {
  const type = getCategoryType(transaction, categories);
  const amount = Math.abs(Number(transaction.amount)) || 0;
  if (!amount) return { credit: 0, debit: 0, net: 0 };

  const hasAccount = (id) => accountIds.has(String(id));

  if (type === "transfer") {
    const fromAccount = accountById.get(String(transaction.account_id));
    const toAccount = accountById.get(String(transaction.transfer_to));
    const debit = hasAccount(transaction.account_id) ? amount : 0;
    const credit = hasAccount(transaction.transfer_to) ? amount : 0;

    if (isCreditCardAccount(toAccount) || isCreditCardAccount(fromAccount)) {
      return { credit: debit, debit: credit, net: debit - credit };
    }

    return { credit, debit, net: credit - debit };
  }

  if (!hasAccount(transaction.account_id)) return { credit: 0, debit: 0, net: 0 };

  if (CREDIT_TYPES.includes(type)) return { credit: amount, debit: 0, net: amount };
  if (DEBIT_TYPES.includes(type)) return { credit: 0, debit: amount, net: -amount };

  return { credit: 0, debit: 0, net: 0 };
};

export const getPeriodBalanceSummary = ({ accounts = [], transactions = [], categories = [], periodStart, periodEnd, accountIds }) => {
  const selectedAccountIds = new Set((accountIds?.length ? accountIds : accounts.map((account) => account.id)).map(String));
  const accountById = new Map(accounts.map((account) => [String(account.id), account]));
  const start = periodStart ? new Date(periodStart) : null;
  const end = periodEnd ? new Date(periodEnd) : null;

  const currentBalance = accounts
    .filter((account) => selectedAccountIds.has(String(account.id)))
    .reduce((sum, account) => sum + (Number(account.account_balance) || 0), 0);

  let periodCredit = 0;
  let periodDebit = 0;
  let periodNet = 0;
  let afterPeriodNet = 0;

  transactions.forEach((transaction) => {
    const date = getTransactionDate(transaction);
    if (!date) return;

    const impact = getAccountImpact(transaction, categories, selectedAccountIds, accountById);
    if (!impact.credit && !impact.debit && !impact.net) return;

    const inPeriod = (!start || date >= start) && (!end || date <= end);
    if (inPeriod) {
      periodCredit += impact.credit;
      periodDebit += impact.debit;
      periodNet += impact.net;
      return;
    }

    if (end && date > end) {
      afterPeriodNet += impact.net;
    }
  });

  const closingBalance = currentBalance - afterPeriodNet;
  const openingBalance = closingBalance - periodNet;

  return {
    openingBalance,
    periodCredit,
    periodDebit,
    periodNet,
    closingBalance,
    currentBalance,
  };
};
