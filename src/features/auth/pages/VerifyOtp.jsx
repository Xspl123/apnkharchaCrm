import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { verifyOtp } from "../state/authSlice";
import { useNavigate, useLocation } from "react-router-dom";
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

const VerifyOtp = () => {
    const [otp, setOtp] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from location state
    const email = location.state?.email;
    
    const { loading, error, token } = useSelector((state) => state.auth);

    // Redirect to register if no email
    useEffect(() => {
        if (!email) {
            navigate("/register");
        }
    }, [email, navigate]);

    // Redirect to dashboard on successful verification
    useEffect(() => {
        if (token) {
            navigate("/dashboard");
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) {
            alert("Session expired. Please register again.");
            navigate("/register");
            return;
        }

        if (otp.length !== 6) {
            alert("Please enter a valid 6-digit OTP");
            return;
        }

        try {
            await dispatch(verifyOtp({ email, otp })).unwrap();
            // Navigation will happen via useEffect when token is set
        } catch {
            return;
        }
    };

    // If no email, show nothing (will redirect via useEffect)
    if (!email) {
        return null;
    }

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
                    <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
                        Verify OTP
                    </Typography>
                    
                    <Typography variant="body2" style={{ marginBottom: "20px" }}>
                        Enter the 6-digit code sent to<br />
                        <strong style={{ color: "#764ba2" }}>{email}</strong>
                    </Typography>

                    {error && (
                        <Alert severity="error" style={{ marginBottom: "16px" }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Enter 6 Digit OTP"
                            fullWidth
                            required
                            value={otp}
                            onChange={(e) => {
                                // Only allow numbers
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setOtp(value);
                            }}
                            inputProps={{ 
                                maxLength: 6,
                                style: { 
                                    textAlign: 'center', 
                                    fontSize: '1.5rem', 
                                    letterSpacing: '0.5rem',
                                    fontWeight: 'bold'
                                }
                            }}
                            variant="outlined"
                            margin="normal"
                            autoFocus
                            disabled={loading}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            style={{ 
                                marginTop: "16px",
                                background: "linear-gradient(135deg, #667eea, #764ba2)"
                            }}
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Verify OTP"}
                        </Button>

                        <Button
                            fullWidth
                            variant="text"
                            onClick={() => navigate("/register")}
                            style={{ marginTop: "8px" }}
                            disabled={loading}
                        >
                            Back to Register
                        </Button>
                    </form>
                </Paper>
            </Container>
        </Grid>
    );
};

export default VerifyOtp;
