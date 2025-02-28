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
import { PersonAdd } from "@mui/icons-material"; // User Icon

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await dispatch(registerUser({ name, email, password })).unwrap();
            console.log("Registration Response:", res);

            if (res?.token) {
                localStorage.setItem("token", res.token);
                navigate("/dashboard");
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
                            {error}
                        </Alert>
                    )}

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
                            disabled={loading || !name || !email || !password}
                            style={{ marginTop: "16px" }}
                        >
                            {loading ? <CircularProgress size={24} /> : "Register"}
                        </Button>
                    </form>

                    {/* Login Link */}
                    <Typography variant="body2" align="center" style={{ marginTop: "16px" }}>
                        Already have an account? <Link to="/login" style={{ textDecoration: "none", color: "#764ba2", fontWeight: "bold" }}>Login</Link>
                    </Typography>
                </Paper>
            </Container>
        </Grid>
    );
};

export default Register;
