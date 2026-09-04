import { lazy } from "react";
import HomeIcon from "@mui/icons-material/Home";
import CategoryIcon from "@mui/icons-material/Category";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PieChartIcon from "@mui/icons-material/PieChart";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PersonIcon from "@mui/icons-material/Person";
import StoreIcon from "@mui/icons-material/Store";
import PeopleIcon from "@mui/icons-material/People";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BusinessIcon from "@mui/icons-material/Business";
import SettingsIcon from "@mui/icons-material/Settings";
import { matchPath } from "react-router-dom";

// Main (finance/inventory) edition: this file intentionally imports
// ONLY non-CRM pages. Do not import CRM pages here — this file exists
// separately from appRoutes.jsx so Rollup never sees the CRM imports
// and never emits their chunks into a `VITE_APP_EDITION=main` build.
// See vite.config.js for the alias that swaps this file in.

const Login = lazy(() => import("../features/auth/pages/Login"));
const Register = lazy(() => import("../features/auth/pages/Register"));
const VerifyOtp = lazy(() => import("../features/auth/pages/VerifyOtp"));
const OrganisationSetup = lazy(() =>
  import("../features/organisation/pages/OrganisationSetup")
);
const OrganisationSettings = lazy(() =>
  import("../features/organisation/pages/OrganisationSettings")
);
const Dashboard = lazy(() => import("../pages/Dashboard"));
const CategoryPage = lazy(() => import("../pages/CategoryCreate"));
const Accountpage = lazy(() => import("../pages/AccountPage"));
const Transactions = lazy(() => import("../pages/Transactions"));
const BudgetPage = lazy(() => import("../pages/BudgetPage"));
const Report = lazy(() => import("../pages/Report"));
const ProfitLossReport = lazy(() => import("../pages/ProfitLossReport"));
const LoanList = lazy(() => import("../pages/LoanPage"));
const ClientList = lazy(() => import("../pages/ClientList"));
const InvoiceList = lazy(() => import("../pages/InvoiceList"));
const InvoicePaymentList = lazy(() => import("../pages/InvoicePaymentList"));
const CompanyList = lazy(() => import("../pages/CompanyList"));
const HsnCodeList = lazy(() => import("../pages/HsnCodeList"));
const ClientLedgerPage = lazy(() => import("../pages/ClientLedgerPage"));
const GstDashboard = lazy(() => import("../features/gst/pages/GstDashboard"));
const Gstr1Page = lazy(() => import("../features/gst/pages/Gstr1Page"));
const Gstr3bPage = lazy(() => import("../features/gst/pages/Gstr3bPage"));
const GstReturnsPage = lazy(() => import("../features/gst/pages/GstReturnsPage"));
const VendorDashboard = lazy(() => import("../features/vendors/pages/VendorDashboard"));
const VendorList = lazy(() => import("../features/vendors/pages/VendorList"));
const VendorPayments = lazy(() => import("../features/vendors/pages/VendorPayments"));
const SuperAdminDashboard = lazy(() => import("../pages/admin/SuperAdminDashboard"));
const PurchaseOrderList = lazy(() =>
  import("../features/vendors/pages/PurchaseOrderList")
);
const InventoryDashboard = lazy(() =>
  import("../features/inventory/pages/InventoryDashboard")
);
const ProductList = lazy(() => import("../features/inventory/pages/ProductList"));
const StockMovement = lazy(() => import("../features/inventory/pages/StockMovement"));
const InventoryReport = lazy(() => import("../features/inventory/pages/InventoryReport"));
const UserManagement = lazy(() => import("../features/admin/pages/UserManagement"));
const RoleManagement = lazy(() => import("../features/admin/pages/RoleManagement"));

export const publicRoutes = [
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/verify-otp", element: <VerifyOtp /> },
];

export const menuSections = [
  { key: "platform", label: "Platform", icon: <AdminPanelSettingsIcon /> },
  { key: "sales", label: "Sales", icon: <AssessmentIcon /> },
  { key: "purchase", label: "Purchase", icon: <StoreIcon /> },
  { key: "inventory", label: "Inventory", icon: <InventoryIcon /> },
  { key: "organisation", label: "Organisation", icon: <BusinessIcon /> },
  { key: "admin", label: "User Management", icon: <AdminPanelSettingsIcon /> },
];

