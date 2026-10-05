import PropTypes from "prop-types";
import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { logout, logoutUser } from "../features/auth/state/authSlice";
import axiosClient from "../api/axiosClient";
import {
    AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Avatar,
    ListItemIcon, List, ListItem, Collapse, useMediaQuery,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    Snackbar, Alert, Breadcrumbs, Link, useTheme
} from "@mui/material";
import { Menu as MenuIcon, Palette, Settings, ExpandMore, ExpandLess, Visibility, VisibilityOff, ChevronRight, DashboardOutlined } from "@mui/icons-material";
import FollowUpReminderBell from "../features/crm/components/FollowUpReminderBell";
import { getBreadcrumbs, getMatchedRoute } from "../config/appRoutes";
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
    const location = useLocation();
    const theme = useTheme();

    const user = useSelector((state) => state.auth.user);
    const organisation = useSelector((state) => state.orgs?.organisation);
    const companies = useSelector((state) => state.companies?.companies || []);
    const brandName = companies[0]?.company_name || organisation?.name || "";
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const breadcrumbs = getBreadcrumbs(location.pathname, location.state);
    const matchedRoute = getMatchedRoute(location.pathname);
    const visibleBreadcrumbs = isMobile ? breadcrumbs.slice(-1) : breadcrumbs;

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


    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    return (
        <>
            <AppBar
                position="static"
                className="app-navbar"
                elevation={0}
                style={{
                    "--navbar-bg": theme.palette.background.paper,
                    "--navbar-border": theme.palette.divider,
                    "--navbar-text": theme.palette.text.primary,
                    "--navbar-subtext": theme.palette.text.secondary,
                    "--navbar-breadcrumb": theme.palette.mode === "dark"
                        ? "#ffffff"
                        : theme.palette.text.secondary,
                    "--navbar-breadcrumb-current": theme.palette.mode === "dark"
                        ? "#ffffff"
                        : theme.palette.text.primary,
                    "--navbar-separator": theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.72)"
                        : theme.palette.text.secondary,
                    "--navbar-accent": theme.palette.primary.main,
                    "--navbar-secondary": theme.palette.secondary.main,
                    "--navbar-shadow": theme.palette.mode === "dark"
                        ? "0 4px 18px rgba(0, 0, 0, 0.2)"
                        : "0 4px 18px rgba(15, 23, 42, 0.045)",
                }}
            >
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
                    <div className="app-navbar__page-identity">
                        <div className="app-navbar__page-icon">
                            {matchedRoute?.icon || <DashboardOutlined />}
                        </div>
                        <div className="app-navbar__page-copy">
                            <Typography variant="caption" className="app-navbar__workspace" noWrap>
                                {brandName || "WORKSPACE"}
                            </Typography>
                            <Breadcrumbs
                                aria-label="Breadcrumb"
                                className="app-navbar__breadcrumbs"
                                separator={<ChevronRight fontSize="small" />}
                            >
                                {visibleBreadcrumbs.length > 0 ? visibleBreadcrumbs.map((item, index) => (
                                    item.href && !item.current ? (
                                        <Link
                                            key={`${item.label}-${index}`}
                                            component={RouterLink}
                                            to={item.href}
                                            underline="hover"
                                            color="inherit"
                                            variant="body2"
                                        >
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <Typography
                                            key={`${item.label}-${index}`}
                                            variant="body2"
                                            aria-current={item.current ? "page" : undefined}
                                            className={item.current ? "app-navbar__breadcrumb-current" : "app-navbar__breadcrumb-parent"}
                                            noWrap
                                        >
                                            {item.label}
                                        </Typography>
                                    )
                                )) : (
                                    <Typography variant="body2" className="app-navbar__breadcrumb-current">
                                        Workspace
                                    </Typography>
                                )}
                            </Breadcrumbs>
                        </div>
                    </div>

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
