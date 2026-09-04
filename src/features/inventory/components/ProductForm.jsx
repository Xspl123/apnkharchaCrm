import PropTypes from 'prop-types';
import Autocomplete from '@mui/material/Autocomplete';
import {
    Box, Grid, TextField, Select, MenuItem, Button, InputAdornment,
    Stack, Avatar, Typography, Divider, Chip, CardContent,
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Close as CloseIcon, Save as SaveIcon,
    Inventory as InventoryIcon, TrendingUp as InIcon, Tune as AdjustIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import SpeechFieldButton from '../../../components/SpeechFieldButton';
import ProductAttributeForm from './ProductAttributeForm';
import { GlassCard, GradientButton, FormSection, UNITS } from './shared';

const ProductForm = ({
    showForm, editMode, selectedProduct, formData, setFormData,
    handleChange, handleSubmit, handleCancel,
    categories, hsnCodes, actionLoading, appendSpeech,
}) => (
    <AnimatePresence>
        {showForm && (
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.3 }}
            >
                <GlassCard sx={{ mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                            <Avatar sx={{ bgcolor: '#f093fb', width: 44, height: 44 }}>
                                {editMode ? <EditIcon /> : <AddIcon />}
                            </Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight={700}>
                                    {editMode ? `Edit — ${selectedProduct?.name}` : 'New Product'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {editMode ? 'Product details update karo' : 'Naya product add karo'}
                                </Typography>
                            </Box>
                        </Stack>
                        <Divider sx={{ mb: 3 }} />

                        <Box component="form" onSubmit={handleSubmit}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={12}>
                                    <FormSection title="Basic Info" icon={<InventoryIcon sx={{ fontSize: 14 }} />} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField fullWidth required size="small"
                                        label="Product Name" name="name"
                                        value={formData.name} onChange={handleChange}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end"><SpeechFieldButton onTranscript={(text) => setFormData((prev) => ({ ...prev, name: appendSpeech(prev.name, text) }))} /></InputAdornment>,
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <TextField fullWidth size="small"
                                        label="SKU" name="sku"
                                        value={formData.sku} onChange={handleChange}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end"><SpeechFieldButton onTranscript={(text) => setFormData((prev) => ({ ...prev, sku: appendSpeech(prev.sku, text) }))} /></InputAdornment>,
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <Autocomplete
                                        freeSolo size="small" options={hsnCodes}
                                        getOptionLabel={(option) =>
                                            typeof option === 'string'
                                                ? option
                                                : `${option.hsn_code} — ${option.description || ''}`
                                        }
                                        value={
                                            hsnCodes.find((h) => h.hsn_code === formData.hsn_code) ||
                                            formData.hsn_code || null
                                        }
                                        onChange={(_, newValue) => {
                                            if (typeof newValue === 'string') {
                                                setFormData((p) => ({ ...p, hsn_code: newValue }));
                                            } else if (newValue) {
                                                setFormData((p) => ({
                                                    ...p,
                                                    hsn_code: newValue.hsn_code,
                                                    tax_rate: newValue.tax_rate || p.tax_rate,
                                                }));
                                            } else {
                                                setFormData((p) => ({ ...p, hsn_code: '' }));
                                            }
                                        }}
                                        onInputChange={(_, value) => {
                                            setFormData((p) => ({ ...p, hsn_code: value }));
                                        }}
                                        filterOptions={(options, { inputValue }) =>
                                            options.filter((o) =>
                                                o.hsn_code?.toLowerCase().includes(inputValue.toLowerCase()) ||
                                                o.description?.toLowerCase().includes(inputValue.toLowerCase())
                                            ).slice(0, 20)
                                        }
                                        renderOption={(props, option) => (
                                            <Box component="li" {...props} key={option.id}>
                                                <Stack spacing={0}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Chip label={option.hsn_code} size="small"
                                                            sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, fontSize: 11, height: 20 }} />
                                                        {option.tax_rate > 0 && (
                                                            <Chip label={`GST ${option.tax_rate}%`} size="small"
                                                                sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600, fontSize: 10, height: 20 }} />
                                                        )}
                                                    </Stack>
                                                    {option.description && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, mt: 0.3 }}>
                                                            {option.description}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </Box>
                                        )}
                                        renderInput={(params) => (
                                            <TextField {...params} label="HSN Code"
                                                placeholder="Type ya select karo..."
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <>
                                                            <SpeechFieldButton onTranscript={(text) => setFormData((prev) => ({ ...prev, hsn_code: appendSpeech(prev.hsn_code, text) }))} />
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    ),
                                                }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                            />
                                        )}
                                        noOptionsText={
                                            <Typography variant="body2" color="text.secondary">
                                                Koi HSN code nahi mila — manually type kar sakte ho
                                            </Typography>
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <Select fullWidth size="small"
                                        name="product_category_id"
                                        value={formData.product_category_id}
                                        onChange={handleChange}
                                        displayEmpty sx={{ borderRadius: '10px' }}>
                                        <MenuItem value=""><em>No Category</em></MenuItem>
                                        {categories.map((c) => (
                                            <MenuItem key={c.id} value={c.id}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                                                    <span>{c.name}</span>
                                                </Stack>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <Select fullWidth size="small"
                                        name="status" value={formData.status}
                                        onChange={handleChange} sx={{ borderRadius: '10px' }}>
                                        <MenuItem value="active">✅ Active</MenuItem>
                                        <MenuItem value="inactive">❌ Inactive</MenuItem>
                                    </Select>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField fullWidth size="small"
                                        label="Description" name="description"
                                        value={formData.description} onChange={handleChange}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end"><SpeechFieldButton onTranscript={(text) => setFormData((prev) => ({ ...prev, description: appendSpeech(prev.description, text) }))} /></InputAdornment>,
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <FormSection title="Pricing & GST" icon={<InIcon sx={{ fontSize: 14 }} />} />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField fullWidth size="small"
                                        label="Purchase Price" name="purchase_price"
                                        type="number" value={formData.purchase_price}
                                        onChange={handleChange}
                                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField fullWidth size="small"
                                        label="Selling Price" name="selling_price"
                                        type="number" value={formData.selling_price}
                                        onChange={handleChange}
                                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Select fullWidth size="small"
                                        name="tax_rate" value={formData.tax_rate}
                                        onChange={handleChange} sx={{ borderRadius: '10px' }}>
                                        {[0, 5, 12, 18, 28].map((r) => (
                                            <MenuItem key={r} value={r}>GST {r}%</MenuItem>
                                        ))}
                                    </Select>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Select fullWidth size="small"
                                        name="unit" value={formData.unit}
                                        onChange={handleChange} sx={{ borderRadius: '10px' }}>
                                        {UNITS.map((u) => (
                                            <MenuItem key={u} value={u}>{u}</MenuItem>
                                        ))}
                                    </Select>
                                </Grid>

                                <Grid item xs={12}>
                                    <FormSection title="Stock Settings" icon={<AdjustIcon sx={{ fontSize: 14 }} />} />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField fullWidth size="small"
                                        label="Opening Stock" name="opening_stock"
                                        type="number" value={formData.opening_stock}
                                        onChange={handleChange}
                                        helperText="Initial stock quantity"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField fullWidth size="small"
                                        label="Low Stock Alert" name="low_stock_alert"
                                        type="number" value={formData.low_stock_alert}
                                        onChange={handleChange}
                                        helperText="Alert when stock reaches this"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth size="small"
                                        label="Notes" name="notes"
                                        value={formData.notes} onChange={handleChange}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end"><SpeechFieldButton onTranscript={(text) => setFormData((prev) => ({ ...prev, notes: appendSpeech(prev.notes, text) }))} /></InputAdornment>,
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                    />
                                </Grid>

                                {/* ✅ Product Attributes — category select hone ke baad load hoge */}
                                {(formData.product_category_id || editMode) && (
                                    <Grid item xs={12}>
                                        <Divider sx={{ mb: 2 }} />
                                        <ProductAttributeForm
                                            productId={editMode ? selectedProduct?.id : null}
                                            categoryId={formData.product_category_id || null}
                                        />
                                    </Grid>
                                )}

                                <Grid item xs={12}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                                        <Button variant="outlined" onClick={handleCancel}
                                            startIcon={<CloseIcon />} sx={{ borderRadius: '10px' }}>
                                            Cancel
                                        </Button>
                                        <GradientButton type="submit" disabled={actionLoading}
                                            startIcon={<SaveIcon />}
                                            gradient="linear-gradient(135deg,#f093fb,#f5576c)">
                                            {actionLoading ? 'Saving...' : editMode ? 'Update Product' : 'Save Product'}
                                        </GradientButton>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>
                    </CardContent>
                </GlassCard>
            </motion.div>
        )}
    </AnimatePresence>
);

ProductForm.propTypes = {
    showForm: PropTypes.bool.isRequired,
    editMode: PropTypes.bool.isRequired,
    selectedProduct: PropTypes.object,
    formData: PropTypes.object.isRequired,
    setFormData: PropTypes.func.isRequired,
    handleChange: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    handleCancel: PropTypes.func.isRequired,
    categories: PropTypes.array.isRequired,
    hsnCodes: PropTypes.array.isRequired,
    actionLoading: PropTypes.bool,
    appendSpeech: PropTypes.func.isRequired,
};

export default ProductForm;
