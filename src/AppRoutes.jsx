import { Suspense, useEffect, useState, lazy } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Box, CircularProgress } from "@mui/material";
import PropTypes from "prop-types";
import usePermission from "./hooks/usePermission";
import Layout from "./components/Layout";
import {
  publicRoutes,
  protectedRoutes,
  isRouteAccessible,
} from "./config/appRoutes";
import { defaultProtectedPath } from "./config/moduleConfig";

const PublicLeadForm = lazy(() => import("./features/public/PublicLeadForm"));

const ProtectedRoute = () => {
  const token =
    useSelector((state) => state.auth?.token) || localStorage.getItem("token");

  return token ? <Outlet /> : <Navigate to="/" />;
};

const PublicRoute = ({ children }) => {
  const token =
    useSelector((state) => state.auth?.token) || localStorage.getItem("token");

  return token ? <Navigate to={defaultProtectedPath} /> : children;
};

const PermissionRoute = ({ route, children }) => {
  const permissionApi = usePermission();
  const { loading, token, user } = useSelector((state) => state.auth || {});
  const storedToken = token || localStorage.getItem("token");

  if (storedToken && !user && loading) {
    return <RouteLoader />;
  }

  return isRouteAccessible(route, permissionApi, user) ? (
    children
  ) : (
    <Navigate
      to={defaultProtectedPath}
      replace
      state={{
        flash: {
          severity: "warning",
          message: "You do not have permission to access this page.",
        },
      }}
    />
  );
};

const ProtectedLayout = ({ colorMode, toggleColorMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" ? window.innerWidth >= 900 : true
  );

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 900);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const location = useLocation();
  useEffect(() => {
    if (window.innerWidth < 900) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <Layout
      sidebarOpen={sidebarOpen}
      toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      colorMode={colorMode}
      toggleColorMode={toggleColorMode}
    >
      <Outlet />
    </Layout>
  );
};

ProtectedLayout.propTypes = {
  colorMode: PropTypes.oneOf(["light", "dark"]).isRequired,
  toggleColorMode: PropTypes.func.isRequired,
};

const RouteLoader = () => (
  <Box
    sx={{
      minHeight: "40vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <CircularProgress size={32} />
  </Box>
);

const AppRoutes = ({ colorMode, toggleColorMode }) => (
  <Routes>
    {/* Web-to-lead capture form — fully standalone, no auth check either
        way. Deliberately NOT in publicRoutes: that group redirects a
        logged-in visitor away via <PublicRoute>, but a staff member should
        still be able to open/test their own org's form link while
        logged in. */}
    <Route
      path="/lead-form/:orgSlug"
      element={
        <Suspense fallback={<RouteLoader />}>
          <PublicLeadForm />
        </Suspense>
      }
    />

    {publicRoutes.map((route) => (
      <Route
        key={route.path}
        path={route.path}
        element={
          <Suspense fallback={<RouteLoader />}>
            <PublicRoute>{route.element}</PublicRoute>
          </Suspense>
        }
      />
    ))}

    <Route element={<ProtectedRoute />}>
      <Route
        element={
          <ProtectedLayout
            colorMode={colorMode}
            toggleColorMode={toggleColorMode}
          />
        }
      >
        {protectedRoutes.map((route) => (
          <Route
            key={route.key}
            path={route.path}
            element={
              <Suspense fallback={<RouteLoader />}>
                <PermissionRoute route={route}>{route.element}</PermissionRoute>
              </Suspense>
            }
          />
        ))}
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

AppRoutes.propTypes = {
  colorMode: PropTypes.oneOf(["light", "dark"]).isRequired,
  toggleColorMode: PropTypes.func.isRequired,
};

export default AppRoutes;