import PropTypes from 'prop-types';
import { Box, Paper, Stack, Typography, Chip } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const ProductHeader = ({ stats }) => (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Paper elevation={0} sx={{
            p: { xs: 2, sm: 2.5 }, mb: 3, borderRadius: '16px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
        }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                        📦 Products & Categories
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3 }}>
                        Product master, categories aur stock management
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label={`${stats.total} Products`}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
                    {stats.lowStock > 0 && (
                        <Chip
                            icon={<WarningIcon sx={{ color: '#fff !important', fontSize: 14 }} />}
                            label={`${stats.lowStock} Low`}
                            sx={{ bgcolor: 'rgba(255,193,7,0.4)', color: 'white', fontWeight: 700 }}
                        />
                    )}
                </Stack>
            </Stack>
        </Paper>
    </motion.div>
);

ProductHeader.propTypes = {
    stats: PropTypes.shape({
        total: PropTypes.number,
        lowStock: PropTypes.number,
    }).isRequired,
};

export default ProductHeader;
