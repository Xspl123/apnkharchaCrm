import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../state/authSlice";
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
  Grid,
  InputAdornment,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";

const Register = () => {
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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await dispatch(
        registerUser({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          userType: "personal",
          plan: "free",
        })
      ).unwrap();

      if (res?.message === "OTP sent to your email") {
        navigate("/verify-otp", {
          state: { email: form.email, userType: "personal", plan: "free" },
        });
      }
    } catch {
      return;
    }
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
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
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
            Create your account to continue
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
              label="Full Name"
              name="name"
              variant="outlined"
              fullWidth
              required
              margin="normal"
              value={form.name}
              onChange={handleChange}
              sx={inputSx}
              InputProps={{
                style: { fontSize: "16px" },
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                style: { fontSize: "14px" },
              }}
            />

            <TextField
              label="Email Address"
              name="email"
              type="email"
              variant="outlined"
              fullWidth
              required
              margin="normal"
              value={form.email}
              onChange={handleChange}
              sx={inputSx}
              InputProps={{
                style: { fontSize: "16px" },
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                style: { fontSize: "14px" },
              }}
            />

            <TextField
              label="Phone Number"
              name="phone"
              type="tel"
              variant="outlined"
              fullWidth
              margin="normal"
              value={form.phone}
              onChange={handleChange}
              sx={inputSx}
              InputProps={{
                style: { fontSize: "16px" },
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                style: { fontSize: "14px" },
              }}
            />

            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              required
              margin="normal"
              value={form.password}
              onChange={handleChange}
              sx={inputSx}
              InputProps={{
                style: { fontSize: "16px" },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                      sx={{ color: theme.palette.primary.main }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
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
              disabled={loading || !form.name || !form.email || !form.password}
              style={{
                marginTop: "20px",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                textTransform: "none",
                background: theme.palette.primary.main,
                transition: "background 0.3s ease",
              }}
              onMouseOver={(e) => (e.target.style.background = theme.palette.primary.dark)}
              onMouseOut={(e) => (e.target.style.background = theme.palette.primary.main)}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Register"}
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
            Already have an account?{" "}
            <Link
              to="/"
              style={{
                textDecoration: "none",
                color: theme.palette.primary.main,
                fontWeight: "bold",
                transition: "color 0.3s ease",
              }}
            >
              Login
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

    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
    }

    @keyframes colorAnimation {
        0% { color: #764ba2; }
        50% { color: #ff6b6b; }
        100% { color: #764ba2; }
    }
`;

if (!document.head.querySelector('style[data-register-page="true"]')) {
  styles.setAttribute("data-register-page", "true");
  document.head.appendChild(styles);
}

export default Register;
