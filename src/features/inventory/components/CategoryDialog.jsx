import PropTypes from 'prop-types';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Stack, Typography, IconButton,
    Box, TextField, InputAdornment, Button,
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon } from '@mui/icons-material';
import SpeechFieldButton from '../../../components/SpeechFieldButton';
import { GradientButton, COLORS } from './shared';

const CategoryDialog = ({ catDialog, setCatDialog, catForm, setCatForm, catEdit, handleCatSubmit, loading, appendSpeech }) => (
    <Dialog open={catDialog} onClose={() => setCatDialog(false)}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
        <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={700}>
                    {catEdit ? 'Edit Category' : 'New Category'}
                </Typography>
                <IconButton size="small" onClick={() => setCatDialog(false)}><CloseIcon /></IconButton>
            </Stack>
        </DialogTitle>
        <DialogContent>
            <Box component="form" id="cat-form" onSubmit={handleCatSubmit}>
                <Stack spacing={2} mt={1}>
                    <TextField fullWidth required size="small" label="Category Name"
                        value={catForm.name}
                        onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                        InputProps={{
                            endAdornment: <InputAdornment position="end"><SpeechFieldButton onTranscript={(text) => setCatForm((prev) => ({ ...prev, name: appendSpeech(prev.name, text) }))} /></InputAdornment>,
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <TextField fullWidth size="small" label="Description"
                        value={catForm.description}
                        onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))}
                        InputProps={{
                            endAdornment: <InputAdornment position="end"><SpeechFieldButton onTranscript={(text) => setCatForm((prev) => ({ ...prev, description: appendSpeech(prev.description, text) }))} /></InputAdornment>,
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                            Color Select Karo
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {COLORS.map((color) => (
                                <Box key={color} onClick={() => setCatForm((p) => ({ ...p, color }))}
                                    sx={{
                                        width: 32, height: 32, borderRadius: '50%', bgcolor: color, cursor: 'pointer',
                                        border: catForm.color === color ? '3px solid #000' : '3px solid transparent',
                                        transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.2)' },
                                    }}
                                />
                            ))}
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="outlined" onClick={() => setCatDialog(false)} sx={{ borderRadius: '10px' }}>Cancel</Button>
            <GradientButton type="submit" form="cat-form" disabled={loading}
                startIcon={<SaveIcon />} gradient="linear-gradient(135deg,#9c27b0,#ce93d8)">
                {loading ? 'Saving...' : catEdit ? 'Update' : 'Create'}
            </GradientButton>
        </DialogActions>
    </Dialog>
);

CategoryDialog.propTypes = {
    catDialog: PropTypes.bool.isRequired,
    setCatDialog: PropTypes.func.isRequired,
    catForm: PropTypes.object.isRequired,
    setCatForm: PropTypes.func.isRequired,
    catEdit: PropTypes.object,
    handleCatSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    appendSpeech: PropTypes.func.isRequired,
};

export default CategoryDialog;
