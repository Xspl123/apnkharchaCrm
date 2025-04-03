import PropTypes from "prop-types";
import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../redux/features/authSlice";
import axiosClient from "../api/axiosClient"; 

import { 
    AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Avatar, 
    ListItemIcon, List, ListItem, Collapse 
} from "@mui/material";
import { Menu as MenuIcon, Palette, Settings, ExpandMore, ExpandLess } from "@mui/icons-material";

const Navbar = ({ toggleSidebar, themeColor, setThemeColor }) => {
    const [profileAnchorEl, setProfileAnchorEl] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Get user data from Redux
    const user = useSelector((state) => state.auth.user);

    // Update current user every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentUser(user);
        }, 1000);

        return () => clearInterval(interval);
    }, [user]);

    const handleProfileMenuOpen = useCallback((event) => {
        setProfileAnchorEl(event.currentTarget);
    }, []);

    const handleProfileMenuClose = useCallback(() => {
        setProfileAnchorEl(null);
    }, []);

    const handleLogout = async () => {
        try {
            await axiosClient.post("/logout");

            dispatch(logout());
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            handleProfileMenuClose();
        }
    };

    const changeTheme = useCallback((color) => {
        setThemeColor(color);
        handleProfileMenuClose();
    }, [setThemeColor, handleProfileMenuClose]);

    return (
        <AppBar position="static" sx={{ backgroundColor: themeColor, color: "#fff" }}>
            <Toolbar>
                <IconButton color="inherit" edge="start" onClick={toggleSidebar} sx={{ marginRight: 2 }}>
                    <MenuIcon />
                </IconButton>

                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Admin Dashboard
                </Typography>

                {/* Profile Avatar */}
                <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
                    <Avatar alt={currentUser?.name || "User"} src="/profile.jpg" />
                </IconButton>

                {/* Profile Menu */}
                <Menu anchorEl={profileAnchorEl} open={Boolean(profileAnchorEl)} onClose={handleProfileMenuClose}>
                    <MenuItem disabled>
                        <Typography variant="body1">
                            Welcome to, <strong>{currentUser?.name || "User"}</strong>
                        </Typography>
                    </MenuItem>
                    <MenuItem onClick={handleProfileMenuClose}>Reset Password</MenuItem>
                    <MenuItem onClick={handleProfileMenuClose}>Profile</MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>

                    {/* Theme Change Menu */}
                    <MenuItem onClick={() => setSettingsOpen(!settingsOpen)}>
                        <ListItemIcon><Settings /></ListItemIcon>
                        Theme Colors {settingsOpen ? <ExpandLess /> : <ExpandMore />}
                    </MenuItem>

                    {/* Color Selection Dropdown */}
                    <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            <ListItem component="button" onClick={() => changeTheme("#1E1E2F")}>
                                <ListItemIcon><Palette /></ListItemIcon> Dark Blue
                            </ListItem>
                            <ListItem component="button" onClick={() => changeTheme("#333333")}>
                                <ListItemIcon><Palette /></ListItemIcon> Black
                            </ListItem>
                            <ListItem component="button" onClick={() => changeTheme("#0F4C75")}>
                                <ListItemIcon><Palette /></ListItemIcon> Navy Blue
                            </ListItem>
                            <ListItem component="button" onClick={() => changeTheme("#512DA8")}>
                                <ListItemIcon><Palette /></ListItemIcon> Purple
                            </ListItem>
                        </List>
                    </Collapse>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};

Navbar.propTypes = {
    toggleSidebar: PropTypes.func.isRequired,
    themeColor: PropTypes.string.isRequired,
    setThemeColor: PropTypes.func.isRequired,
};

export default Navbar;
