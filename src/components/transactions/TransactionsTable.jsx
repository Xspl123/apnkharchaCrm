import PropTypes from "prop-types";
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatDateTime } from "../../hooks/useTransactionsPage";
import { DataTable, SearchFilterBar } from "../common";

const TransactionsTable = ({
    searchQuery,
    handleSearchChange,
    paginatedTransactions,
    filteredTransactions,
    rowsPerPage,
    page,
    handleChangePage,
    handleChangeRowsPerPage,
    requestDeleteConfirmation,
}) => {
    const columns = [
        {
            field: "transaction_date",
            headerName: "Date",
            render: (value) => formatDateTime(value),
        },
        {
            field: "category.name",
            headerName: "Category",
            fallback: "N/A",
        },
        {
            field: "account.account_name",
            headerName: "Account",
            fallback: "N/A",
        },
        {
            field: "amount",
            headerName: "Amount",
            render: (value) => `₹${value}`,
        },
        {
            field: "description",
            headerName: "Description",
            fallback: "N/A",
        },
        {
            id: "actions",
            headerName: "Actions",
            render: (_, transaction) => (
                <IconButton
                    onClick={() => requestDeleteConfirmation(transaction.id)}
                    color="error"
                >
                    <DeleteIcon />
                </IconButton>
            ),
        },
    ];

    return (
        <>
            <SearchFilterBar
                searchValue={searchQuery}
                onSearchChange={(_, event) => handleSearchChange(event)}
                searchPlaceholder="Search transactions..."
                searchFieldSx={{
                    flex: { xs: "0 0 auto", md: "0 1 360px" },
                    maxWidth: { md: 360 },
                    ml: { md: "auto" },
                }}
                sx={{ mb: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
            />
            <DataTable
                columns={columns}
                rows={paginatedTransactions}
                emptyMessage="No transactions found."
                pagination={{
                    count: filteredTransactions.length,
                    rowsPerPage,
                    page,
                    rowsPerPageOptions: [5, 10, 25],
                    onPageChange: handleChangePage,
                    onRowsPerPageChange: handleChangeRowsPerPage,
                }}
                sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
            />
        </>
    );
};

TransactionsTable.propTypes = {
    searchQuery: PropTypes.string.isRequired,
    handleSearchChange: PropTypes.func.isRequired,
    paginatedTransactions: PropTypes.array.isRequired,
    filteredTransactions: PropTypes.array.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
    page: PropTypes.number.isRequired,
    handleChangePage: PropTypes.func.isRequired,
    handleChangeRowsPerPage: PropTypes.func.isRequired,
    requestDeleteConfirmation: PropTypes.func.isRequired,
};

export default TransactionsTable;
