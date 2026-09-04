import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import "./Footer.css";

const Footer = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    return (
        <Box
            component="footer"
            className="app-footer"
            style={{
                "--footer-left": isMobile ? "0" : "auto",
                "--footer-border": theme.palette.divider,
                "--footer-bg":
                    theme.palette.mode === "dark"
                        ? "rgba(15, 23, 42, 0.88)"
                        : "rgba(255, 255, 255, 0.84)",
            }}
        >
            <Typography variant="body2" color="text.secondary">
                © 2025 Expense Tracker. All Rights Reserved.
            </Typography>
        </Box>
    );
};

export default Footer;
