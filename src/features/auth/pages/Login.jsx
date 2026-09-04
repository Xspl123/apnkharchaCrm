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
    Grid
} from "@mui/material";
import { AccountBalanceWallet, Visibility, VisibilityOff } from "@mui/icons-material";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await dispatch(loginUser({ email, password })).unwrap();
            if (res) {
                navigate("/dashboard");
            }
        } catch {
            return;
        }
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

                background: "linear-gradient(45deg, #ff9a9e, #fad0c4, #fbc2eb, #a8e063, #f8ff00, #ff0000, #89cff0)", // Multicolor gradient
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
                        background: "rgba(255, 255, 255, 0.95)",
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
                    <AccountBalanceWallet
                        style={{
                            fontSize: 60,
                            color: "#764ba2",
                            marginBottom: "20px",
                            animation: "bounce 2s infinite", 
                        }}
                    />
                    <Typography
                        variant="h4"
                        fontWeight="bold"
                        gutterBottom
                        style={{
                            color: "#333",
                            fontFamily: "'Pacifico', cursive",
                            textAlign: "center",
                            fontSize: "2em",
                            animation: "colorAnimation 5s infinite", 
                        }}
                    >
                        Kharcha
                    </Typography>
                    <Typography
                        variant="body1"
                        style={{
                            color: "#555",
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

                            InputProps={{
                                style: { fontSize: "16px" },
                                endAdornment: (
                                    <Button
                                        onClick={handleTogglePassword}
                                        style={{
                                            minWidth: "auto",
                                            padding: "0",
                                            marginLeft: "8px",
                                            color: "#764ba2",
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
                                background: "#764ba2",
                                transition: "background 0.3s ease",
                            }}
                            onMouseOver={(e) =>
                                (e.target.style.background = "#5a3d8a")
                            }
                            onMouseOut={(e) =>
                                (e.target.style.background = "#764ba2")
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
                            color: "#555",
                        }}
                    >
                        Don&apos;t have an account?{" "}
                        <Link
                            to="/register"
                            style={{
                                textDecoration: "none",
                                color: "#764ba2",
                                fontWeight: "bold",
                                transition: "color 0.3s ease",
                            }}
                            onMouseOver={(e) =>
                                (e.target.style.color = "#5a3d8a")
                            }
                            onMouseOut={(e) =>
                                (e.target.style.color = "#764ba2")
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
