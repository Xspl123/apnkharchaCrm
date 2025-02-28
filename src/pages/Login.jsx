import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/features/authSlice";
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
import { AccountBalanceWallet } from "@mui/icons-material"; // Expense Icon

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error, token } = useSelector((state) => state.auth);

    useEffect(() => {
        console.log("Redux Store:", { loading, error, token });
    }, [loading, error, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await dispatch(loginUser({ email, password })).unwrap();
            console.log("Login Response:", res);

            if (res?.token) {
                localStorage.setItem("token", res.token);
                navigate("/dashboard");
            } else {
                console.error("No token received, login failed!");
            }
        } catch (err) {
            console.error("Login failed:", err);
        }
    };

    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #667eea, #764ba2)", // Gradient Background
                padding: "20px"
            }}
        >
            <Container component="main" maxWidth="xs">
                <Paper elevation={6} style={{ padding: "32px", borderRadius: "12px", textAlign: "center" }}>
                    <AccountBalanceWallet style={{ fontSize: 50, color: "#764ba2", marginBottom: "10px" }} />
                    <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
                        Welcome to Expense Tracker
                    </Typography>

                    {error && (
                        <Alert severity="error" style={{ marginBottom: "16px" }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Email"
                            type="email"
                            variant="outlined"
                            fullWidth
                            required
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={loading || !email || !password}
                            style={{ marginTop: "16px" }}
                        >
                            {loading ? <CircularProgress size={24} /> : "Login"}
                        </Button>
                    </form>

                    {/* Register Link */}
                    <Typography variant="body2" align="center" style={{ marginTop: "16px" }}>
                        Don't have an account? <Link to="/register" style={{ textDecoration: "none", color: "#764ba2", fontWeight: "bold" }}>Register</Link>
                    </Typography>
                </Paper>
            </Container>
        </Grid>
    );
};

export default Login;
