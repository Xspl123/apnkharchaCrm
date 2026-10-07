import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../state/authSlice";
import { useNavigate, Link } from "react-router-dom";
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    useTheme,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const getDeviceId = () => {
    const storageKey = "authDeviceId";
    let deviceId = localStorage.getItem(storageKey);
    if (!deviceId) {
        deviceId = globalThis.crypto?.randomUUID?.() ||
            `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(storageKey, deviceId);
    }
    return deviceId;
};

const Login = () => {
    const theme = useTheme();
    const inputSx = {
        "& .MuiOutlinedInput-root": {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            "& fieldset": { borderColor: theme.palette.divider },
            "&:hover fieldset": { borderColor: theme.palette.primary.main },
        },
        "& .MuiInputLabel-root": { color: theme.palette.text.secondary },
    };
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [sessionConflictOpen, setSessionConflictOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error } = useSelector((state) => state.auth);

    const performLogin = async (replaceExistingSession = false) => {
        try {
            const res = await dispatch(loginUser({
                email,
                password,
                deviceId: getDeviceId(),
                replaceExistingSession,
            })).unwrap();
            if (res) {
                navigate("/dashboard");
            }
        } catch (loginError) {
            if (loginError?.code === "active_session_exists") {
                setSessionConflictOpen(true);
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        void performLogin();
    };

    const handleTogglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{
                minHeight: "100vh",

                background: theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #0b1220, #111827 55%, #172554)"
                    : "linear-gradient(135deg, #eff6ff, #f5f3ff 55%, #f8fafc)",
                backgroundSize: "400% 400%",
                animation: "gradientAnimation 10s ease infinite",
                padding: "20px",
                overflow: "hidden",
            }}
        >
            <Container
                component="main"
                maxWidth="xs"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    minHeight: "100vh",
                }}
            >
                <Paper
                    elevation={10}
                    style={{
                        padding: "40px",
                        borderRadius: "16px",
                        textAlign: "center",
                        margin: "auto", 
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        boxShadow: "0px 6px 30px rgba(0, 0, 0, 0.3)",
                        transform: "scale(1)",
                        transition: "transform 0.3s ease",
                    }}
                    onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "scale(1.02)")
                    }
                    onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                    }
                >
                    <Box
                        component="img"
                        src="/pwa/icon-512.png"
                        alt="Kharcha logo"
                        sx={{
                            display: "block",
                            width: { xs: 56, sm: 64 },
                            height: { xs: 56, sm: 64 },
                            objectFit: "contain",
                            borderRadius: 2,
                            mx: "auto",
                            mb: 2,
                        }}
                    />
                    <Typography
                        variant="h4"
                        fontWeight="bold"
                        gutterBottom
                        style={{
                            color: theme.palette.text.primary,
                            fontFamily: "'Pacifico', cursive",
                            textAlign: "center",
                            fontSize: "2em",
                        }}
                    >
                        Kharcha
                    </Typography>
                    <Typography
                        variant="body1"
                        style={{
                            color: theme.palette.text.secondary,
                            marginBottom: "20px",
                        }}
                    >
                        Please login to continue
                    </Typography>

                    {error && (
                        <Alert
                            severity="error"
                            style={{
                                marginBottom: "16px",
                                fontSize: "14px",
                                fontWeight: "bold",
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Dialog
                        open={sessionConflictOpen}
                        onClose={() => !loading && setSessionConflictOpen(false)}
                        aria-labelledby="active-session-title"
                    >
                        <DialogTitle id="active-session-title">Account already signed in</DialogTitle>
                        <DialogContent>
                            <Typography>
                                This account is active on another device. Log out that device and continue signing in here?
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2 }}>
                            <Button
                                onClick={() => setSessionConflictOpen(false)}
                                disabled={loading}
                                sx={{ textTransform: "none" }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    setSessionConflictOpen(false);
                                    void performLogin(true);
                                }}
                                disabled={loading}
                                sx={{ textTransform: "none" }}
                            >
                                Log out other device
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <form onSubmit={handleSubmit}>
                        <TextField

                            label="Email Address"
                            type="email"
                            variant="outlined"
                            fullWidth
                            required
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={inputSx}

                            InputProps={{
                                style: { fontSize: "16px" },
                            }}
                            InputLabelProps={{
                                style: { fontSize: "14px" },
                            }}
                        />
                        <TextField
                            label="Password"
                            type={showPassword ? "text" : "password"} 
                            variant="outlined"
                            fullWidth
                            required
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={inputSx}

                            InputProps={{
                                style: { fontSize: "16px" },
                                endAdornment: (
                                    <Button
                                        onClick={handleTogglePassword}
                                        style={{
                                            minWidth: "auto",
                                            padding: "0",
                                            marginLeft: "8px",
                                            color: theme.palette.primary.main,
                                        }}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </Button>
                                ),
                            }}
                            InputLabelProps={{
                                style: { fontSize: "14px" },
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={loading || !email || !password}

                            style={{
                                marginTop: "20px",
                                padding: "12px",
                                fontSize: "16px",
                                fontWeight: "bold",
                                textTransform: "none",
                                background: theme.palette.primary.main,
                                transition: "background 0.3s ease",
                            }}
                            onMouseOver={(e) =>
                                (e.target.style.background = theme.palette.primary.dark)
                            }
                            onMouseOut={(e) =>
                                (e.target.style.background = theme.palette.primary.main)
                            }
                        >
                            {loading ? (
                                <CircularProgress size={24} />
                            ) : (
                                "Login"
                            )}
                        </Button>
                    </form>

                    <Typography
                        variant="body2"
                        align="center"
                        style={{
                            marginTop: "20px",
                            color: theme.palette.text.secondary,
                        }}
                    >
                        Don&apos;t have an account?{" "}
                        <Link
                            to="/register"
                            style={{
                                textDecoration: "none",
                                color: theme.palette.primary.main,
                                fontWeight: "bold",
                                transition: "color 0.3s ease",
                            }}
                            onMouseOver={(e) =>
                                (e.target.style.color = theme.palette.primary.dark)
                            }
                            onMouseOut={(e) =>
                                (e.target.style.color = theme.palette.primary.main)
                            }
                        >
                            Register
                        </Link>
                    </Typography>
                </Paper>
            </Container>
        </Grid>
    );
};

const styles = document.createElement("style");
styles.innerHTML = `
    @keyframes gradientAnimation {
        0% { background-position: 0% 0%; }
        25% { background-position: 50% 0%; }
        50% { background-position: 100% 50%; }
        75% { background-position: 50% 100%; }
        100% { background-position: 0% 0%; }
    }

    /* Transparent scrollbar styling */
    ::-webkit-scrollbar {
        width: 8px;
    }
    ::-webkit-scrollbar-track {
        background: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.5);
    }

    @keyframes colorAnimation {
        0% { color: #ff9a9e; }
        25% { color: #fad0c4; }
        50% { color: #fbc2eb; }
        75% { color: #a8e063; }
        100% { color: #ff9a9e; }
    }
`;
document.head.appendChild(styles);

export default Login;
