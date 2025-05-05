import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../redux/features/authSlice";
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
<<<<<<< HEAD
import { PersonAdd } from "@mui/icons-material"; // User Icon

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
=======
import { AccountBalanceWallet } from "@mui/icons-material"; // Expense Icon

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
>>>>>>> f81c650 (Initial commit)
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
<<<<<<< HEAD
        try {
            const res = await dispatch(registerUser({ name, email, password })).unwrap();
            console.log("Registration Response:", res);

            if (res?.token) {
                localStorage.setItem("token", res.token);
                navigate("/dashboard");
=======
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        try {
            const res = await dispatch(registerUser({ email, password })).unwrap();
            console.log("Register Response:", res);

            if (res?.success) {
                navigate("/login");
            } else {
                console.error("Registration failed!");
>>>>>>> f81c650 (Initial commit)
            }
        } catch (err) {
            console.error("Registration failed:", err);
        }
    };

    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{
                minHeight: "100vh",
<<<<<<< HEAD
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                padding: "20px"
            }}
        >
            <Container component="main" maxWidth="xs">
                <Paper elevation={6} style={{ padding: "32px", borderRadius: "12px", textAlign: "center" }}>
                    {/* Icon & Welcome Heading */}
                    <PersonAdd style={{ fontSize: 50, color: "#764ba2", marginBottom: "10px" }} />
                    <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
                        Create an Account
                    </Typography>

                    {/* Error Message */}
                    {error && (
                        <Alert severity="error" style={{ marginBottom: "16px" }}>
=======
                background: "linear-gradient(45deg, #ff9a9e, #fad0c4, #fbc2eb, #a8e063, #f8ff00, #ff0000, #89cff0)", // Multicolor gradient
                backgroundSize: "400% 400%", // Smooth gradient animation
                animation: "gradientAnimation 10s ease infinite", // Infinite animation in all directions
                padding: "20px",
                overflow: "hidden", // Prevent vertical shifting
            }}
        >
            <Container
                component="main"
                maxWidth="xs"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    minHeight: "100vh", // Ensure full height on mobile
                }}
            >
                <Paper
                    elevation={10}
                    style={{
                        padding: "40px",
                        borderRadius: "16px",
                        textAlign: "center",
                        margin: "auto", // Center the form
                        background: "rgba(255, 255, 255, 0.95)", // Slightly more opaque background
                        boxShadow: "0px 6px 30px rgba(0, 0, 0, 0.3)", // Enhanced shadow
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
                            animation: "bounce 2s infinite", // Subtle bounce animation
                        }}
                    />
                    <Typography
                        variant="h4"
                        fontWeight="bold"
                        gutterBottom
                        style={{
                            color: "#333",
                            fontFamily: "'Roboto', sans-serif",
                        }}
                    >
                        Create an Account
                    </Typography>
                    <Typography
                        variant="body1"
                        style={{
                            color: "#555",
                            marginBottom: "20px",
                        }}
                    >
                        Please register to continue
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
>>>>>>> f81c650 (Initial commit)
                            {error}
                        </Alert>
                    )}

<<<<<<< HEAD
                    {/* Registration Form */}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Full Name"
                            type="text"
                            variant="outlined"
                            fullWidth
                            required
                            margin="normal"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <TextField
                            label="Email"
=======
                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Email Address"
>>>>>>> f81c650 (Initial commit)
                            type="email"
                            variant="outlined"
                            fullWidth
                            required
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
<<<<<<< HEAD
=======
                            InputProps={{
                                style: { fontSize: "16px" },
                            }}
                            InputLabelProps={{
                                style: { fontSize: "14px" },
                            }}
>>>>>>> f81c650 (Initial commit)
                        />
                        <TextField
                            label="Password"
                            type="password"
                            variant="outlined"
                            fullWidth
                            required
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
<<<<<<< HEAD
=======
                            InputProps={{
                                style: { fontSize: "16px" },
                            }}
                            InputLabelProps={{
                                style: { fontSize: "14px" },
                            }}
                        />
                        <TextField
                            label="Confirm Password"
                            type="password"
                            variant="outlined"
                            fullWidth
                            required
                            margin="normal"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            InputProps={{
                                style: { fontSize: "16px" },
                            }}
                            InputLabelProps={{
                                style: { fontSize: "14px" },
                            }}
>>>>>>> f81c650 (Initial commit)
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
<<<<<<< HEAD
                            disabled={loading || !name || !email || !password}
                            style={{ marginTop: "16px" }}
                        >
                            {loading ? <CircularProgress size={24} /> : "Register"}
                        </Button>
                    </form>

                    {/* Login Link */}
                    <Typography variant="body2" align="center" style={{ marginTop: "16px" }}>
                        Already have an account? <Link to="/login" style={{ textDecoration: "none", color: "#764ba2", fontWeight: "bold" }}>Login</Link>
=======
                            disabled={loading || !email || !password || !confirmPassword}
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
                                "Register"
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
                        Already have an account?{" "}
                        <Link
                            to="/login"
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
                            Login
                        </Link>
>>>>>>> f81c650 (Initial commit)
                    </Typography>
                </Paper>
            </Container>
        </Grid>
    );
};

<<<<<<< HEAD
=======
// Add CSS for gradient animation and transparent scrollbar
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
`;
document.head.appendChild(styles);

>>>>>>> f81c650 (Initial commit)
export default Register;
