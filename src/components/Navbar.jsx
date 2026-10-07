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
    Snackbar, Alert, Breadcrumbs, Link, useTheme, Box, CircularProgress,
    Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
    TablePagination, Autocomplete
} from "@mui/material";
import { Menu as MenuIcon, Palette, Settings, ExpandMore, ExpandLess, Visibility, VisibilityOff, ChevronRight, DashboardOutlined, History as HistoryIcon } from "@mui/icons-material";
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
    const [loginHistoryOpen, setLoginHistoryOpen] = useState(false);
    const [loginHistory, setLoginHistory] = useState([]);
    const [loginHistoryUsers, setLoginHistoryUsers] = useState([]);
    const [loginHistoryUserId, setLoginHistoryUserId] = useState("");
    const [loginHistoryPage, setLoginHistoryPage] = useState(0);
    const [loginHistoryRowsPerPage, setLoginHistoryRowsPerPage] = useState(25);
    const [loginHistoryTotal, setLoginHistoryTotal] = useState(0);
    const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
    const [loginHistoryError, setLoginHistoryError] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    const user = useSelector((state) => state.auth.user);
    const isSuperAdmin = user?.role?.name === "super_admin";
    const organisation = useSelector((state) => state.orgs?.organisation);
    const companies = useSelector((state) => state.companies?.companies || []);
    const brandName = companies[0]?.company_name || organisation?.name || "";
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const breadcrumbs = getBreadcrumbs(location.pathname, location.state);
    const matchedRoute = getMatchedRoute(location.pathname);
    const visibleBreadcrumbs = isMobile ? breadcrumbs.slice(-1) : breadcrumbs;
    const selectedLoginHistoryUser = loginHistoryUsers.find(
        (historyUser) => String(historyUser.id) === String(loginHistoryUserId)
    );

    const handleProfileMenuOpen = useCallback((event) => {
        setProfileAnchorEl(event.currentTarget);
    }, []);

    const handleProfileMenuClose = useCallback(() => {
        setProfileAnchorEl(null);
    }, []);

    const handleLogout = () => {
        // Start the server request while the current token is still available,
        // then clear local auth and leave the protected route immediately.
        // Waiting for the request can leave the app on a blank/stale screen.
        void dispatch(logoutUser());
        dispatch(logout());
        handleProfileMenuClose();
        navigate("/", { replace: true });
    };

    const loadLoginHistory = async (userId = "", page = 0, rowsPerPage = loginHistoryRowsPerPage) => {
        setLoginHistoryLoading(true);
        setLoginHistoryError("");
        try {
            const params = { page: page + 1, per_page: rowsPerPage };
            if (userId) params.user_id = userId;
            const response = isSuperAdmin
                ? await axiosClient.get("/super-admin/login-history", { params })
                : await axiosClient.get("/login-history", { params });
            setLoginHistory(response.data?.data || []);
            setLoginHistoryTotal(response.data?.pagination?.total ?? response.data?.total ?? 0);
        } catch {
            setLoginHistoryError("Could not load login history. Please try again.");
        } finally {
            setLoginHistoryLoading(false);
        }
    };

    const handleLoginHistoryOpen = async () => {
        handleProfileMenuClose();
        setLoginHistoryOpen(true);
        setLoginHistoryUserId("");
        setLoginHistoryPage(0);
        let usersLoadError = "";
        if (isSuperAdmin) {
            try {
                const response = await axiosClient.get("/super-admin/users");
                setLoginHistoryUsers(response.data?.data || []);
            } catch {
                setLoginHistoryUsers([]);
                usersLoadError = "Could not load the user list.";
            }
        }
        await loadLoginHistory("", 0);
        if (usersLoadError) setLoginHistoryError(usersLoadError);
    };

    const handleLoginHistoryUserChange = (userId) => {
        setLoginHistoryUserId(userId);
        setLoginHistoryPage(0);
        void loadLoginHistory(userId, 0);
    };

    const handleLoginHistoryPageChange = (_, page) => {
        setLoginHistoryPage(page);
        void loadLoginHistory(loginHistoryUserId, page);
    };

    const handleLoginHistoryRowsPerPageChange = (event) => {
        const rowsPerPage = Number(event.target.value);
        setLoginHistoryRowsPerPage(rowsPerPage);
        setLoginHistoryPage(0);
        void loadLoginHistory(loginHistoryUserId, 0, rowsPerPage);
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
                    "--navbar-breadcrumb": "#ffffff",
                    "--navbar-breadcrumb-current": "#ffffff",
                    "--navbar-separator": "rgba(255, 255, 255, 0.72)",
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
                        <MenuItem onClick={handleLoginHistoryOpen}>
                            <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
                            Login History
                        </MenuItem>
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

            <Dialog
                open={loginHistoryOpen}
                onClose={() => setLoginHistoryOpen(false)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>Login History</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {isSuperAdmin
                            ? "Recent sign-ins across all user accounts."
                            : `Recent sign-ins for ${user?.name || "your account"}${user?.email ? ` (${user.email})` : ""}.`}{" "}
                        Location is estimated from the IP address and may be inaccurate.
                    </Typography>
                    {isSuperAdmin && (
                        <Autocomplete
                            options={loginHistoryUsers}
                            value={selectedLoginHistoryUser || null}
                            onChange={(_, historyUser) => handleLoginHistoryUserChange(historyUser?.id ? String(historyUser.id) : "")}
                            getOptionLabel={(historyUser) => `${historyUser.name || "User"} (${historyUser.email || "no email"})`}
                            isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                            renderOption={(props, historyUser) => (
                                <li {...props} key={historyUser.id}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>
                                            {historyUser.name || "User"} ({historyUser.email || "no email"})
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {historyUser.last_login_history?.logged_in_at
                                                ? `Last login: ${new Date(historyUser.last_login_history.logged_in_at).toLocaleString()} · ${historyUser.last_login_history.device_name || "Unknown device"}`
                                                : "No login history yet"}
                                        </Typography>
                                    </Box>
                                </li>
                            )}
                            renderInput={(params) => <TextField {...params} label="Search user" placeholder="Name or email" size="small" />}
                            sx={{ mb: 2 }}
                        />
                    )}
                    {isSuperAdmin && selectedLoginHistoryUser && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <strong>Last login:</strong>{" "}
                            {selectedLoginHistoryUser.last_login_history?.logged_in_at
                                ? `${new Date(selectedLoginHistoryUser.last_login_history.logged_in_at).toLocaleString()} · ${selectedLoginHistoryUser.last_login_history.device_name || "Unknown device"}`
                                : "No login history available for this user."}
                        </Alert>
                    )}
                    {loginHistoryError && <Alert severity="error" sx={{ mb: 2 }}>{loginHistoryError}</Alert>}
                    {loginHistoryLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                            <CircularProgress size={28} />
                        </Box>
                    ) : (
                        <TableContainer sx={{ maxHeight: 420, border: 1, borderColor: "divider", borderRadius: 2 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        {[...(isSuperAdmin ? ["User"] : []), "Date and time", "Device", "IP address", "Approx. location"].map((heading) => (
                                            <TableCell key={heading} sx={{ fontWeight: 700, bgcolor: "background.default", color: "text.primary" }}>
                                                {heading}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loginHistory.map((entry) => (
                                        <TableRow key={entry.id} hover>
                                            {isSuperAdmin && (
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={700}>{entry.user?.name || "Deleted user"}</Typography>
                                                    {entry.user?.email && <Typography variant="caption" color="text.secondary">{entry.user.email}</Typography>}
                                                </TableCell>
                                            )}
                                            <TableCell>{entry.logged_in_at ? new Date(entry.logged_in_at).toLocaleString() : "—"}</TableCell>
                                            <TableCell>{entry.device_name || "Unknown device"}</TableCell>
                                            <TableCell>{entry.ip_address || "Unavailable"}</TableCell>
                                            <TableCell>
                                                {[entry.city, entry.region, entry.country].filter(Boolean).join(", ") || "Unavailable"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {loginHistory.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={isSuperAdmin ? 5 : 4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                                No login history available yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                    {!loginHistoryLoading && (
                        <TablePagination
                            component="div"
                            count={loginHistoryTotal}
                            page={loginHistoryPage}
                            onPageChange={handleLoginHistoryPageChange}
                            rowsPerPage={loginHistoryRowsPerPage}
                            onRowsPerPageChange={handleLoginHistoryRowsPerPageChange}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            sx={{ borderTop: 1, borderColor: "divider" }}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setLoginHistoryOpen(false)} sx={{ textTransform: "none" }}>Close</Button>
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