export const protectedRoutes = [
  { key: "dashboard", path: "/dashboard", label: "Dashboard", icon: <HomeIcon />, element: <Dashboard />, showInSidebar: true },
  { key: "organisation-setup", path: "/organisation/setup", label: "Organisation Setup", element: <OrganisationSetup />, requiresOrg: false,
    breadcrumbs: [{ label: "Organisation" }, { label: "Setup", current: true }] },
  { key: "organisation-settings", path: "/organisation/settings", label: "Settings", icon: <SettingsIcon />, element: <OrganisationSettings />, group: "organisation", showInSidebar: true, requiresOrg: true },
  { key: "companies", path: "/companies", label: "Companies", icon: <AccountBalanceIcon />, element: <CompanyList />, permission: "clients.manage", showInSidebar: true, roles: ["sales_manager"], allowSuperAdmin: true },
  { key: "accounts", path: "/accounts", label: "Accounts", icon: <AccountBalanceIcon />, element: <Accountpage />, showInSidebar: true },
  { key: "transactions", path: "/transactions", label: "Transactions", icon: <AttachMoneyIcon />, element: <Transactions />, showInSidebar: true },
  { key: "categories", path: "/categories", label: "Categories", icon: <CategoryIcon />, element: <CategoryPage />, showInSidebar: true },
  { key: "budgets", path: "/budgets", label: "Budgets", icon: <PieChartIcon />, element: <BudgetPage />, showInSidebar: true },
  { key: "reports", path: "/reports", label: "Reports", icon: <AssessmentIcon />, element: <Report />, showInSidebar: true },
  { key: "profit-loss", path: "/profit-loss", label: "Profit & Loss", icon: <TrendingDownIcon />, element: <ProfitLossReport />, showInSidebar: true },
  { key: "loans", path: "/loans", label: "Loans", icon: <MonetizationOnIcon />, element: <LoanList />, showInSidebar: true },
  { key: "clients", path: "/clients", label: "Clients", icon: <PersonIcon />, element: <ClientList />, permission: "clients.view", group: "sales", showInSidebar: true },
  { key: "client-ledger", path: "/clients/:clientId/ledger", label: "Client Ledger", element: <ClientLedgerPage />, permission: "clients.view",
    breadcrumbs: ({ params, state }) => {
      const client = state?.clients?.clients?.find((item) => String(item.id) === params.clientId);
      return [{ label: "Sales" }, { label: "Clients", href: "/clients" }, { label: client?.company_name || `Client ${params.clientId} Ledger`, current: true }];
    } },
  { key: "gst-dashboard", path: "/gst/dashboard", label: "GST Dashboard", icon: <DashboardIcon />, element: <GstDashboard />, permission: "gst.view", group: "sales", showInSidebar: true },
  { key: "invoices", path: "/invoices", label: "Invoices", icon: <AssessmentIcon />, element: <InvoiceList />, permission: "invoices.view", group: "sales", showInSidebar: true },
  { key: "invoices-payment", path: "/invoices-payment", label: "Payments", icon: <AttachMoneyIcon />, element: <InvoicePaymentList />, permission: "payments.manage", group: "sales", showInSidebar: true },
  { key: "gst-gstr1", path: "/gst/gstr1", label: "GSTR-1", icon: <AssessmentIcon />, element: <Gstr1Page />, permission: "gst.view",
    breadcrumbs: [{ label: "Sales" }, { label: "GSTR-1", current: true }] },
  { key: "gst-gstr3b", path: "/gst/gstr3b", label: "GSTR-3B", icon: <AssessmentIcon />, element: <Gstr3bPage />, permission: "gst.view",
    breadcrumbs: [{ label: "Sales" }, { label: "GSTR-3B", current: true }] },
  { key: "gst-returns", path: "/gst/returns", label: "Returns", icon: <AssessmentIcon />, element: <GstReturnsPage />, permission: "gst.view",
    breadcrumbs: [{ label: "Sales" }, { label: "Returns", current: true }] },
  { key: "hsn-codes", path: "/hsn-codes", label: "Hsn Codes", icon: <CategoryIcon />, element: <HsnCodeList />, permission: "products.view", group: "sales", showInSidebar: true, allowSuperAdmin: true },
  { key: "vendors-dashboard", path: "/vendors/dashboard", label: "Vendor Dashboard", icon: <DashboardIcon />, element: <VendorDashboard />, permission: "vendors.view", group: "purchase", showInSidebar: true },
  { key: "vendors-list", path: "/vendors/list", label: "Vendors", icon: <PersonIcon />, element: <VendorList />, permission: "vendors.view", group: "purchase", showInSidebar: true },
  { key: "purchase-orders", path: "/vendors/purchase-orders", label: "Purchase Orders", icon: <AssessmentIcon />, element: <PurchaseOrderList />, permission: "purchase_orders.view", group: "purchase", showInSidebar: true },
  { key: "vendor-payments", path: "/vendors/payments", label: "Vendor Payments", icon: <AccountBalanceIcon />, element: <VendorPayments />, permission: "purchase_orders.view", group: "purchase", showInSidebar: false,
    breadcrumbs: [{ label: "Purchase" }, { label: "Vendor Payments", current: true }] },
  { key: "inventory-dashboard", path: "/inventory/dashboard", label: "Dashboard", icon: <DashboardIcon />, element: <InventoryDashboard />, permission: "stock.view", group: "inventory", showInSidebar: true },
  { key: "inventory-products", path: "/inventory/products", label: "Products", icon: <CategoryIcon />, element: <ProductList />, permission: "products.view", group: "inventory", showInSidebar: true },
  { key: "inventory-stock-movements", path: "/inventory/stock-movements", label: "Stock Movements", icon: <SwapHorizIcon />, element: <StockMovement />, permission: "stock.view", group: "inventory", showInSidebar: true },
  { key: "inventory-report", path: "/inventory/report", label: "Report", icon: <AssessmentIcon />, element: <InventoryReport />, permission: "stock.view", group: "inventory", showInSidebar: true },
  { key: "admin-users", path: "/admin/users", label: "Users", icon: <PeopleIcon />, element: <UserManagement />, permission: "users.view", group: "admin", showInSidebar: true },
  { key: "admin-roles", path: "/admin/roles", label: "Roles", icon: <AdminPanelSettingsIcon />, element: <RoleManagement />, permission: "roles.manage", group: "admin", showInSidebar: true },
  { key: "super-admin", path: "/admin/super-admin", label: "Platform Dashboard", icon: <DashboardIcon />, element: <SuperAdminDashboard />, allowSuperAdmin: true, group: "platform", showInSidebar: true,
    breadcrumbs: [{ label: "Platform" }, { label: "Platform Dashboard", current: true }] },
];

