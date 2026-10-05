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

const EMPTY_ATTRIBUTE_VALUES = [];

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

const ProductAttributeForm = ({ productId, categoryId, initialValues, onSaved, onValuesChange }) => {
    const dispatch = useDispatch();
    const { groups, productAttributes, isLoading } = useSelector((s) => s.attributes);

    const [values,  setValues]  = useState({});  // { [attributeId]: value }
    const [loading, setLoading] = useState(false);
    const [saved,   setSaved]   = useState(false);
    const [saveError, setSaveError] = useState('');
    const cachedProductValues = productId ? productAttributes[productId] : null;
    const fallbackValues = initialValues ?? EMPTY_ATTRIBUTE_VALUES;
    const existingProductValues = cachedProductValues?.length ? cachedProductValues : fallbackValues;

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
        const existing = existingProductValues || [];
        const map = {};
        const availableAttributes = groups.flatMap((group) => group.attributes || []);
        existing.forEach((entry) => {
            if (!entry || typeof entry !== 'object') return;
            const nested = entry.attribute || entry.product_attribute || entry.pivot || {};
            const attributeId = entry.attribute_id ?? entry.attributeId ?? entry.attribute?.id ??
                entry.product_attribute?.id ?? entry.pivot?.attribute_id ?? nested.attribute_id;
            const name = entry.attribute_name ?? nested.name ?? entry.name;
            const matchedAttribute = availableAttributes.find((attribute) =>
                name && attribute.name?.toLowerCase() === String(name).toLowerCase()
            );
            const value = entry.value ?? entry.attribute_value ?? entry.attributeValue ??
                entry.pivot?.value ?? entry.pivot?.attribute_value ?? nested.value ?? nested.attribute_value;
            const resolvedId = attributeId ?? matchedAttribute?.id ??
                (value != null ? entry.id : null);
            if (resolvedId != null && value != null) map[resolvedId] = String(value);
        });
        setValues(map);
        onValuesChange?.(serializeValues(map));
    }, [existingProductValues, productId, groups, onValuesChange]);

    // ── Relevant groups — category-specific + general ────
    const relevantGroups = groups.filter((g) =>
        !g.category_id || String(g.category_id) === String(categoryId)
    );

    const handleChange = (attrId, value) => {
        const nextValues = { ...values, [attrId]: value };
        setValues(nextValues);
        onValuesChange?.(serializeValues(nextValues));
        setSaved(false);
        setSaveError('');
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
            setSaveError('');
            if (onSaved) onSaved();
        } catch (error) {
            setSaveError(typeof error === 'string' ? error : 'Could not save product attributes. Please try again.');
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
                No attribute groups are configured for this category —
                Create one under Inventory → Attributes.
            </Alert>
        );
    }

    return (
        <Box>
            {saveError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{saveError}</Alert>}
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
                                        placeholder={`Enter ${attr.name}...`}
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
                                        <MenuItem value=""><em>Select...</em></MenuItem>
                                        {(Array.isArray(attr.options) ? attr.options : []).map((option) => {
                                            const opt = typeof option === 'object'
                                                ? option.value ?? option.label ?? option.name
                                                : option;
                                            return (
                                                <MenuItem key={opt} value={String(opt)}>{String(opt)}</MenuItem>
                                            );
                                        })}
                                        {values[attr.id] && !(attr.options || []).some((option) => {
                                            const opt = typeof option === 'object'
                                                ? option.value ?? option.label ?? option.name
                                                : option;
                                            return String(opt) === String(values[attr.id]);
                                        }) && <MenuItem value={String(values[attr.id])}>{values[attr.id]}</MenuItem>}
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
            {!productId && relevantGroups.length > 0 && (
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Attribute values will be saved when you save the product.
                </Typography>
            )}
        </Box>
    );
};

const serializeValues = (values) => Object.entries(values).map(([attribute_id, value]) => ({
    attribute_id: parseInt(attribute_id, 10),
    value: String(value ?? ''),
}));

export default ProductAttributeForm;
