import PropTypes from 'prop-types';
import { Box, Paper, Stack, Typography, Chip } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const ProductHeader = ({ stats }) => (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Paper elevation={0} sx={{
            p: 2.5, mb: 3, borderRadius: '16px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        📦 Products & Categories
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3 }}>
                        Product master, categories aur stock management
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
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
