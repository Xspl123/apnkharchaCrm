import PropTypes from "prop-types";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { useEffect, useMemo, useState } from "react";
import { evaluateCalculatorExpression, formatCalculatorResult } from "../utils/calculator";

const keypadRows = [
    ["C", "(", ")", "⌫"],
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["0", "00", ".", "+"],
];

const getButtonStyles = (token) => {
    if (token === "C") {
        return { color: "error", variant: "outlined" };
    }

    if (token === "⌫") {
        return { color: "warning", variant: "outlined", startIcon: <BackspaceOutlinedIcon fontSize="small" /> };
    }

    if (["/", "*", "-", "+", "(", ")"].includes(token)) {
        return { color: "primary", variant: "outlined" };
    }

    return { color: "inherit", variant: "contained" };
};

const EnterpriseCalculatorDialog = ({
    open,
    title,
    subtitle,
    initialValue,
    confirmLabel,
    onClose,
    onConfirm,
}) => {
    const [expression, setExpression] = useState("");
    const [previewValue, setPreviewValue] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setExpression(initialValue ? String(initialValue) : "");
            setPreviewValue(initialValue ? String(initialValue) : "");
            setError("");
        }
    }, [initialValue, open]);

    const canSubmit = useMemo(() => previewValue !== "" && !error, [error, previewValue]);

    const updatePreview = (nextExpression) => {
        setExpression(nextExpression);

        if (!nextExpression.trim()) {
            setPreviewValue("");
            setError("");
            return;
        }

        try {
            const evaluatedValue = evaluateCalculatorExpression(nextExpression);
            setPreviewValue(formatCalculatorResult(evaluatedValue));
            setError("");
        } catch (calculationError) {
            setPreviewValue("");
            setError(calculationError.message);
        }
    };

    const handleTokenClick = (token) => {
        if (token === "C") {
            updatePreview("");
            return;
        }

        if (token === "⌫") {
            updatePreview(expression.slice(0, -1));
            return;
        }

        updatePreview(`${expression}${token}`);
    };

    const handleEvaluate = () => {
        try {
            const evaluatedValue = evaluateCalculatorExpression(expression);
            const formattedValue = formatCalculatorResult(evaluatedValue);
            setExpression(formattedValue);
            setPreviewValue(formattedValue);
            setError("");
        } catch (calculationError) {
            setPreviewValue("");
            setError(calculationError.message);
        }
    };

    const handleConfirm = () => {
        if (!canSubmit) {
            return;
        }

        onConfirm(previewValue);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                        sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "primary.main",
                            color: "primary.contrastText"
                        }}
                    >
                        <CalculateOutlinedIcon />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    </Box>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                <Stack spacing={2}>
                    <TextField
                        label="Expression"
                        value={expression}
                        onChange={(event) => updatePreview(event.target.value)}
                        autoFocus
                        fullWidth
                        placeholder="Example: 1250+18.5-200"
                    />

                    <Box
                        sx={{
                            border: "1px solid",
                            borderColor: error ? "error.main" : "divider",
                            borderRadius: 2,
                            p: 2,
                            bgcolor: "grey.50"
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            Live result
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                            {previewValue || "0"}
                        </Typography>
                    </Box>

                    {error ? <Alert severity="error">{error}</Alert> : null}

                    <Divider />

                    <Grid container spacing={1}>
                        {keypadRows.flat().map((token) => {
                            const buttonConfig = getButtonStyles(token);

                            return (
                                <Grid item xs={3} key={token}>
                                    <Button
                                        fullWidth
                                        color={buttonConfig.color}
                                        variant={buttonConfig.variant}
                                        startIcon={buttonConfig.startIcon}
                                        onClick={() => handleTokenClick(token)}
                                        sx={{
                                            minHeight: 48,
                                            fontWeight: 700,
                                            boxShadow: token.match(/^[0-9.]|00$/) ? "none" : undefined
                                        }}
                                    >
                                        {token === "⌫" ? "" : token}
                                    </Button>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, justifyContent: "space-between" }}>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Stack direction="row" spacing={1}>
                    <Button onClick={handleEvaluate} variant="outlined">
                        Evaluate
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant="contained"
                        startIcon={<CheckCircleOutlineOutlinedIcon />}
                        disabled={!canSubmit}
                    >
                        {confirmLabel}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
};

EnterpriseCalculatorDialog.propTypes = {
    confirmLabel: PropTypes.string,
    initialValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    subtitle: PropTypes.string,
    title: PropTypes.string,
};

EnterpriseCalculatorDialog.defaultProps = {
    confirmLabel: "Use Value",
    initialValue: "",
    subtitle: "Reusable business calculator for precise amount entry.",
    title: "Enterprise Calculator",
};

export default EnterpriseCalculatorDialog;
