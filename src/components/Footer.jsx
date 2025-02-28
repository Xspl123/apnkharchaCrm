import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";

const Footer = ({ themeColor }) => {
    return (
        <Box
            component="footer"
            sx={{
                width: "100%",
                position: "fixed",
                bottom: 0,
                left: 0,
                backgroundColor: themeColor,
                color: "#fff",
                textAlign: "center",
                padding: "10px 0",
            }}
        >
            <Typography variant="body2">© 2025 Expense Tracker. All Rights Reserved.</Typography>
        </Box>
    );
};

// ✅ Add PropTypes for `themeColor`
Footer.propTypes = {
    themeColor: PropTypes.string.isRequired,
};

export default Footer;
