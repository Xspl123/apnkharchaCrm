import { useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CategoryPage from "./pages/CategoryCreate"; // ✅ Import Category Page
import Accountpage from "./pages/AccountPage"; // ✅ Import Category Page
import Transactions from "./pages/Transactions";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useSelector } from "react-redux";

// ✅ Protected Route
const ProtectedRoute = () => {
    const token = useSelector(state => state.auth?.token) || localStorage.getItem("token");
    return token ? <Outlet /> : <Navigate to="/login" />;
};

const AppRoutes = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [themeColor, setThemeColor] = useState("#1E1E2F");

    return (
        <Routes>
            {/* ✅ Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* ✅ Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route
                    path="/*"
                    element={
                        <Layout
                            sidebarOpen={sidebarOpen}
                            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                            themeColor={themeColor}
                            setThemeColor={setThemeColor}
                        >
                            <Routes>
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="categories" element={<CategoryPage />} />
                                <Route path="accounts" element={<Accountpage />} />
                                <Route path="transactions" element={<Transactions />} /> 
                            </Routes>
                        </Layout>
                    }
                />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
