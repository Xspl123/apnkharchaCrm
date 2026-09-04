import PropTypes from "prop-types";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

const ConfirmDialog = ({
  open,
  title = "Confirm action",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor = "error",
  loading = false,
  confirmDisabled = false,
  maxWidth = "xs",
  onClose,
  onConfirm,
  children,
}) => (
  <Dialog
    open={open}
    onClose={loading ? undefined : onClose}
    maxWidth={maxWidth}
    fullWidth
  >
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      {description && <DialogContentText>{description}</DialogContentText>}
      {children}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} disabled={loading} color="inherit">
        {cancelLabel}
      </Button>
      <Button
        onClick={onConfirm}
        disabled={loading || confirmDisabled}
        color={confirmColor}
        variant="contained"
      >
        {loading ? "Please wait..." : confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  confirmColor: PropTypes.string,
  loading: PropTypes.bool,
  confirmDisabled: PropTypes.bool,
  maxWidth: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl", false]),
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default ConfirmDialog;
