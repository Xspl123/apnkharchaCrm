import PropTypes from "prop-types";
import {
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const SearchFilterBar = ({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  searchLabel,
  filters = [],
  actions = [],
  children,
  sx,
  searchFieldSx,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
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
    >
      {onSearchChange && (
        <TextField
          size="small"
          label={searchLabel}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value, event)}
          placeholder={searchPlaceholder}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: { xs: "0 0 auto", md: "1 1 280px" },
            width: "100%",
            ...searchFieldSx,
          }}
        />
      )}

      {filters.map((filter) => (
        <FormControl
          key={filter.name}
          size="small"
          sx={{ minWidth: filter.minWidth || 160 }}
        >
          <InputLabel>{filter.label}</InputLabel>
          <Select
            label={filter.label}
            value={filter.value ?? ""}
            disabled={filter.disabled}
            onChange={(event) => filter.onChange(event.target.value, event)}
          >
            {(filter.options || []).map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}

      <Stack direction="row" spacing={1} justifyContent="flex-end" useFlexGap>
        {actions.map((action) => (
          <Button
            key={action.id || action.label}
            type={action.type || "button"}
            variant={action.variant || "outlined"}
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
    </Stack>
  </Paper>
);

SearchFilterBar.propTypes = {
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  searchLabel: PropTypes.string,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      minWidth: PropTypes.number,
      disabled: PropTypes.bool,
      onChange: PropTypes.func.isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
        })
      ),
    })
  ),
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
  children: PropTypes.node,
  sx: PropTypes.object,
  searchFieldSx: PropTypes.object,
};

export default SearchFilterBar;
