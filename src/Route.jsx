import { useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
<<<<<<< HEAD
import CategoryPage from "./pages/CategoryCreate"; // ✅ Import Category Page
import Accountpage from "./pages/AccountPage"; // ✅ Import Category Page
=======
import CategoryPage from "./pages/CategoryCreate";
import Accountpage from "./pages/AccountPage";
>>>>>>> f81c650 (Initial commit)
import Transactions from "./pages/Transactions";
import BudgetPage from "./pages/BudgetPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
<<<<<<< HEAD
=======
import Report from "./pages/Report";

>>>>>>> f81c650 (Initial commit)
import { useSelector } from "react-redux";

// ✅ Protected Route
const ProtectedRoute = () => {
    const token = useSelector(state => state.auth?.token) || localStorage.getItem("token");
<<<<<<< HEAD
    return token ? <Outlet /> : <Navigate to="/login" />;
=======
    return token ? <Outlet /> : <Navigate to="/" />;
>>>>>>> f81c650 (Initial commit)
};

const AppRoutes = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [themeColor, setThemeColor] = useState("#1E1E2F");

    return (
        <Routes>
            {/* ✅ Public Routes */}
<<<<<<< HEAD
            <Route path="/login" element={<Login />} />
=======
            <Route path="/" element={<Login />} />
>>>>>>> f81c650 (Initial commit)
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
<<<<<<< HEAD
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="categories" element={<CategoryPage />} />
                                <Route path="accounts" element={<Accountpage />} />
                                <Route path="transactions" element={<Transactions />} /> 
                                <Route path="budgets" element={<BudgetPage />} /> 
=======
                                {/* All routes below are protected */}
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="categories" element={<CategoryPage />} />
                                <Route path="accounts" element={<Accountpage />} />
                                <Route path="transactions" element={<Transactions />} />
                                <Route path="budgets" element={<BudgetPage />} />
                                <Route path="reports" element={<Report />} />
>>>>>>> f81c650 (Initial commit)
                            </Routes>
                        </Layout>
                    }
                />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
