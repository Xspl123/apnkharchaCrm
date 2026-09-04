import PropTypes from "prop-types";
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";

const getCellValue = (row, field) =>
  String(field)
    .split(".")
    .reduce((value, key) => (value == null ? value : value[key]), row);

const DataTable = ({
  columns,
  rows = [],
  getRowId = (row) => row.id,
  loading = false,
  emptyMessage = "No records found.",
  pagination,
  dense = false,
  hover = true,
  stickyHeader = false,
  onRowClick,
  rowSx,
  tableSx,
  containerSx,
  sx,
}) => (
  <Paper
    elevation={0}
    sx={{
      overflow: "hidden",
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      ...sx,
    }}
  >
    <TableContainer sx={containerSx}>
      <Table
        size={dense ? "small" : "medium"}
        stickyHeader={stickyHeader}
        sx={tableSx}
      >
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.field || column.id}
                align={column.align || "left"}
                sx={{
                  width: column.width,
                  minWidth: column.minWidth,
                  whiteSpace: "nowrap",
                  ...column.headerSx,
                }}
              >
                {column.headerName || column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
                  <CircularProgress size={28} />
                </Box>
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            rows.map((row, rowIndex) => (
              <TableRow
                key={getRowId(row, rowIndex)}
                hover={hover || Boolean(onRowClick)}
                onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                sx={{
                  cursor: onRowClick ? "pointer" : undefined,
                  ...(typeof rowSx === "function" ? rowSx(row, rowIndex) : rowSx),
                }}
              >
                {columns.map((column) => {
                  const rawValue = column.field
                    ? getCellValue(row, column.field)
                    : undefined;
                  const value = column.valueGetter
                    ? column.valueGetter(row, rowIndex)
                    : rawValue;

                  return (
                    <TableCell
                      key={column.field || column.id}
                      align={column.align || "left"}
                      sx={column.cellSx}
                    >
                      {column.render
                        ? column.render(value, row, rowIndex)
                        : value ?? column.fallback ?? "-"}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}

          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ py: 5 }}
                >
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>

    {pagination && (
      <TablePagination
        component="div"
        rowsPerPageOptions={pagination.rowsPerPageOptions || [5, 10, 25, 50]}
        count={pagination.count}
        rowsPerPage={pagination.rowsPerPage}
        page={pagination.page}
        onPageChange={pagination.onPageChange}
        onRowsPerPageChange={pagination.onRowsPerPageChange}
      />
    )}
  </Paper>
);

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      field: PropTypes.string,
      headerName: PropTypes.string,
      label: PropTypes.string,
      align: PropTypes.oneOf(["left", "right", "center", "inherit", "justify"]),
      width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      fallback: PropTypes.node,
      valueGetter: PropTypes.func,
      render: PropTypes.func,
      headerSx: PropTypes.object,
      cellSx: PropTypes.object,
    })
  ).isRequired,
  rows: PropTypes.array,
  getRowId: PropTypes.func,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  pagination: PropTypes.shape({
    count: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
    page: PropTypes.number.isRequired,
    rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
    onPageChange: PropTypes.func.isRequired,
    onRowsPerPageChange: PropTypes.func.isRequired,
  }),
  dense: PropTypes.bool,
  hover: PropTypes.bool,
  stickyHeader: PropTypes.bool,
  onRowClick: PropTypes.func,
  rowSx: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  tableSx: PropTypes.object,
  containerSx: PropTypes.object,
  sx: PropTypes.object,
};

export default DataTable;
