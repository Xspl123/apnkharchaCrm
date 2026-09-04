import { Stack, Avatar, Typography, Divider, Card, Button, TableRow } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

export const GlassCard = styled(Card)(() => ({
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.3)',
}));

export const GradientButton = styled(Button)(({ gradient }) => ({
    background: gradient || 'linear-gradient(135deg,#667eea,#764ba2)',
    color: 'white', fontWeight: 600, borderRadius: '12px',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(102,126,234,0.25)',
    '&:hover': { transform: 'scale(1.02)', opacity: 0.95 },
    '&:disabled': { opacity: 0.6, transform: 'none' },
}));

export const StyledRow = styled(TableRow)(() => ({
    transition: 'all 0.2s',
    '&:hover': { bgcolor: 'rgba(102,126,234,0.04)', cursor: 'pointer' },
}));

export const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
export const fmtQty = (q, u) => `${Number(q || 0).toFixed(2)} ${u || ''}`;

export const STOCK_STATUS = {
    in_stock: { color: 'success', label: 'In Stock' },
    low_stock: { color: 'warning', label: 'Low Stock' },
    out_of_stock: { color: 'error', label: 'Out of Stock' },
};

export const UNITS = ['pcs', 'kg', 'ltr', 'box', 'set', 'job', 'hr', 'mtr', 'ream', 'license', 'pair'];

export const COLORS = [
    '#667eea', '#f5576c', '#11998e', '#f7971e',
    '#9c27b0', '#1976d2', '#2e7d32', '#ed6c02',
    '#0288d1', '#c62828',
];

export const emptyProduct = {
    product_category_id: '',
    name: '', sku: '', hsn_code: '', description: '',
    unit: 'pcs', purchase_price: '', selling_price: '',
    tax_rate: 18, opening_stock: 0, low_stock_alert: 0,
    status: 'active', notes: '',
};

export const emptyCategory = { name: '', description: '', color: '#667eea' };

export const emptyMovement = {
    product_id: '', type: 'manual_in',
    qty: '', rate: '', notes: '',
    movement_date: new Date().toISOString().split('T')[0],
};

export const FormSection = ({ title, icon }) => (
    <Stack direction="row" alignItems="center" spacing={1} mb={2} mt={1}>
        <Avatar sx={{ bgcolor: '#f093fb', width: 28, height: 28 }}>{icon}</Avatar>
        <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
        <Divider sx={{ flex: 1 }} />
    </Stack>
);

FormSection.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.node,
};
