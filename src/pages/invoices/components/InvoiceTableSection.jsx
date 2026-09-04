import {
    Avatar,
    Box,
    Button,
    CardContent,
    Chip,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tooltip,
    Typography,
    Zoom,
} from "@mui/material";
import {
    Add as AddIcon,
    AssignmentReturn as AssignmentReturnIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Delete as DeleteIcon,
    Description as DescriptionIcon,
    Edit as EditIcon,
    Error as ErrorIcon,
    Pending as PendingIcon,
    Receipt as ReceiptIcon,
    Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { GlassCard, StyledTableCell, StyledTableRow } from "./invoiceStyledComponents";

const getStatusColor = (status) => {
    const map = { paid: 'success', unpaid: 'error', partial: 'warning', overdue: 'error', draft: 'default' };
    return map[status] || 'default';
};

const getStatusIcon = (status) => {
    const map = { paid: <CheckCircleIcon />, unpaid: <CancelIcon />, partial: <PendingIcon />, overdue: <ErrorIcon />, draft: <DescriptionIcon /> };
    return map[status] || <ReceiptIcon />;
};

const InvoiceTableSection = ({
    filteredInvoices,
    formatCurrency,
    formatDate,
    handleChangePage,
    handleChangeRowsPerPage,
    handleDeleteConfirm,
    handleEdit,
    handleOpenForm,
    handleReturnClick,
    handleView,
    page,
    paginatedInvoices,
    rowsPerPage,
    searchQuery,
    statusFilter,
}) => (
                <GlassCard>
                    <CardContent className="invoice-page__table-content">
                        <Box className="invoice-page__table-header">
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar className="invoice-page__table-avatar"><ReceiptIcon /></Avatar>
                                    <Box>
                                        <Typography variant="h6" className="invoice-page__table-title">All Invoices</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Chip label={`Page ${page + 1} of ${Math.ceil(filteredInvoices.length / rowsPerPage) || 1}`} className="invoice-page__page-chip" />
                            </Stack>
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow className="invoice-page__head-row">
                                        <StyledTableCell>Invoice #</StyledTableCell>
                                        <StyledTableCell>Client</StyledTableCell>
                                        <StyledTableCell>Date</StyledTableCell>
                                        <StyledTableCell>Due Date</StyledTableCell>
                                        <StyledTableCell align="right">Total</StyledTableCell>
                                        <StyledTableCell align="right">Paid</StyledTableCell>
                                        <StyledTableCell align="right">Balance</StyledTableCell>
                                        <StyledTableCell align="center">Status</StyledTableCell>
                                        <StyledTableCell align="center">Actions</StyledTableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedInvoices.length > 0 ? (
                                        paginatedInvoices.map((invoice) => (
                                            <StyledTableRow key={invoice.id}>
                                                <TableCell>
                                                    <Typography variant="body2" className="invoice-page__invoice-number">
                                                        {invoice.invoice_no}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {invoice.items?.length || 0} items
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" className="invoice-page__client-name">
                                                        {invoice.client?.company_name || '-'}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {invoice.client?.gstin || 'No GST'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{formatDate(invoice.invoice_date)}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            sx={{
                                                                color: invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' ? '#ef4444' : 'inherit',
                                                                fontWeight: invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' ? 600 : 400,
                                                            }}
                                                        >
                                                            {formatDate(invoice.due_date)}
                                                        </Typography>
                                                        {invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && (
                                                            <Chip label="OVERDUE" size="small" color="error" sx={{ height: 20, fontSize: '0.7rem' }} />
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" className="invoice-page__amount">{formatCurrency(invoice.total_amount)}</Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" className="invoice-page__paid">{formatCurrency(invoice.paid_amount || 0)}</Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ color: parseFloat(invoice.balance_amount || 0) > 0 ? '#f59e0b' : 'inherit', fontWeight: parseFloat(invoice.balance_amount || 0) > 0 ? 600 : 400 }}>
                                                        {formatCurrency(invoice.balance_amount || 0)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip icon={getStatusIcon(invoice.status)} label={invoice.status?.toUpperCase()}
                                                        color={getStatusColor(invoice.status)} size="small"
                                                        className="invoice-page__status-chip-table" />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        <Tooltip title="View Invoice" arrow TransitionComponent={Zoom}>
                                                            <IconButton size="small" color="info" onClick={() => handleView(invoice)}
                                                                className="invoice-page__action-view">
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Edit Invoice" arrow TransitionComponent={Zoom}>
                                                            <IconButton size="small" color="primary" onClick={() => handleEdit(invoice)}
                                                                className="invoice-page__action-edit">
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {/* Sales Return button — cancelled/return pe nahi dikhega */}
                                                        {invoice.status !== 'return' && invoice.status !== 'cancelled' && (
                                                            <Tooltip title="Process Sales Return" arrow TransitionComponent={Zoom}>
                                                                <IconButton size="small" color="error"
                                                                    onClick={() => handleReturnClick(invoice)}
                                                                    className="invoice-page__action-danger">
                                                                    <AssignmentReturnIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="Delete Invoice" arrow TransitionComponent={Zoom}>
                                                            <IconButton size="small" color="error" onClick={() => handleDeleteConfirm(invoice)}
                                                                className="invoice-page__action-danger">
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </StyledTableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center" className="invoice-page__empty-cell">
                                                <Stack alignItems="center" spacing={2}>
                                                    <Avatar className="invoice-page__empty-avatar">
                                                        <ReceiptIcon className="invoice-page__empty-icon" />
                                                    </Avatar>
                                                    <Typography variant="h6" color="textSecondary">No invoices found</Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {searchQuery || statusFilter !== 'all'
                                                            ? "Try adjusting your search or filters"
                                                            : "Create your first invoice to get started"}
                                                    </Typography>
                                                    {!searchQuery && statusFilter === 'all' && (
                                                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenForm} className="invoice-page__empty-cta">
                                                            Create Invoice
                                                        </Button>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            component="div"
                            count={filteredInvoices.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            className="invoice-page__pagination"
                        />
                    </CardContent>
                </GlassCard>
);

export default InvoiceTableSection;
