import PropTypes from "prop-types";
import { Divider, Paper, Stack, Typography } from "@mui/material";

const FormSection = ({
  title,
  description,
  actions,
  children,
  spacing = 2,
  sx,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, sm: 3 },
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      ...sx,
    }}
  >
    {(title || description || actions) && (
      <>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "flex-start" }}
        >
          <Stack spacing={0.5}>
            {title && (
              <Typography variant="h6" component="h2">
                {title}
              </Typography>
            )}
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Stack>
          {actions}
        </Stack>
        <Divider sx={{ my: 2.5 }} />
      </>
    )}

    <Stack spacing={spacing}>{children}</Stack>
  </Paper>
);

FormSection.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
  spacing: PropTypes.number,
  sx: PropTypes.object,
};

export default FormSection;
