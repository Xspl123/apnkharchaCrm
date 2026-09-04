import PropTypes from 'prop-types';
import { Stack, Grid, Paper, Typography, CardContent, Avatar, Box, IconButton } from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Category as CategoryIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GlassCard, GradientButton } from './shared';

const CategoriesTab = ({ categories, setCatForm, setCatEdit, setCatDialog, setCatToDelete, setDelCat }) => (
    <>
        <Stack direction="row" justifyContent="flex-end" mb={2}>
            <GradientButton startIcon={<AddIcon />}
                onClick={() => { setCatForm({ name: '', description: '', color: '#667eea' }); setCatEdit(null); setCatDialog(true); }}
                gradient="linear-gradient(135deg,#9c27b0,#ce93d8)">
                Add Category
            </GradientButton>
        </Stack>
        <Grid container spacing={2}>
            {categories.length === 0 ? (
                <Grid item xs={12}>
                    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }} elevation={1}>
                        <Typography variant="h6" color="text.secondary">Koi category nahi hai abhi</Typography>
                    </Paper>
                </Grid>
            ) : categories.map((cat) => (
                <Grid item xs={12} sm={6} md={4} key={cat.id}>
                    <motion.div whileHover={{ y: -4 }}>
                        <GlassCard>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Avatar sx={{ bgcolor: cat.color, width: 44, height: 44 }}>
                                            <CategoryIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={700}>{cat.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {cat.products_count || 0} products
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Stack direction="row" spacing={0.5}>
                                        <IconButton size="small" color="primary"
                                            onClick={() => {
                                                setCatEdit(cat);
                                                setCatForm({ name: cat.name, description: cat.description || '', color: cat.color });
                                                setCatDialog(true);
                                            }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error"
                                            onClick={() => { setCatToDelete(cat); setDelCat(true); }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </Stack>
                                {cat.description && (
                                    <Typography variant="body2" color="text.secondary" mt={1} fontSize={12}>
                                        {cat.description}
                                    </Typography>
                                )}
                            </CardContent>
                        </GlassCard>
                    </motion.div>
                </Grid>
            ))}
        </Grid>
    </>
);

CategoriesTab.propTypes = {
    categories: PropTypes.array.isRequired,
    setCatForm: PropTypes.func.isRequired,
    setCatEdit: PropTypes.func.isRequired,
    setCatDialog: PropTypes.func.isRequired,
    setCatToDelete: PropTypes.func.isRequired,
    setDelCat: PropTypes.func.isRequired,
};

export default CategoriesTab;
