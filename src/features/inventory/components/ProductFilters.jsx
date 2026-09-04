import PropTypes from 'prop-types';
import {
    Paper, Grid, TextField, InputAdornment, IconButton, Select, MenuItem, Box, Stack,
} from '@mui/material';
import {
    Add as AddIcon, Search as SearchIcon, Clear as ClearIcon,
    Refresh as RefreshIcon, Close as CloseIcon,
} from '@mui/icons-material';
import SpeechFieldButton from '../../../components/SpeechFieldButton';
import { GradientButton } from './shared';

const ProductFilters = ({
    searchQuery, setSearch, appendSpeech,
    categoryFilter, setCategory, categories,
    stockFilter, setStockFilter,
    statusFilter, setStatus,
    loadData, showForm, handleCancel, handleOpenCreate,
}) => (
    <Paper sx={{ p: 2, mb: 3, borderRadius: '16px' }} elevation={2}>
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
                <TextField fullWidth size="small"
                    placeholder="Search by name, SKU, HSN..."
                    value={searchQuery}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                {searchQuery && (
                                    <IconButton size="small" onClick={() => setSearch('')}>
                                        <ClearIcon />
                                    </IconButton>
                                )}
                                <SpeechFieldButton onTranscript={(text) => setSearch((prev) => appendSpeech(prev, text))} />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '10px' },
                    }}
                />
            </Grid>
            <Grid item xs={6} md={2}>
                <Select fullWidth size="small" value={categoryFilter}
                    onChange={(e) => setCategory(e.target.value)}
                    sx={{ borderRadius: '10px' }}>
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                                <span>{c.name}</span>
                            </Stack>
                        </MenuItem>
                    ))}
                </Select>
            </Grid>
            <Grid item xs={6} md={2}>
                <Select fullWidth size="small" value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    sx={{ borderRadius: '10px' }}>
                    <MenuItem value="all">All Stock</MenuItem>
                    <MenuItem value="low_stock">⚠️ Low Stock</MenuItem>
                    <MenuItem value="out_of_stock">❌ Out of Stock</MenuItem>
                </Select>
            </Grid>
            <Grid item xs={6} md={2}>
                <Select fullWidth size="small" value={statusFilter}
                    onChange={(e) => setStatus(e.target.value)}
                    sx={{ borderRadius: '10px' }}>
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">✅ Active</MenuItem>
                    <MenuItem value="inactive">❌ Inactive</MenuItem>
                </Select>
            </Grid>
            <Grid item xs={6} md={1.5}>
                <GradientButton fullWidth startIcon={<RefreshIcon />}
                    onClick={loadData}
                    gradient="linear-gradient(135deg,#667eea,#764ba2)">
                    Refresh
                </GradientButton>
            </Grid>
            <Grid item xs={6} md={1.5}>
                <GradientButton fullWidth
                    startIcon={showForm ? <CloseIcon /> : <AddIcon />}
                    onClick={showForm ? handleCancel : handleOpenCreate}
                    gradient={showForm
                        ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                        : 'linear-gradient(135deg,#f093fb,#f5576c)'}>
                    {showForm ? 'Cancel' : 'Add Product'}
                </GradientButton>
            </Grid>
        </Grid>
    </Paper>
);

ProductFilters.propTypes = {
    searchQuery: PropTypes.string.isRequired,
    setSearch: PropTypes.func.isRequired,
    appendSpeech: PropTypes.func.isRequired,
    categoryFilter: PropTypes.string.isRequired,
    setCategory: PropTypes.func.isRequired,
    categories: PropTypes.array.isRequired,
    stockFilter: PropTypes.string.isRequired,
    setStockFilter: PropTypes.func.isRequired,
    statusFilter: PropTypes.string.isRequired,
    setStatus: PropTypes.func.isRequired,
    loadData: PropTypes.func.isRequired,
    showForm: PropTypes.bool.isRequired,
    handleCancel: PropTypes.func.isRequired,
    handleOpenCreate: PropTypes.func.isRequired,
};

export default ProductFilters;
