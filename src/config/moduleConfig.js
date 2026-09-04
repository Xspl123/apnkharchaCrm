const edition = (import.meta.env.VITE_APP_EDITION || "full").toLowerCase();

export const appEdition = ["full", "main", "crm", "expense"].includes(edition) ? edition : "full";

export const isCrmEnabled = !["main", "expense"].includes(appEdition);
export const isCrmOnlyEdition = appEdition === "crm";
export const isExpenseOnlyEdition = appEdition === "expense";
export const defaultProtectedPath = isCrmOnlyEdition ? "/crm/leads" : "/dashboard";