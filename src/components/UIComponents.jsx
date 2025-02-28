import PropTypes from "prop-types";
import {
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    Snackbar,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
    Collapse,
    Container,
} from "@mui/material";
import {
    Home,
    Category,
    AccountBalance,
    AttachMoney,
    ExpandLess,
    ExpandMore,
    Person,
    AddCircle,
    ListAlt,
    PieChart
} from "@mui/icons-material";

// ✅ Reusable TextField Component
export const CustomTextField = ({ label, value, onChange }) => (
    <TextField
        fullWidth
        label={label}
        variant="outlined"
        value={value}
        onChange={onChange}
        sx={{ mb: 2 }}
    />
);

CustomTextField.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

// ✅ Reusable Select Component
export const CustomSelect = ({ value, onChange, options }) => (
    <FormControl fullWidth sx={{ mb: 2 }}>
        <Select value={value} onChange={onChange}>
            {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
        </Select>
    </FormControl>
);

CustomSelect.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        })
    ).isRequired,
};

// ✅ Reusable Button Component
export const CustomButton = ({ text, onClick, type = "button" }) => (
    <Button
        variant="contained"
        color="primary"
        type={type}
        fullWidth
        sx={{ py: 1.5, fontSize: "16px" }}
        onClick={onClick}
    >
        {text}
    </Button>
);

CustomButton.propTypes = {
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    type: PropTypes.string,
};

// ✅ Reusable Box Component
export const CustomBox = ({ children, sx }) => (
    <Box sx={sx}>{children}</Box>
);

CustomBox.propTypes = {
    children: PropTypes.node.isRequired,
    sx: PropTypes.object,
};

// ✅ Reusable Typography Component
export const CustomTypography = ({ variant, children, sx }) => (
    <Typography variant={variant} sx={sx}>
        {children}
    </Typography>
);

CustomTypography.propTypes = {
    variant: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    sx: PropTypes.object,
};

// ✅ Reusable Table Component
export const CustomTable = ({ columns, data }) => (
    <TableContainer component={Paper}>
        <Table>
            <TableHead>
                <TableRow>
                    {columns.map((col) => (
                        <TableCell key={col}><strong>{col}</strong></TableCell>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {data.length > 0 ? (
                    data.map((row, index) => (
                        <TableRow key={index}>
                            {Object.values(row).map((cell, i) => (
                                <TableCell key={i}>{cell}</TableCell>
                            ))}
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={columns.length} align="center">
                            No data found
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </TableContainer>
);

CustomTable.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.string).isRequired,
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
};

// ✅ Reusable Snackbar Alert Component
export const CustomSnackbar = ({ open, message, severity, onClose }) => (
    <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={onClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
        <Alert onClose={onClose} severity={severity} variant="filled">
            {message}
        </Alert>
    </Snackbar>
);

CustomSnackbar.propTypes = {
    open: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    severity: PropTypes.oneOf(["success", "error", "warning", "info"]).isRequired,
    onClose: PropTypes.func.isRequired,
};

// ✅ Reusable Sidebar Components
export const CustomDrawer = ({ open, themeColor, children }) => (
    <Drawer
        variant="permanent"
        sx={{
            width: open ? 250 : 70,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
                width: open ? 250 : 70,
                backgroundColor: themeColor,
                color: "#fff",
                transition: "width 0.3s ease",
                overflowX: "hidden",
            },
        }}
    >
        {children}
    </Drawer>
);
export const CustomContainer = ({ children, maxWidth, sx }) => (
    <Container maxWidth={maxWidth} sx={{ py: 3, ...sx }}>
        {children}
    </Container>
);

CustomContainer.propTypes = {
    children: PropTypes.node.isRequired,
    maxWidth: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
    sx: PropTypes.object,
};

CustomContainer.defaultProps = {
    maxWidth: "lg", // Default width lg set kar diya
    sx: {},
};

CustomDrawer.propTypes = {
    open: PropTypes.bool.isRequired,
    themeColor: PropTypes.string.isRequired, // ✅ Ensures 'themeColor' is validated
    children: PropTypes.node.isRequired,
};


// ✅ Reusable Sidebar Menu Item
export const SidebarMenuItem = ({ icon, text, onClick }) => (
    <ListItemButton onClick={onClick}>
        <ListItemIcon sx={{ color: "#fff" }}>{icon}</ListItemIcon>
        <ListItemText primary={text} />
    </ListItemButton>
);

SidebarMenuItem.propTypes = {
    icon: PropTypes.element.isRequired,
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
};



// ✅ Export Material UI Components for Reuse
export {
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Home,
    Category,
    AccountBalance,
    AttachMoney,
    ExpandLess,
    ExpandMore,
    Person,
    AddCircle,
    ListAlt,
    PieChart,
};
