import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/state/authSlice";
import categoryReducer from "./features/categorySlice";
import accountsReducer from "./features/accountSlice";
import transactionReducer from "./features/transactionSlice";
import budgetReducer from "./features/budgetSlice";
import loansReducer from "./features/loanSlice";
import clientReducer from "./features/clientSlice";
import invoiceReducer from "./features/invoiceSlice";
import invoicePaymentReducer from "./features/invoicePaymentSlice";
import companyReducer from "./features/companySlice";
import hsnCodeReducer from "./features/hsnCodeSlice";
import gstReducer from "../features/gst/state/gstSlice";
import vendorReducer from "../features/vendors/state/vendorSlice";
import inventoryReducer from "../features/inventory/state/inventorySlice";
import salesReturnReducer from "./features/salesReturnSlice";
import purchaseReturnReducer from "./features/purchaseReturnSlice";
import attributeReducer from "./features/attributeSlice";
import userReducer from "../features/admin/state/userSlice";
import roleReducer from "../features/admin/state/roleSlice";
import leadReducer from "../features/crm/state/leadSlice";
import campaignReducer from "../features/crm/state/campaignSlice";
import quotationReducer from "../features/crm/state/quotationSlice";
import orgReducer from "../features/organisation/state/orgSlice";
import SuperAdminReducer from "./features/superAdminSlice";
import { isCrmEnabled, isCrmOnlyEdition, isExpenseOnlyEdition } from "../config/moduleConfig";

const crmReducers = isCrmEnabled
  ? {
      leads: leadReducer,
      campaigns: campaignReducer,
      quotations: quotationReducer,
    }
  : {};

const sharedReducers = {
  auth: authReducer,
  companies: companyReducer,
  orgs: orgReducer,
  ...crmReducers,
};

const expenseReducers = {
  category: categoryReducer,
  accounts: accountsReducer,
  transactions: transactionReducer,
  budget: budgetReducer,
  loans: loansReducer,
};

const businessReducers = {
  clients: clientReducer,
  invoices: invoiceReducer,
  invoicePayments: invoicePaymentReducer,
  hsnCodes: hsnCodeReducer,
  gst: gstReducer,
  vendors: vendorReducer,
  inventory: inventoryReducer,
  salesReturns: salesReturnReducer,
  purchaseReturns: purchaseReturnReducer,
  attributes: attributeReducer,
  users: userReducer,
  roles: roleReducer,
  superAdmin: SuperAdminReducer,
};

const mainReducers = {
  ...expenseReducers,
  ...businessReducers,
};

const rootReducer = combineReducers({
  ...sharedReducers,
  ...(isCrmOnlyEdition ? {} : isExpenseOnlyEdition ? expenseReducers : mainReducers),
});

export default rootReducer;