import PropTypes from "prop-types";
import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, logoutUser } from "../features/auth/state/authSlice";
import axiosClient from "../api/axiosClient";
import {
    AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Avatar,
    ListItemIcon, List, ListItem, Collapse, useMediaQuery,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    Snackbar, Alert
} from "@mui/material";
import { Menu as MenuIcon, Palette, Settings, ExpandMore, ExpandLess, Visibility, VisibilityOff } from "@mui/icons-material";
import FollowUpReminderBell from "../features/crm/components/FollowUpReminderBell";
import "./Navbar.css";

const Navbar = ({ toggleSidebar, colorMode, toggleColorMode }) => {
    const [profileAnchorEl, setProfileAnchorEl] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
    const [resetPasswordData, setResetPasswordData] = useState({
        email: "",
        password: "",
        password_confirmation: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const user = useSelector((state) => state.auth.user);
    const organisation = useSelector((state) => state.orgs?.organisation);
    const companies = useSelector((state) => state.companies?.companies || []);
    const brandName = companies[0]?.company_name || organisation?.name || "";

    const handleProfileMenuOpen = useCallback((event) => {
        setProfileAnchorEl(event.currentTarget);
    }, []);

    const handleProfileMenuClose = useCallback(() => {
        setProfileAnchorEl(null);
    }, []);

    const handleLogout = async () => {
        try {
            await dispatch(logoutUser()).unwrap();
        } catch {
            dispatch(logout());
        } finally {
            navigate("/");
            handleProfileMenuClose();
        }
    };

    const handleResetPasswordOpen = () => {
        setResetPasswordData({ email: user?.email || "", password: "", password_confirmation: "" });
        setResetPasswordOpen(true);
    };

    const handleResetPasswordClose = () => {
        setResetPasswordOpen(false);
    };

    const handleResetPasswordSubmit = async () => {
        try {
            const response = await axiosClient.post("/reset-password", resetPasswordData);
            setSnackbarMessage(response.data.message || "Password reset successful.");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
            setResetPasswordOpen(false);
        } catch {
            setSnackbarMessage("Failed to reset password. Please try again.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setResetPasswordData((prev) => ({ ...prev, [name]: value }));
    };

    const toggleShowPassword = () => setShowPassword((prev) => !prev);
    const toggleShowConfirmPassword = () => setShowConfirmPassword((prev) => !prev);

    const changeTheme = useCallback((mode) => {
        if (mode !== colorMode) {
            toggleColorMode();
        }
        handleProfileMenuClose();
    }, [colorMode, toggleColorMode, handleProfileMenuClose]);


    const isMobile = useMediaQuery("(max-width:600px)");

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    return (
        <>
            <AppBar position="static" className="app-navbar" elevation={0}>
                <Toolbar>
                    {isMobile && (
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={toggleSidebar}
                            className="app-navbar__menu-button"
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    {/* <div className="app-navbar__brand-block">
                        <Typography variant="subtitle1" component="div" className="app-navbar__brand-title" noWrap>
                            {brandName}
                        </Typography>
                        <Typography variant="caption" component="div" className="app-navbar__brand-subtitle" noWrap>
                            Financial Workspace
                        </Typography>
                    </div> */}

                    <div className="app-navbar__spacer" />

                    {/* Follow-up Reminders — visible on every page, not just Lead List */}
                    <FollowUpReminderBell />

                    {/* Profile Avatar */}
                    <IconButton onClick={handleProfileMenuOpen} className="app-navbar__avatar-button">
                        <Avatar alt={user?.name || "User"} src="/profile.jpg" />
                    </IconButton>

                    {/* Profile Menu */}
                    <Menu anchorEl={profileAnchorEl} open={Boolean(profileAnchorEl)} onClose={handleProfileMenuClose}>
                        <MenuItem disabled>
                            <Typography variant="body1">
                                Welcome to, <strong>{user?.name || "User"}</strong>
                            </Typography>
                        </MenuItem>
                        <MenuItem onClick={handleResetPasswordOpen}>Reset Password</MenuItem>
                        <MenuItem onClick={handleProfileMenuClose}>Profile</MenuItem>
                        <MenuItem onClick={handleLogout}>Logout</MenuItem>

                        {/* Theme Change Menu */}
                        <MenuItem onClick={() => setSettingsOpen(!settingsOpen)}>
                            <ListItemIcon><Settings /></ListItemIcon>
                            Appearance {settingsOpen ? <ExpandLess /> : <ExpandMore />}
                        </MenuItem>

                        {/* Mode Selection Dropdown */}
                        <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem component="button" onClick={() => changeTheme("light")}>
                                    <ListItemIcon><Palette /></ListItemIcon> Light Mode
                                </ListItem>
                                <ListItem component="button" onClick={() => changeTheme("dark")}>
                                    <ListItemIcon><Palette /></ListItemIcon> Dark Mode
                                </ListItem>
                            </List>
                        </Collapse>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Reset Password Dialog */}
            <Dialog open={resetPasswordOpen} onClose={handleResetPasswordClose}>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        label="Email"
                        type="email"
                        name="email"
                        fullWidth
                        value={resetPasswordData.email}
                        onChange={handleInputChange}
                    />
                    <TextField
                        margin="dense"
                        label="New Password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        fullWidth
                        value={resetPasswordData.password}
                        onChange={handleInputChange}
                        InputProps={{
                            endAdornment: (
                                <IconButton onClick={toggleShowPassword}>
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            ),
                        }}
                    />
                    <TextField
                        margin="dense"
                        label="Confirm Password"
                        type={showConfirmPassword ? "text" : "password"}
                        name="password_confirmation"
                        fullWidth
                        value={resetPasswordData.password_confirmation}
                        onChange={handleInputChange}
                        InputProps={{
                            endAdornment: (
                                <IconButton onClick={toggleShowConfirmPassword}>
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            ),
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleResetPasswordClose}>Cancel</Button>
                    <Button onClick={handleResetPasswordSubmit} color="primary">Submit</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} className="app-navbar__snackbar">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

Navbar.propTypes = {
    toggleSidebar: PropTypes.func.isRequired,
    colorMode: PropTypes.oneOf(["light", "dark"]).isRequired,
    toggleColorMode: PropTypes.func.isRequired,
};

export default Navbar;