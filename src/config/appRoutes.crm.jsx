import { lazy } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CampaignIcon from "@mui/icons-material/Campaign";
import { matchPath } from "react-router-dom";

// CRM-only edition: this file intentionally imports ONLY what the CRM
// standalone build needs. Do not import finance/inventory/admin pages
// here — the whole point of this file existing separately from
// appRoutes.jsx is so Rollup never sees those imports and never emits
// their chunks into a `VITE_APP_EDITION=crm` build. See vite.config.js
// for the alias that swaps this file in for that edition.
//
// IMPORTANT: publicRoutes and the helper exports below (isRouteAccessible,
// getSidebarSections, getStandaloneSidebarRoutes, getMatchedRoute,
// getBreadcrumbs) are required by Sidebar.jsx, Navbar.jsx and
// AppRoutes.jsx regardless of edition — removing any of them breaks the
// whole app (blank screen), not just the CRM pages. If you add new CRM
// routes here, keep these exports intact.

const Login = lazy(() => import("../features/auth/pages/Login"));
const Register = lazy(() => import("../features/auth/pages/Register"));
const VerifyOtp = lazy(() => import("../features/auth/pages/VerifyOtp"));
const LeadDashboard = lazy(() => import("../features/crm/pages/LeadDashboard"));
const LeadList = lazy(() => import("../features/crm/pages/LeadList"));
const LeadDetail = lazy(() => import("../features/crm/pages/LeadDetail"));
const LeadPipeline = lazy(() => import("../features/crm/pages/LeadPipeline"));
const CampaignList = lazy(() => import("../features/crm/pages/CampaignList"));

export const publicRoutes = [
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/verify-otp", element: <VerifyOtp /> },
];

export const menuSections = [
  { key: "crm", label: "CRM", icon: <BusinessIcon /> },
];

export const protectedRoutes = [
  {
    key: "crm-dashboard",
    path: "/crm/dashboard",
    label: "Dashboard",
    icon: <DashboardIcon />,
    element: <LeadDashboard />,
    permission: "leads.view",
    group: "crm",
    showInSidebar: true,
  },
  {
    key: "crm-leads",
    path: "/crm/leads",
    label: "Leads",
    icon: <BusinessIcon />,
    element: <LeadList />,
    permission: "leads.view",
    group: "crm",
    showInSidebar: true,
  },
  {
    key: "crm-pipeline",
    path: "/crm/pipeline",
    label: "Pipeline",
    icon: <AssessmentIcon />,
    element: <LeadPipeline />,
    permission: "leads.view",
    group: "crm",
    showInSidebar: true,
  },
  {
    key: "crm-campaigns",
    path: "/crm/campaigns",
    label: "Campaigns",
    icon: <CampaignIcon />,
    element: <CampaignList />,
    permission: "campaigns.view",
    group: "crm",
    showInSidebar: true,
  },
  {
    key: "crm-lead-detail",
    path: "/crm/leads/:id",
    label: "Lead Details",
    icon: <BusinessIcon />,
    element: <LeadDetail />,
    permission: "leads.view",
    group: "crm",
    breadcrumbs: [
      { label: "CRM" },
      { label: "Leads", href: "/crm/leads" },
      { label: "Lead Details", current: true },
    ],
  },
];

export const isRouteAccessible = (route, permissionApi, user) => {
  if (route.requiresOrg && !user?.org_id && !user?.organisation?.id) {
    return false;
  }

  if (route.permission) {
    return permissionApi.can(route.permission);
  }

  if (route.permissionsAny?.length) {
    return permissionApi.can(route.permissionsAny);
  }

  if (route.roles?.length) {
    return route.roles.some((role) => permissionApi.isRole(role)) ||
      (route.allowSuperAdmin && permissionApi.isSuperAdmin());
  }

  if (route.allowSuperAdmin) {
    return permissionApi.isSuperAdmin();
  }

  return true;
};

export const getSidebarSections = (permissionApi, user) =>
  menuSections
    .map((section) => ({
      ...section,
      children: protectedRoutes.filter(
        (route) =>
          route.showInSidebar &&
          route.group === section.key &&
          isRouteAccessible(route, permissionApi, user)
      ),
    }))
    .filter((section) => section.children.length > 0);

export const getStandaloneSidebarRoutes = (permissionApi, user) =>
  protectedRoutes.filter(
    (route) =>
      route.showInSidebar &&
      !route.group &&
      isRouteAccessible(route, permissionApi, user)
  );

export const getMatchedRoute = (pathname) =>
  protectedRoutes.find((route) =>
    matchPath({ path: route.path, end: true }, pathname)
  );

export const getBreadcrumbs = (pathname, state) => {
  const matchedRoute = getMatchedRoute(pathname);

  if (!matchedRoute) {
    return [];
  }

  if (typeof matchedRoute.breadcrumbs === "function") {
    const match = matchPath({ path: matchedRoute.path, end: true }, pathname);
    return matchedRoute.breadcrumbs({
      params: match?.params || {},
      state,
      route: matchedRoute,
    });
  }

  if (matchedRoute.breadcrumbs) {
    return matchedRoute.breadcrumbs;
  }

  if (matchedRoute.group) {
    const parent = menuSections.find((section) => section.key === matchedRoute.group);
    return [
      { label: parent?.label || matchedRoute.label },
      { label: matchedRoute.label, current: true },
    ];
  }

  return [{ label: matchedRoute.label, current: true }];
};