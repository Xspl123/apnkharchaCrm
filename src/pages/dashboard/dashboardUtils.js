export const months = [
  { name: "January", value: 0 }, { name: "February", value: 1 },
  { name: "March", value: 2 }, { name: "April", value: 3 },
  { name: "May", value: 4 }, { name: "June", value: 5 },
  { name: "July", value: 6 }, { name: "August", value: 7 },
  { name: "September", value: 8 }, { name: "October", value: 9 },
  { name: "November", value: 10 }, { name: "December", value: 11 },
];

export const monthAliases = [
  ["january", "jan", "जनवरी"],
  ["february", "feb", "फ़रवरी", "फरवरी"],
  ["march", "mar", "मार्च"],
  ["april", "apr", "अप्रैल"],
  ["may", "मई"],
  ["june", "jun", "जून"],
  ["july", "jul", "जुलाई"],
  ["august", "aug", "अगस्त"],
  ["september", "sep", "sept", "सितंबर", "सितम्बर"],
  ["october", "oct", "अक्टूबर", "अक्तूबर"],
  ["november", "nov", "नवंबर", "नवम्बर"],
  ["december", "dec", "दिसंबर", "दिसम्बर"],
];

export const generateColor = (index) => {
  const colors = ["#6366f1", "#0891b2", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#ec4899"];
  return colors[index % colors.length];
};

export const normalizeVoiceText = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getMonthFromVoiceQuery = (query, fallbackMonth) => {
  const normalized = normalizeVoiceText(query);
  const monthIndex = monthAliases.findIndex((aliases) =>
    aliases.some((alias) => normalized.includes(alias))
  );
  if (monthIndex !== -1) return monthIndex;
  if (
    normalized.includes("this month") ||
    normalized.includes("current month") ||
    normalized.includes("is month") ||
    normalized.includes("is mahine") ||
    normalized.includes("iss mahine") ||
    normalized.includes("is महीने") ||
    normalized.includes("इस महीने")
  ) return new Date().getMonth();
  if (
    normalized.includes("last month") ||
    normalized.includes("previous month") ||
    normalized.includes("pichle mahine") ||
    normalized.includes("pichhle mahine") ||
    normalized.includes("पिछले महीने")
  ) return new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getMonth();
  return fallbackMonth;
};

export const getYearFromVoiceQuery = (query, fallbackYear) => {
  const normalized = normalizeVoiceText(query);
  const explicitYear = normalized.match(/\b20\d{2}\b/);
  if (explicitYear) return parseInt(explicitYear[0], 10);
  if (normalized.includes("last year") || normalized.includes("pichle saal") || normalized.includes("पिछले साल")) {
    return new Date().getFullYear() - 1;
  }
  return fallbackYear;
};

export const scoreCategoryMatch = (query, categoryName) => {
  const q = normalizeVoiceText(query);
  const c = normalizeVoiceText(categoryName);
  if (!c) return 0;
  if (q.includes(c)) return 100;
  if (c.includes(q) && q.length >= 3) return 92;
  const compactCategory = c.replace(/\s+/g, "");
  const compactQuery = q.replace(/\s+/g, "");
  if (compactQuery.includes(compactCategory)) return 95;
  if (compactCategory.includes(compactQuery) && compactQuery.length >= 3) return 88;
  const parts = c.split(" ").filter(Boolean);
  if (!parts.length) return 0;
  const matchedParts = parts.filter((part) => q.includes(part)).length;
  if (matchedParts === 0) {
    const queryParts = q.split(" ").filter((part) => part.length >= 3);
    const partialMatches = queryParts.filter((part) => c.includes(part)).length;
    if (partialMatches > 0) return (partialMatches / queryParts.length) * 75;
  }
  return (matchedParts / parts.length) * 80;
};

export const findCategoryFromVoiceQuery = (query, categories = []) => {
  let best = null;
  let bestScore = 0;
  categories.forEach((category) => {
    const score = scoreCategoryMatch(query, category.name || "");
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  });
  return bestScore >= 45 ? best : null;
};

export const formatDateInput = (date) => new Date(date).toISOString().split("T")[0];

export const getTransactionDateValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : formatDateInput(parsed);
};

export const parseTransactionDate = (value) => {
  const normalized = getTransactionDateValue(value);
  if (!normalized) return null;
  return new Date(`${normalized}T00:00:00`);
};

export const fmtAmt = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const getCategoryForTransaction = (transaction, categories = []) =>
  transaction.category || categories.find((category) => String(category.id) === String(transaction.category_id));

export const summarizeProfitLoss = (transactions, categories = []) =>
  transactions.reduce((acc, transaction) => {
    const category = getCategoryForTransaction(transaction, categories);
    const type = category?.type?.toLowerCase();
    const amount = Math.abs(parseFloat(transaction.amount)) || 0;

    if (type === "income") {
      acc.totalIncome += amount;
      acc.netBalance += amount;
    } else if (type === "expense") {
      acc.grossExpense += amount;
      acc.netBalance -= amount;
    } else if (type === "reimbursement") {
      acc.reimbursed += amount;
      acc.netBalance += amount;
    }

    return acc;
  }, { totalIncome: 0, grossExpense: 0, reimbursed: 0, netBalance: 0 });

export const calcDelta = (cur, prev) =>
  prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0;