export const isRouteAccessible = (route, permissionApi, user) => {
  if (route.requiresOrg && !user?.org_id && !user?.organisation?.id) return false;
  if (route.permission) return permissionApi.can(route.permission);
  if (route.permissionsAny?.length) return permissionApi.can(route.permissionsAny);
  if (route.roles?.length) return route.roles.some((role) => permissionApi.isRole(role)) || (route.allowSuperAdmin && permissionApi.isSuperAdmin());
  if (route.allowSuperAdmin) return permissionApi.isSuperAdmin();
  return true;
};

export const getSidebarSections = (permissionApi, user) =>
  menuSections
    .map((section) => ({
      ...section,
      children: protectedRoutes.filter(
        (route) => route.showInSidebar && route.group === section.key && isRouteAccessible(route, permissionApi, user)
      ),
    }))
    .filter((section) => section.children.length > 0);

export const getStandaloneSidebarRoutes = (permissionApi, user) =>
  protectedRoutes.filter((route) => route.showInSidebar && !route.group && isRouteAccessible(route, permissionApi, user));

export const getMatchedRoute = (pathname) =>
  protectedRoutes.find((route) => matchPath({ path: route.path, end: true }, pathname));

export const getBreadcrumbs = (pathname, state) => {
  const matchedRoute = getMatchedRoute(pathname);
  if (!matchedRoute) return [];
  if (typeof matchedRoute.breadcrumbs === "function") {
    const match = matchPath({ path: matchedRoute.path, end: true }, pathname);
    return matchedRoute.breadcrumbs({ params: match?.params || {}, state, route: matchedRoute });
  }
  if (matchedRoute.breadcrumbs) return matchedRoute.breadcrumbs;
  if (matchedRoute.group) {
    const parent = menuSections.find((section) => section.key === matchedRoute.group);
    return [{ label: parent?.label || matchedRoute.label }, { label: matchedRoute.label, current: true }];
  }
  return [{ label: matchedRoute.label, current: true }];
};