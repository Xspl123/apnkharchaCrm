import PropTypes from 'prop-types';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Typography, Button,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

export const DeleteProductDialog = ({ open, onClose, toDelete, onConfirm, loading }) => (
    <Dialog open={open} onClose={onClose}
        PaperProps={{ sx: { borderRadius: '20px', p: 2, maxWidth: 380 } }}>
        <DialogTitle sx={{ textAlign: 'center' }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: '#fee2e2', color: '#ef4444', margin: '0 auto 12px' }}>
                <DeleteIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700}>Delete Product?</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Yeh action undo nahi ho sakta.</Typography>
            <Typography variant="subtitle1" fontWeight={700} color="error.main" mt={1}>{toDelete?.name}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
            <Button variant="outlined" onClick={onClose} sx={{ borderRadius: '10px', px: 3 }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={onConfirm} disabled={loading} sx={{ borderRadius: '10px', px: 3 }}>Delete</Button>
        </DialogActions>
    </Dialog>
);

DeleteProductDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    toDelete: PropTypes.object,
    onConfirm: PropTypes.func.isRequired,
    loading: PropTypes.bool,
};

export const DeleteCategoryDialog = ({ open, onClose, catToDelete, onConfirm, loading }) => (
    <Dialog open={open} onClose={onClose}
        PaperProps={{ sx: { borderRadius: '20px', p: 2, maxWidth: 380 } }}>
        <DialogTitle sx={{ textAlign: 'center' }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: '#fee2e2', color: '#ef4444', margin: '0 auto 12px' }}>
                <DeleteIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700}>Delete Category?</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Is category ke sab products uncategorized ho jayenge.</Typography>
            <Typography variant="subtitle1" fontWeight={700} color="error.main" mt={1}>{catToDelete?.name}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
            <Button variant="outlined" onClick={onClose} sx={{ borderRadius: '10px', px: 3 }}>Cancel</Button>
            <Button variant="contained" color="error" onClick={onConfirm} disabled={loading} sx={{ borderRadius: '10px', px: 3 }}>Delete</Button>
        </DialogActions>
    </Dialog>
);

DeleteCategoryDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    catToDelete: PropTypes.object,
    onConfirm: PropTypes.func.isRequired,
    loading: PropTypes.bool,
};
