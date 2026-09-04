import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getAttributeGroups, createAttributeGroup, updateAttributeGroup,
    deleteAttributeGroup, addAttribute, updateAttribute, deleteAttribute,
} from '../../../redux/features/attributeSlice';
import {
    Box, Paper, Typography, Button, IconButton, Stack, Avatar, Chip,
    TextField, Select, MenuItem, Dialog, DialogTitle, DialogContent,
    DialogActions, Grid, Tooltip, Zoom, Alert, Snackbar, Fade,
    Accordion, AccordionSummary, AccordionDetails, Switch, FormControlLabel,
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Close as CloseIcon, Save as SaveIcon, ExpandMore as ExpandIcon,
    Tune as AttrIcon, Category as GroupIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

// ── Styled ────────────────────────────────────────────────
const GradientButton = styled(Button)(({ gradient }) => ({
    background: gradient || 'linear-gradient(135deg,#667eea,#764ba2)',
    color: 'white', fontWeight: 600, borderRadius: '12px',
    textTransform: 'none',
    '&:hover': { transform: 'scale(1.02)', opacity: 0.95 },
    '&:disabled': { opacity: 0.6, transform: 'none' },
}));

const TYPE_COLORS = {
    text:    { bg: '#e3f2fd', color: '#1976d2', label: 'Text' },
    number:  { bg: '#e8f5e9', color: '#2e7d32', label: 'Number' },
    select:  { bg: '#f3e5f5', color: '#9c27b0', label: 'Select' },
    boolean: { bg: '#fff3e0', color: '#ed6c02', label: 'Yes/No' },
};

const emptyGroup = { name: '', category_id: '', description: '' };
const emptyAttr  = { name: '', type: 'text', unit: '', options: [], is_required: false };

// ══════════════════════════════════════════════════════════
const AttributeManager = ({ categories = [] }) => {
    const dispatch   = useDispatch();
    const { groups } = useSelector((s) => s.attributes);

    const [snackbar,    setSnackbar]   = useState({ open: false, message: '', severity: 'success' });
    const [loading,     setLoading]    = useState(false);

    // Group dialog
    const [groupDialog, setGroupDialog] = useState(false);
    const [groupEdit,   setGroupEdit]   = useState(null);
    const [groupForm,   setGroupForm]   = useState({ ...emptyGroup });

    // Attribute dialog
    const [attrDialog,  setAttrDialog]  = useState(false);
    const [attrEdit,    setAttrEdit]    = useState(null);
    const [attrGroupId, setAttrGroupId] = useState(null);
    const [attrForm,    setAttrForm]    = useState({ ...emptyAttr });
    const [optionInput, setOptionInput] = useState('');

    // Delete dialogs
    const [delGroupDialog, setDelGroup] = useState(false);
    const [groupToDelete,  setGTD]      = useState(null);
    const [delAttrDialog,  setDelAttr]  = useState(false);
    const [attrToDelete,   setATD]      = useState(null);

    useEffect(() => { dispatch(getAttributeGroups()); }, [dispatch]);

    const showSnack = (message, severity = 'success') =>
        setSnackbar({ open: true, message, severity });

    // ── Group CRUD ────────────────────────────────────────

    const handleOpenGroup = (group = null) => {
        if (group) {
            setGroupEdit(group);
            setGroupForm({ name: group.name, category_id: group.category_id || '', description: group.description || '' });
        } else {
            setGroupEdit(null);
            setGroupForm({ ...emptyGroup });
        }
        setGroupDialog(true);
    };

    const handleGroupSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = { ...groupForm, category_id: groupForm.category_id || null };
            if (groupEdit) {
                await dispatch(updateAttributeGroup({ id: groupEdit.id, data: payload })).unwrap();
                showSnack('Group updated!');
            } else {
                await dispatch(createAttributeGroup(payload)).unwrap();
                showSnack('Group created!');
            }
            setGroupDialog(false);
            dispatch(getAttributeGroups());
        } catch (err) {
            showSnack(typeof err === 'string' ? err : 'Failed!', 'error');
        } finally { setLoading(false); }
    };

    const handleDeleteGroup = async () => {
        try {
            setLoading(true);
            await dispatch(deleteAttributeGroup(groupToDelete.id)).unwrap();
            showSnack('Group deleted!');
            setDelGroup(false);
        } catch (err) {
            showSnack(typeof err === 'string' ? err : 'Delete failed!', 'error');
        } finally { setLoading(false); }
    };

    // ── Attribute CRUD ────────────────────────────────────

    const handleOpenAttr = (groupId, attr = null) => {
        setAttrGroupId(groupId);
        if (attr) {
            setAttrEdit(attr);
            setAttrForm({
                name: attr.name, type: attr.type,
                unit: attr.unit || '',
                options: attr.options || [],
                is_required: attr.is_required || false,
            });
        } else {
            setAttrEdit(null);
            setAttrForm({ ...emptyAttr });
        }
        setOptionInput('');
        setAttrDialog(true);
    };

    const handleAttrSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                ...attrForm,
                unit:    attrForm.unit || null,
                options: attrForm.type === 'select' ? attrForm.options : null,
            };
            if (attrEdit) {
                await dispatch(updateAttribute({ id: attrEdit.id, data: payload })).unwrap();
                showSnack('Attribute updated!');
            } else {
                await dispatch(addAttribute({ groupId: attrGroupId, data: payload })).unwrap();
                showSnack('Attribute added!');
            }
            setAttrDialog(false);
            dispatch(getAttributeGroups());
        } catch (err) {
            showSnack(typeof err === 'string' ? err : 'Failed!', 'error');
        } finally { setLoading(false); }
    };

    const handleDeleteAttr = async () => {
        try {
            setLoading(true);
            const group = groups.find((g) => g.attributes?.some((a) => a.id === attrToDelete.id));
            await dispatch(deleteAttribute({ id: attrToDelete.id, groupId: group?.id })).unwrap();
            showSnack('Attribute deleted!');
            setDelAttr(false);
            dispatch(getAttributeGroups());
        } catch (err) {
            showSnack(typeof err === 'string' ? err : 'Delete failed!', 'error');
        } finally { setLoading(false); }
    };

    // ── Options for Select type ───────────────────────────

    const addOption = () => {
        const val = optionInput.trim();
        if (!val) return;
        if (!attrForm.options.includes(val)) {
            setAttrForm((p) => ({ ...p, options: [...p.options, val] }));
        }
        setOptionInput('');
    };

    const removeOption = (opt) => {
        setAttrForm((p) => ({ ...p, options: p.options.filter((o) => o !== opt) }));
    };

    // ── Render ────────────────────────────────────────────

    return (
        <Box>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h6" fontWeight={700}>🎛️ Attribute Groups</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Category-wise product attributes manage karo
                    </Typography>
                </Box>
                <GradientButton startIcon={<AddIcon />}
                    onClick={() => handleOpenGroup()}
                    gradient="linear-gradient(135deg,#667eea,#764ba2)">
                    New Group
                </GradientButton>
            </Stack>

            {/* Groups List */}
            {groups.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }} elevation={1}>
                    <Avatar sx={{ width: 72, height: 72, bgcolor: '#f0f0ff', margin: '0 auto 16px' }}>
                        <AttrIcon sx={{ fontSize: 40, color: '#667eea' }} />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Koi attribute group nahi hai
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Electronics ke liye RAM/Storage/Brand, General ke liye Color/Weight add karo
                    </Typography>
                    <GradientButton startIcon={<AddIcon />} onClick={() => handleOpenGroup()}>
                        Pehla Group Banao
                    </GradientButton>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    <AnimatePresence>
                        {groups.map((group) => (
                            <motion.div key={group.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}>
                                <Accordion defaultExpanded elevation={2}
                                    sx={{ borderRadius: '16px !important', '&:before': { display: 'none' } }}>
                                    <AccordionSummary expandIcon={<ExpandIcon />}
                                        sx={{ px: 3, py: 1 }}>
                                        <Stack direction="row" alignItems="center"
                                            spacing={2} sx={{ flex: 1, mr: 2 }}>
                                            <Avatar sx={{ bgcolor: '#667eea20', width: 40, height: 40 }}>
                                                <GroupIcon sx={{ color: '#667eea' }} />
                                            </Avatar>
                                            <Box flex={1}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography fontWeight={700}>{group.name}</Typography>
                                                    {group.category_id ? (
                                                        <Chip size="small"
                                                            label={categories.find((c) => c.id === group.category_id)?.name || 'Category'}
                                                            sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontSize: 11, fontWeight: 600 }}
                                                        />
                                                    ) : (
                                                        <Chip size="small" label="General (All Products)"
                                                            sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontSize: 11 }}
                                                        />
                                                    )}
                                                    <Chip size="small"
                                                        label={`${group.attributes?.length || 0} attributes`}
                                                        variant="outlined" sx={{ fontSize: 11 }}
                                                    />
                                                </Stack>
                                                {group.description && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {group.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                            {/* Group Actions */}
                                            <Stack direction="row" spacing={0.5}
                                                onClick={(e) => e.stopPropagation()}>
                                                <Tooltip title="Add Attribute" TransitionComponent={Zoom}>
                                                    <IconButton size="small" color="success"
                                                        onClick={() => handleOpenAttr(group.id)}
                                                        sx={{ bgcolor: 'rgba(46,125,50,0.1)' }}>
                                                        <AddIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit Group" TransitionComponent={Zoom}>
                                                    <IconButton size="small" color="primary"
                                                        onClick={() => handleOpenGroup(group)}
                                                        sx={{ bgcolor: 'rgba(102,126,234,0.1)' }}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Group" TransitionComponent={Zoom}>
                                                    <IconButton size="small" color="error"
                                                        onClick={() => { setGTD(group); setDelGroup(true); }}
                                                        sx={{ bgcolor: 'rgba(239,68,68,0.1)' }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>
                                    </AccordionSummary>

                                    <AccordionDetails sx={{ px: 3, pb: 2 }}>
                                        {!group.attributes?.length ? (
                                            <Box sx={{ py: 2, textAlign: 'center' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Koi attribute nahi — + button se add karo
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Grid container spacing={1.5}>
                                                {group.attributes.map((attr) => (
                                                    <Grid item xs={12} sm={6} md={4} key={attr.id}>
                                                        <Paper elevation={0} sx={{
                                                            p: 1.5, borderRadius: '12px',
                                                            border: '1px solid #e2e8f0',
                                                            '&:hover': { borderColor: '#667eea', bgcolor: '#f8f9ff' },
                                                        }}>
                                                            <Stack direction="row" alignItems="center"
                                                                justifyContent="space-between">
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Box>
                                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                                            <Typography variant="body2" fontWeight={700}>
                                                                                {attr.name}
                                                                            </Typography>
                                                                            {attr.is_required && (
                                                                                <Typography variant="caption" color="error">*</Typography>
                                                                            )}
                                                                        </Stack>
                                                                        <Stack direction="row" spacing={0.5} mt={0.3}>
                                                                            <Chip size="small"
                                                                                label={TYPE_COLORS[attr.type]?.label}
                                                                                sx={{
                                                                                    bgcolor: TYPE_COLORS[attr.type]?.bg,
                                                                                    color:   TYPE_COLORS[attr.type]?.color,
                                                                                    fontSize: 10, height: 18,
                                                                                }}
                                                                            />
                                                                            {attr.unit && (
                                                                                <Chip size="small" label={attr.unit}
                                                                                    variant="outlined"
                                                                                    sx={{ fontSize: 10, height: 18 }}
                                                                                />
                                                                            )}
                                                                        </Stack>
                                                                        {attr.type === 'select' && attr.options?.length > 0 && (
                                                                            <Typography variant="caption"
                                                                                color="text.secondary" sx={{ fontSize: 10 }}>
                                                                                {attr.options.join(' / ')}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                </Stack>
                                                                <Stack direction="row" spacing={0.3}>
                                                                    <IconButton size="small" color="primary"
                                                                        onClick={() => handleOpenAttr(group.id, attr)}>
                                                                        <EditIcon sx={{ fontSize: 14 }} />
                                                                    </IconButton>
                                                                    <IconButton size="small" color="error"
                                                                        onClick={() => { setATD(attr); setDelAttr(true); }}>
                                                                        <DeleteIcon sx={{ fontSize: 14 }} />
                                                                    </IconButton>
                                                                </Stack>
                                                            </Stack>
                                                        </Paper>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </Stack>
            )}

            {/* ══ GROUP DIALOG ══ */}
            <Dialog open={groupDialog} onClose={() => setGroupDialog(false)}
                maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={700}>
                            {groupEdit ? 'Edit Group' : 'New Attribute Group'}
                        </Typography>
                        <IconButton size="small" onClick={() => setGroupDialog(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" id="group-form" onSubmit={handleGroupSubmit}>
                        <Stack spacing={2.5} mt={1}>
                            <TextField fullWidth required size="small" label="Group Name"
                                placeholder="e.g. Server Specs, General Info"
                                value={groupForm.name}
                                onChange={(e) => setGroupForm((p) => ({ ...p, name: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                            <Select fullWidth size="small"
                                value={groupForm.category_id}
                                onChange={(e) => setGroupForm((p) => ({ ...p, category_id: e.target.value }))}
                                displayEmpty sx={{ borderRadius: '10px' }}>
                                <MenuItem value="">
                                    <em>🌐 General (All Products)</em>
                                </MenuItem>
                                {categories.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                                            <span>{c.name} only</span>
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                            <TextField fullWidth size="small" label="Description (optional)"
                                value={groupForm.description}
                                onChange={(e) => setGroupForm((p) => ({ ...p, description: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button variant="outlined" onClick={() => setGroupDialog(false)}
                        sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <GradientButton type="submit" form="group-form" disabled={loading}
                        startIcon={<SaveIcon />}>
                        {loading ? 'Saving...' : groupEdit ? 'Update' : 'Create Group'}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* ══ ATTRIBUTE DIALOG ══ */}
            <Dialog open={attrDialog} onClose={() => setAttrDialog(false)}
                maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={700}>
                            {attrEdit ? 'Edit Attribute' : 'New Attribute'}
                        </Typography>
                        <IconButton size="small" onClick={() => setAttrDialog(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" id="attr-form" onSubmit={handleAttrSubmit}>
                        <Stack spacing={2.5} mt={1}>
                            <TextField fullWidth required size="small" label="Attribute Name"
                                placeholder="e.g. RAM, Brand, Color, Weight"
                                value={attrForm.name}
                                onChange={(e) => setAttrForm((p) => ({ ...p, name: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />

                            <Stack direction="row" spacing={2}>
                                <Select fullWidth size="small" value={attrForm.type}
                                    onChange={(e) => setAttrForm((p) => ({ ...p, type: e.target.value }))}
                                    sx={{ borderRadius: '10px' }}>
                                    <MenuItem value="text">📝 Text (free input)</MenuItem>
                                    <MenuItem value="number">🔢 Number</MenuItem>
                                    <MenuItem value="select">📋 Select (dropdown)</MenuItem>
                                    <MenuItem value="boolean">✅ Yes / No</MenuItem>
                                </Select>

                                <TextField size="small" label="Unit"
                                    placeholder="GB, kg, cm..."
                                    value={attrForm.unit}
                                    onChange={(e) => setAttrForm((p) => ({ ...p, unit: e.target.value }))}
                                    sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                />
                            </Stack>

                            {/* Select options */}
                            {attrForm.type === 'select' && (
                                <Box>
                                    <Typography variant="caption" fontWeight={600} color="text.secondary"
                                        display="block" mb={1}>
                                        Options (Enter dabaao ya + click karo)
                                    </Typography>
                                    <Stack direction="row" spacing={1} mb={1}>
                                        <TextField fullWidth size="small"
                                            placeholder="Option add karo..."
                                            value={optionInput}
                                            onChange={(e) => setOptionInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        />
                                        <Button variant="outlined" onClick={addOption}
                                            sx={{ borderRadius: '10px', minWidth: 40 }}>
                                            <AddIcon />
                                        </Button>
                                    </Stack>
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                                        {attrForm.options.map((opt) => (
                                            <Chip key={opt} label={opt} size="small"
                                                onDelete={() => removeOption(opt)}
                                                sx={{ bgcolor: '#f3e5f5', color: '#9c27b0' }}
                                            />
                                        ))}
                                        {attrForm.options.length === 0 && (
                                            <Typography variant="caption" color="text.disabled">
                                                Koi option nahi — upar se add karo
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>
                            )}

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={attrForm.is_required}
                                        onChange={(e) => setAttrForm((p) => ({ ...p, is_required: e.target.checked }))}
                                        size="small"
                                    />
                                }
                                label={
                                    <Typography variant="body2">
                                        Required field{attrForm.is_required ? ' ✅' : ''}
                                    </Typography>
                                }
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button variant="outlined" onClick={() => setAttrDialog(false)}
                        sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <GradientButton type="submit" form="attr-form" disabled={loading}
                        startIcon={<SaveIcon />}
                        gradient="linear-gradient(135deg,#11998e,#38ef7d)">
                        {loading ? 'Saving...' : attrEdit ? 'Update' : 'Add Attribute'}
                    </GradientButton>
                </DialogActions>
            </Dialog>

            {/* ══ DELETE GROUP ══ */}
            <Dialog open={delGroupDialog} onClose={() => setDelGroup(false)}
                PaperProps={{ sx: { borderRadius: '20px', p: 2, maxWidth: 380 } }}>
                <DialogTitle sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: '#fee2e2', color: '#ef4444', margin: '0 auto 12px' }}>
                        <DeleteIcon sx={{ fontSize: 36 }} />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>Delete Group?</Typography>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Is group ke saare attributes aur product values delete ho jaayenge!
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700} color="error.main" mt={1}>
                        {groupToDelete?.name}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
                    <Button variant="outlined" onClick={() => setDelGroup(false)}
                        sx={{ borderRadius: '10px', px: 3 }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteGroup}
                        disabled={loading} sx={{ borderRadius: '10px', px: 3 }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* ══ DELETE ATTRIBUTE ══ */}
            <Dialog open={delAttrDialog} onClose={() => setDelAttr(false)}
                PaperProps={{ sx: { borderRadius: '20px', p: 2, maxWidth: 380 } }}>
                <DialogTitle sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: '#fee2e2', color: '#ef4444', margin: '0 auto 12px' }}>
                        <DeleteIcon sx={{ fontSize: 36 }} />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>Delete Attribute?</Typography>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Is attribute ki saari product values bhi delete ho jaayengi!
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700} color="error.main" mt={1}>
                        {attrToDelete?.name}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
                    <Button variant="outlined" onClick={() => setDelAttr(false)}
                        sx={{ borderRadius: '10px', px: 3 }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteAttr}
                        disabled={loading} sx={{ borderRadius: '10px', px: 3 }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={4000}
                onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                TransitionComponent={Fade}>
                <Alert severity={snackbar.severity} variant="filled"
                    sx={{ borderRadius: '12px', fontWeight: 500 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AttributeManager;
