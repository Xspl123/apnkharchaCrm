import PropTypes from 'prop-types';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Stack, Avatar, Box, Typography,
    IconButton, Paper, Select, MenuItem, TextField, InputAdornment, Button,
} from '@mui/material';
import {
    Close as CloseIcon, Save as SaveIcon, TrendingUp as InIcon,
    TrendingDown as OutIcon, Tune as AdjustIcon,
} from '@mui/icons-material';
import SpeechFieldButton from '../../../components/SpeechFieldButton';
import { GradientButton, fmtQty } from './shared';

const StockMovementDialog = ({ movDialog, setMovDialog, movForm, setMovForm, movProduct, handleMovementSubmit, loading, appendSpeech }) => (
    <Dialog open={movDialog} onClose={() => setMovDialog(false)}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
        <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ bgcolor: '#11998e', width: 36, height: 36 }}>
                        <AdjustIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700}>Stock Adjustment</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {movProduct?.name}
                        </Typography>
                    </Box>
                </Stack>
                <IconButton size="small" onClick={() => setMovDialog(false)}><CloseIcon /></IconButton>
            </Stack>
        </DialogTitle>
        <DialogContent>
            {/* ✅ Current stock info box */}
            {movProduct && (
                <Paper elevation={0} sx={{ p: 1.5, mb: 2, borderRadius: '10px', bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Current Stock</Typography>
                        <Typography variant="caption" fontWeight={700} color="#2e7d32">
                            {fmtQty(movProduct.current_stock, movProduct.unit)}
                        </Typography>
                    </Stack>
                </Paper>
            )}
            <Box component="form" id="mov-form" onSubmit={handleMovementSubmit}>
                <Stack spacing={2}>
                    <Select fullWidth size="small"
                        value={movForm.type}
                        onChange={(e) => setMovForm((p) => ({ ...p, type: e.target.value }))}
                        sx={{ borderRadius: '10px' }}>
                        <MenuItem value="manual_in">
                            <Stack direction="row" spacing={1} alignItems="center">
                                <InIcon color="success" fontSize="small" />
                                <span>Manual In (Stock Badhao)</span>
                            </Stack>
                        </MenuItem>
                        <MenuItem value="manual_out">
                            <Stack direction="row" spacing={1} alignItems="center">
                                <OutIcon color="error" fontSize="small" />
                                <span>Manual Out (Stock Ghatao)</span>
                            </Stack>
                        </MenuItem>
                        <MenuItem value="adjustment">
                            <Stack direction="row" spacing={1} alignItems="center">
                                <AdjustIcon color="info" fontSize="small" />
                                <span>Adjustment (Physical Count)</span>
                            </Stack>
                        </MenuItem>
                    </Select>

                    <TextField fullWidth required size="small"
                        label={movForm.type === 'adjustment' ? 'Actual Stock Count (Physical)' : 'Quantity'}
                        type="number"
                        value={movForm.qty}
                        onChange={(e) => setMovForm((p) => ({ ...p, qty: e.target.value }))}
                        helperText={
                            movForm.type === 'adjustment'
                                ? `⚠️ Actual physical count daalo — system ${movProduct?.current_stock ?? 0} se adjust karega`
                                : movForm.type === 'manual_in'
                                    ? '✅ Yeh qty current stock mein add hogi'
                                    : '❌ Yeh qty current stock se minus hogi'
                        }
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />

                    <TextField fullWidth size="small" label="Rate (optional)" type="number"
                        value={movForm.rate}
                        onChange={(e) => setMovForm((p) => ({ ...p, rate: e.target.value }))}
                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <TextField fullWidth required size="small" label="Date" type="date"
                        value={movForm.movement_date}
                        onChange={(e) => setMovForm((p) => ({ ...p, movement_date: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <TextField fullWidth size="small" label="Notes"
                        value={movForm.notes}
                        onChange={(e) => setMovForm((p) => ({ ...p, notes: e.target.value }))}
                        InputProps={{
                            endAdornment: <InputAdornment position="end"><SpeechFieldButton onTranscript={(text) => setMovForm((prev) => ({ ...prev, notes: appendSpeech(prev.notes, text) }))} /></InputAdornment>,
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                </Stack>
            </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="outlined" onClick={() => setMovDialog(false)} sx={{ borderRadius: '10px' }}>Cancel</Button>
            <GradientButton type="submit" form="mov-form" disabled={loading}
                startIcon={<SaveIcon />} gradient="linear-gradient(135deg,#11998e,#38ef7d)">
                {loading ? 'Saving...' : 'Save Movement'}
            </GradientButton>
        </DialogActions>
    </Dialog>
);

StockMovementDialog.propTypes = {
    movDialog: PropTypes.bool.isRequired,
    setMovDialog: PropTypes.func.isRequired,
    movForm: PropTypes.object.isRequired,
    setMovForm: PropTypes.func.isRequired,
    movProduct: PropTypes.object,
    handleMovementSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    appendSpeech: PropTypes.func.isRequired,
};

export default StockMovementDialog;
