export const isCreditCardAccount = (account) => {
  const accountType = String(account?.account_type || "").toLowerCase().replace(/\s+/g, "_");
  return accountType === "credit_card";
};

const CREDIT_TYPES = ["income", "borrow", "reimbursement"];
const DEBIT_TYPES = ["expense", "saving", "borrow_return", "repayment"];

const getCategoryType = (transaction, categories = []) => {
  const category = transaction.category || categories.find((cat) => String(cat.id) === String(transaction.category_id));
  return String(category?.type || "").toLowerCase();
};

export const getDerivedCreditCardOutstanding = (account, transactions = [], categories = []) => {
  if (!isCreditCardAccount(account)) return 0;

  const accountId = String(account?.id || "");
  if (!accountId) return 0;

  const transactionNet = transactions.reduce((net, transaction) => {
    const amount = Math.abs(Number(transaction.amount)) || 0;
    if (!amount) return net;

    const type = getCategoryType(transaction, categories);
    const fromAccountId = String(transaction.account_id || "");
    const toAccountId = String(transaction.transfer_to || "");

    if (type === "transfer") {
      if (fromAccountId === accountId) return net + amount;
      if (toAccountId === accountId) return net - amount;
      return net;
    }

    if (fromAccountId !== accountId) return net;

    if (DEBIT_TYPES.includes(type)) return net + amount;
    if (CREDIT_TYPES.includes(type)) return net - amount;

    return net;
  }, 0);

  return Math.max(0, transactionNet);
};

export const withDerivedCreditCardBalances = (accounts = [], transactions = [], categories = []) => (
  accounts.map((account) => {
    if (!isCreditCardAccount(account)) return account;

    const derivedOutstanding = getDerivedCreditCardOutstanding(account, transactions, categories);
    const accountBalance = Number(account?.account_balance);
    const balanceOutstanding = Number.isFinite(accountBalance) ? Math.max(0, -accountBalance) : 0;
    const apiOutstanding = Number(account?.outstanding);
    const outstanding = Math.max(
      balanceOutstanding,
      derivedOutstanding,
      Number.isFinite(apiOutstanding) ? Math.max(0, apiOutstanding) : 0
    );

    return {
      ...account,
      account_balance: -outstanding,
      derived_outstanding: derivedOutstanding,
    };
  })
);

export const getCreditCardOutstanding = (account) => {
  const candidates = [];
  const accountBalance = Number(account?.account_balance);
  const derivedOutstanding = Number(account?.derived_outstanding);
  const apiOutstanding = Number(account?.outstanding);

  if (Number.isFinite(accountBalance)) candidates.push(Math.max(0, -accountBalance));
  if (Number.isFinite(derivedOutstanding)) candidates.push(Math.max(0, derivedOutstanding));
  if (Number.isFinite(apiOutstanding)) candidates.push(Math.max(0, apiOutstanding));

  return candidates.length > 0 ? Math.max(...candidates) : 0;
};

export const getCreditCardAvailableLimit = (account) => {
  const creditLimit = Number(account?.credit_limit);
  const apiAvailableLimit = Number(account?.available_limit);

  if (Number.isFinite(creditLimit) && creditLimit > 0) {
    return Math.max(0, creditLimit - getCreditCardOutstanding(account));
  }

  return Number.isFinite(apiAvailableLimit) ? Math.max(0, apiAvailableLimit) : 0;
};
