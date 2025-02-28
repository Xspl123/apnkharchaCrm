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
import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 250;
const collapsedWidth = 70;

const Sidebar = ({ open, themeColor }) => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Drawer
            variant="permanent"
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
                ].map((menu) => {
                    const isActive = location.pathname === menu.path;

                    return (
                        <ListItem
                            button
                            key={menu.name}
                            onClick={() => navigate(menu.path)}
                            sx={{
                                backgroundColor: isActive ? "#FFD700" : "transparent", // ✅ Change color if active
                                color: isActive ? "#000" : "#fff", // ✅ Text color change
                                "&:hover": { backgroundColor: "#ffec80", color: "#000" }, // ✅ Hover effect
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
    themeColor: PropTypes.string.isRequired,
};

export default Sidebar;
