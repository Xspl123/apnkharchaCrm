import PropTypes from "prop-types";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

const DeleteTransactionDialog = ({ deleteCandidateId, handleDeleteDialogClose, handleDelete }) => {
    return (
        <Dialog open={Boolean(deleteCandidateId)} onClose={handleDeleteDialogClose} PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogContent>
                <DialogContentText>Are you sure you want to delete this transaction?</DialogContentText>
            </DialogContent>
            <DialogActions className="transactions-page__dialog-actions">
                <Button onClick={handleDeleteDialogClose}>Cancel</Button>
                <Button color="error" variant="contained" onClick={() => handleDelete(deleteCandidateId)}>Delete</Button>
            </DialogActions>
        </Dialog>
    );
};

DeleteTransactionDialog.propTypes = {
    deleteCandidateId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    handleDeleteDialogClose: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired,
};

export default DeleteTransactionDialog;
