import PropTypes from "prop-types";
import { Chip } from "@mui/material";

const STATUS_CONFIG = {
  active: { label: "Active", color: "success", variant: "filled" },
  inactive: { label: "Inactive", color: "default", variant: "outlined" },
  pending: { label: "Pending", color: "warning", variant: "filled" },
  paid: { label: "Paid", color: "success", variant: "filled" },
  unpaid: { label: "Unpaid", color: "error", variant: "outlined" },
  overdue: { label: "Overdue", color: "error", variant: "filled" },
  draft: { label: "Draft", color: "default", variant: "outlined" },
  completed: { label: "Completed", color: "success", variant: "filled" },
  cancelled: { label: "Cancelled", color: "error", variant: "outlined" },
};

const toTitle = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const StatusChip = ({ status, label, config = {}, size = "small", sx }) => {
  const key = String(status || "").toLowerCase();
  const resolved = { ...STATUS_CONFIG[key], ...config[key] };

  return (
    <Chip
      size={size}
      label={label || resolved.label || toTitle(status) || "Unknown"}
      color={resolved.color || "default"}
      variant={resolved.variant || "outlined"}
      sx={{ fontWeight: 700, ...resolved.sx, ...sx }}
    />
  );
};

StatusChip.propTypes = {
  status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  config: PropTypes.object,
  size: PropTypes.oneOf(["small", "medium"]),
  sx: PropTypes.object,
};

export default StatusChip;
