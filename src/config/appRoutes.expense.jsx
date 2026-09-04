import { lazy } from "react";
import HomeIcon from "@mui/icons-material/Home";
import CategoryIcon from "@mui/icons-material/Category";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PieChartIcon from "@mui/icons-material/PieChart";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { matchPath } from "react-router-dom";

// Expense-tracker-only edition (ApnaKharcha): this file intentionally
// imports ONLY the personal-finance pages. Do not import CRM or
// business/ERP (GST, vendors, inventory, invoices, admin) pages here —
// this file exists separately from appRoutes.jsx so Rollup never sees
// those imports and never emits their chunks into a
// `VITE_APP_EDITION=expense` build. See vite.config.js for the alias
// that swaps this file in for that edition.

const Login = lazy(() => import("../features/auth/pages/Login"));
const Register = lazy(() => import("../features/auth/pages/Register"));
const VerifyOtp = lazy(() => import("../features/auth/pages/VerifyOtp"));
const OrganisationSetup = lazy(() =>
  import("../features/organisation/pages/OrganisationSetup")
);
const Dashboard = lazy(() => import("../pages/Dashboard"));
const CategoryPage = lazy(() => import("../pages/CategoryCreate"));
const Accountpage = lazy(() => import("../pages/AccountPage"));
const Transactions = lazy(() => import("../pages/Transactions"));
const BudgetPage = lazy(() => import("../pages/BudgetPage"));
const Report = lazy(() => import("../pages/Report"));
const ProfitLossReport = lazy(() => import("../pages/ProfitLossReport"));
const LoanList = lazy(() => import("../pages/LoanPage"));
const CompanyList = lazy(() => import("../pages/CompanyList"));

export const publicRoutes = [
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/verify-otp", element: <VerifyOtp /> },
];

// No grouped sections — every route below is a top-level sidebar item,
// matching the original ApnaKharcha sidebar exactly.
export const menuSections = [];

export const protectedRoutes = [
  { key: "dashboard", path: "/dashboard", label: "Dashboard", icon: <HomeIcon />, element: <Dashboard />, showInSidebar: true },
  {
    key: "organisation-setup",
    path: "/organisation/setup",
    label: "Organisation Setup",
    element: <OrganisationSetup />,
    requiresOrg: false,
    breadcrumbs: [{ label: "Organisation" }, { label: "Setup", current: true }],
  },
  { key: "companies", path: "/companies", label: "Companies", icon: <AccountBalanceIcon />, element: <CompanyList />, permission: "clients.manage", showInSidebar: true, roles: ["sales_manager"], allowSuperAdmin: true },
  { key: "accounts", path: "/accounts", label: "Accounts", icon: <AccountBalanceIcon />, element: <Accountpage />, showInSidebar: true },
  { key: "transactions", path: "/transactions", label: "Transactions", icon: <AttachMoneyIcon />, element: <Transactions />, showInSidebar: true },
  { key: "categories", path: "/categories", label: "Categories", icon: <CategoryIcon />, element: <CategoryPage />, showInSidebar: true },
  { key: "budgets", path: "/budgets", label: "Budgets", icon: <PieChartIcon />, element: <BudgetPage />, showInSidebar: true },
  { key: "reports", path: "/reports", label: "Reports", icon: <AssessmentIcon />, element: <Report />, showInSidebar: true },
  { key: "profit-loss", path: "/profit-loss", label: "Profit & Loss", icon: <TrendingDownIcon />, element: <ProfitLossReport />, showInSidebar: true },
  { key: "loans", path: "/loans", label: "Loans", icon: <MonetizationOnIcon />, element: <LoanList />, showInSidebar: true },
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