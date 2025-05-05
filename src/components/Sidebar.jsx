<<<<<<< HEAD
=======
import React from "react";
>>>>>>> f81c650 (Initial commit)
import PropTypes from "prop-types";
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
} from "@mui/material";
import {
    Home,
    Category,
    AccountBalance,
    AttachMoney,
    Person,
    PieChart
} from "@mui/icons-material";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
<<<<<<< HEAD
=======
import AssessmentIcon from "@mui/icons-material/Assessment"; // Replace MonetizationOnIcon for Reports
>>>>>>> f81c650 (Initial commit)
import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 250;
const collapsedWidth = 70;

<<<<<<< HEAD
const Sidebar = ({ open, themeColor }) => {
=======
const Sidebar = ({ open, toggleSidebar, themeColor, isMobile }) => {
>>>>>>> f81c650 (Initial commit)
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Drawer
<<<<<<< HEAD
            variant="permanent"
=======
            variant={isMobile ? "temporary" : "permanent"} // ✅ Temporary drawer for mobile
            open={open}
            onClose={toggleSidebar} // ✅ Close sidebar on mobile when toggled
>>>>>>> f81c650 (Initial commit)
            sx={{
                width: open ? drawerWidth : collapsedWidth,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                    width: open ? drawerWidth : collapsedWidth,
                    backgroundColor: themeColor,
                    color: "#fff",
                    transition: "width 0.3s ease",
                    overflowX: "hidden",
                },
            }}
        >
            <Box
<<<<<<< HEAD
=======
                role="presentation"
                onClick={isMobile ? toggleSidebar : undefined}
>>>>>>> f81c650 (Initial commit)
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: open ? "center" : "flex-start",
                    padding: "15px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                }}
            >
                <MonetizationOnIcon sx={{ fontSize: 40, color: "#FFD700", marginRight: open ? "10px" : "0" }} />
                {open && <Typography variant="h6">Expense Tracker</Typography>}
            </Box>

            <List>
                {[
                    { name: "Dashboard", icon: <Home />, path: "/dashboard" },
                    { name: "Categories", icon: <Category />, path: "/categories" },
                    { name: "Budgets", icon: <PieChart />, path: "/budgets" },
                    { name: "Accounts", icon: <AccountBalance />, path: "/accounts" },
                    { name: "Transactions", icon: <AttachMoney />, path: "/transactions" },
                    { name: "Users", icon: <Person />, path: "/users" },
<<<<<<< HEAD
=======
                    { name: "Reports", icon: <AssessmentIcon />, path: "/reports" }, // Ensure path is correct
>>>>>>> f81c650 (Initial commit)
                ].map((menu) => {
                    const isActive = location.pathname === menu.path;

                    return (
                        <ListItem
                            button
                            key={menu.name}
<<<<<<< HEAD
                            onClick={() => navigate(menu.path)}
                            sx={{
                                backgroundColor: isActive ? "#FFD700" : "transparent", // ✅ Change color if active
                                color: isActive ? "#000" : "#fff", // ✅ Text color change
                                "&:hover": { backgroundColor: "#ffec80", color: "#000" }, // ✅ Hover effect
=======
                            onClick={() => {
                                navigate(menu.path);
                                if (isMobile) toggleSidebar();
                            }} // Ensure navigation works and close sidebar on mobile
                            sx={{
                                backgroundColor: isActive ? "#FFD700" : "transparent",
                                color: isActive ? "#000" : "#fff",
                                "&:hover": { backgroundColor: "#ffec80", color: "#000" },
>>>>>>> f81c650 (Initial commit)
                                borderRadius: "5px",
                                margin: "5px 10px",
                            }}
                        >
                            <ListItemIcon sx={{ color: isActive ? "#000" : "#fff" }}>{menu.icon}</ListItemIcon>
                            <ListItemText primary={menu.name} />
                        </ListItem>
                    );
                })}
            </List>
        </Drawer>
    );
};

Sidebar.propTypes = {
    open: PropTypes.bool.isRequired,
<<<<<<< HEAD
    themeColor: PropTypes.string.isRequired,
=======
    toggleSidebar: PropTypes.func.isRequired,
    themeColor: PropTypes.string.isRequired,
    isMobile: PropTypes.bool.isRequired,
>>>>>>> f81c650 (Initial commit)
};

export default Sidebar;
