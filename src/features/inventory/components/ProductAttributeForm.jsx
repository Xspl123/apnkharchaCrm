import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getAttributeGroups, getProductAttributes, saveProductAttributes,
} from '../../../redux/features/attributeSlice';
import {
    Box, Typography, TextField, Select, MenuItem, Stack,
    Chip, Switch, FormControlLabel, CircularProgress, Alert, Button,
    Divider, Avatar,
} from '@mui/material';
import { Save as SaveIcon, Tune as AttrIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const GradientButton = styled(Button)(({ gradient }) => ({
    background: gradient || 'linear-gradient(135deg,#667eea,#764ba2)',
    color: 'white', fontWeight: 600, borderRadius: '12px',
    textTransform: 'none',
    '&:hover': { transform: 'scale(1.02)', opacity: 0.95 },
}));

// ══════════════════════════════════════════════════════════
// ProductAttributeForm — Product form ke andar embed hoga
// Props: productId, categoryId, onSaved
// ══════════════════════════════════════════════════════════

const ProductAttributeForm = ({ productId, categoryId, onSaved }) => {
    const dispatch = useDispatch();
    const { groups, productAttributes, isLoading } = useSelector((s) => s.attributes);

    const [values,  setValues]  = useState({});  // { [attributeId]: value }
    const [loading, setLoading] = useState(false);
    const [saved,   setSaved]   = useState(false);

    // ── Load groups filtered by category ─────────────────
    useEffect(() => {
        dispatch(getAttributeGroups(
            categoryId ? { category_id: categoryId } : {}
        ));
    }, [categoryId, dispatch]);

    // ── Load existing product attribute values ────────────
    useEffect(() => {
        if (productId) {
            dispatch(getProductAttributes(productId));
        }
    }, [dispatch, productId]);

    // ── Pre-fill existing values ──────────────────────────
    useEffect(() => {
        const existing = productAttributes[productId] || [];
        const map = {};
        existing.forEach((v) => { map[v.attribute_id] = v.value; });
        setValues(map);
    }, [productAttributes, productId]);

    // ── Relevant groups — category-specific + general ────
    const relevantGroups = groups.filter((g) =>
        !g.category_id || String(g.category_id) === String(categoryId)
    );

    const handleChange = (attrId, value) => {
        setValues((p) => ({ ...p, [attrId]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        if (!productId) return;
        try {
            setLoading(true);
            const attributes = Object.entries(values).map(([attribute_id, value]) => ({
                attribute_id: parseInt(attribute_id),
                value: String(value ?? ''),
            }));
            await dispatch(saveProductAttributes({ productId, attributes })).unwrap();
            setSaved(true);
            if (onSaved) onSaved();
        } catch {
            return;
        } finally { setLoading(false); }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (relevantGroups.length === 0) {
        return (
            <Alert severity="info" sx={{ borderRadius: '10px' }}>
                Is category ke liye koi attribute group nahi hai —
                Inventory → Attributes mein ja ke banao!
            </Alert>
        );
    }

    return (
        <Box>
            {relevantGroups.map((group) => (
                <Box key={group.id} mb={3}>
                    {/* Group Header */}
                    <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                        <Avatar sx={{ bgcolor: '#667eea20', width: 28, height: 28 }}>
                            <AttrIcon sx={{ fontSize: 14, color: '#667eea' }} />
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight={700}>{group.name}</Typography>
                        <Divider sx={{ flex: 1 }} />
                    </Stack>

                    {/* Attributes */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
                        {group.attributes?.map((attr) => (
                            <Box key={attr.id}>
                                <Typography variant="caption" fontWeight={600}
                                    color="text.secondary" display="block" mb={0.5}>
                                    {attr.name}
                                    {attr.unit && <span style={{ color: '#9c27b0' }}> ({attr.unit})</span>}
                                    {attr.is_required && <span style={{ color: '#ef4444' }}> *</span>}
                                </Typography>

                                {/* Text */}
                                {attr.type === 'text' && (
                                    <TextField fullWidth size="small"
                                        placeholder={`${attr.name} daalo...`}
                                        value={values[attr.id] ?? ''}
                                        onChange={(e) => handleChange(attr.id, e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                    />
                                )}

                                {/* Number */}
                                {attr.type === 'number' && (
                                    <TextField fullWidth size="small" type="number"
                                        placeholder="0"
                                        value={values[attr.id] ?? ''}
                                        onChange={(e) => handleChange(attr.id, e.target.value)}
                                        InputProps={attr.unit ? {
                                            endAdornment: (
                                                <Chip label={attr.unit} size="small"
                                                    sx={{ mr: -1, bgcolor: '#f3e5f5', color: '#9c27b0', fontSize: 10 }} />
                                            )
                                        } : {}}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                    />
                                )}

                                {/* Select */}
                                {attr.type === 'select' && (
                                    <Select fullWidth size="small"
                                        value={values[attr.id] ?? ''}
                                        onChange={(e) => handleChange(attr.id, e.target.value)}
                                        displayEmpty
                                        sx={{ borderRadius: '8px' }}>
                                        <MenuItem value=""><em>Select karo...</em></MenuItem>
                                        {(attr.options || []).map((opt) => (
                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                        ))}
                                    </Select>
                                )}

                                {/* Boolean */}
                                {attr.type === 'boolean' && (
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={values[attr.id] === 'true' || values[attr.id] === true}
                                                onChange={(e) => handleChange(attr.id, e.target.checked ? 'true' : 'false')}
                                                size="small"
                                            />
                                        }
                                        label={
                                            <Typography variant="body2">
                                                {values[attr.id] === 'true' ? '✅ Yes' : '❌ No'}
                                            </Typography>
                                        }
                                    />
                                )}
                            </Box>
                        ))}
                    </Box>
                </Box>
            ))}

            {/* Save Button — only if productId available */}
            {productId && (
                <Stack direction="row" justifyContent="flex-end" mt={2}>
                    {saved && (
                        <Typography variant="caption" color="success.main"
                            alignSelf="center" mr={2}>
                            ✅ Saved!
                        </Typography>
                    )}
                    <GradientButton size="small" onClick={handleSave}
                        disabled={loading} startIcon={<SaveIcon />}
                        gradient="linear-gradient(135deg,#11998e,#38ef7d)">
                        {loading ? 'Saving...' : 'Save Attributes'}
                    </GradientButton>
                </Stack>
            )}
        </Box>
    );
};

export default ProductAttributeForm;
