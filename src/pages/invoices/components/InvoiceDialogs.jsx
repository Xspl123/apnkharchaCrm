import {
    Alert,
    Avatar,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fade,
    Snackbar,
    Typography,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import InvoiceViewDialog from "../../../components/InvoiceViewDialog";
import SalesReturnDialog from "../../../components/sales/SalesReturnDialog";

const InvoiceDialogs = ({
    deleteDialog,
    formatCurrency,
    formatDate,
    handleDelete,
    handleExportPDF,
    handlePrint,
    handleReturnClick,
    invoicePrintRef,
    invoiceToDelete,
    invoiceToReturn,
    invoiceToView,
    returnDialog,
    setDeleteDialog,
    setReturnDialog,
    setSnackbar,
    setViewDialog,
    showSnackbar,
    snackbar,
    viewDialog,
}) => (
    <>
                {/* ==================== DELETE DIALOG ==================== */}
                <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}
                    PaperProps={{ className: 'invoice-page__delete-paper' }}>
                    <DialogTitle className="invoice-page__delete-title">
                        <Avatar className="invoice-page__delete-avatar">
                            <DeleteIcon className="invoice-page__delete-icon" />
                        </Avatar>
                        <Typography variant="h5" className="invoice-page__delete-heading">Confirm Delete</Typography>
                    </DialogTitle>
                    <DialogContent className="invoice-page__delete-content">
                        <Typography variant="body1" className="invoice-page__delete-copy">Are you sure you want to delete invoice</Typography>
                        <Typography variant="h6" className="invoice-page__delete-number">{invoiceToDelete?.invoice_no}</Typography>
                        <Typography variant="body2" color="textSecondary" className="invoice-page__delete-note">This action cannot be undone.</Typography>
                    </DialogContent>
                    <DialogActions className="invoice-page__delete-actions">
                        <Button onClick={() => setDeleteDialog(false)} variant="outlined"
                            className="invoice-page__delete-cancel">Cancel</Button>
                        <Button onClick={handleDelete} color="error" variant="contained"
                            className="invoice-page__delete-confirm">
                            Delete Invoice
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ==================== VIEW DIALOG ==================== */}
                <InvoiceViewDialog
                    open={viewDialog}
                    onClose={() => setViewDialog(false)}
                    invoiceToView={invoiceToView}
                    invoicePrintRef={invoicePrintRef}
                    handlePrint={handlePrint}
                    handleExportPDF={handleExportPDF}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                    onReturnClick={(invoice) => {
                        setViewDialog(false);
                        handleReturnClick(invoice);
                    }}
                />

                {/* Sales Return Dialog */}
                <SalesReturnDialog
                    open={returnDialog}
                    onClose={() => setReturnDialog(false)}
                    invoice={invoiceToReturn}
                    onSuccess={(msg) => showSnackbar(msg, 'success')}
                />

                {/* Snackbar */}
                <Snackbar open={snackbar.open} autoHideDuration={4000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    TransitionComponent={Fade}>
                    <Alert severity={snackbar.severity} variant="filled"
                        className="invoice-page__snackbar-alert">
                        {snackbar.message}
                    </Alert>
                </Snackbar>
    </>
);

export default InvoiceDialogs;
