import PropTypes from 'prop-types';
import { Grid, CardContent, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { GlassCard } from './shared';

const ProductStatsCards = ({ stats, categoriesCount }) => (
    <Grid container spacing={2} mb={3}>
        {[
            { label: 'Total', value: stats.total, color: '#f5576c' },
            { label: 'In Stock', value: stats.inStock, color: '#2e7d32' },
            { label: 'Low Stock', value: stats.lowStock, color: '#ed6c02' },
            { label: 'Out Stock', value: stats.outStock, color: '#ef4444' },
            { label: 'Categories', value: categoriesCount, color: '#9c27b0' },
        ].map((s, i) => (
            <Grid item xs key={i}>
                <motion.div whileHover={{ y: -2 }}>
                    <GlassCard>
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight={800} color={s.color}>
                                {s.value}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                {s.label}
                            </Typography>
                        </CardContent>
                    </GlassCard>
                </motion.div>
            </Grid>
        ))}
    </Grid>
);

ProductStatsCards.propTypes = {
    stats: PropTypes.shape({
        total: PropTypes.number,
        inStock: PropTypes.number,
        lowStock: PropTypes.number,
        outStock: PropTypes.number,
    }).isRequired,
    categoriesCount: PropTypes.number.isRequired,
};

export default ProductStatsCards;
