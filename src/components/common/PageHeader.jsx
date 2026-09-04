import PropTypes from "prop-types";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";

const PageHeader = ({
  title,
  subtitle,
  icon,
  actions = [],
  meta,
  children,
  sx,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, sm: 3 },
      mb: 3,
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      ...sx,
    }}
  >
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      alignItems={{ xs: "stretch", md: "center" }}
      justifyContent="space-between"
    >
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          {icon && (
            <Box
              sx={{
                display: "inline-flex",
                color: "primary.main",
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
          <Typography variant="h5" component="h1" fontWeight={800} noWrap>
            {title}
          </Typography>
        </Stack>

        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.75, maxWidth: 720 }}
          >
            {subtitle}
          </Typography>
        )}

        {meta && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
            {Array.isArray(meta) ? (
              meta.map((item) => (
                <Chip
                  key={item.label}
                  size="small"
                  label={item.label}
                  color={item.color || "default"}
                  variant={item.variant || "outlined"}
                />
              ))
            ) : (
              <Chip size="small" label={meta} variant="outlined" />
            )}
          </Stack>
        )}
      </Box>

      {(actions.length > 0 || children) && (
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          justifyContent={{ xs: "flex-start", md: "flex-end" }}
          useFlexGap
        >
          {actions.map((action) => (
            <Button
              key={action.id || action.label}
              type={action.type || "button"}
              variant={action.variant || "contained"}
              color={action.color || "primary"}
              size={action.size || "medium"}
              startIcon={action.icon}
              endIcon={action.endIcon}
              disabled={action.disabled}
              onClick={action.onClick}
              aria-label={action.ariaLabel}
            >
              {action.label}
            </Button>
          ))}
          {children}
        </Stack>
      )}
    </Stack>
  </Paper>
);

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.node,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      id: PropTypes.string,
      icon: PropTypes.node,
      endIcon: PropTypes.node,
      variant: PropTypes.string,
      color: PropTypes.string,
      size: PropTypes.oneOf(["small", "medium", "large"]),
      type: PropTypes.oneOf(["button", "submit", "reset"]),
      disabled: PropTypes.bool,
      ariaLabel: PropTypes.string,
      onClick: PropTypes.func,
    })
  ),
  meta: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        color: PropTypes.string,
        variant: PropTypes.string,
      })
    ),
  ]),
  children: PropTypes.node,
  sx: PropTypes.object,
};

export default PageHeader;
