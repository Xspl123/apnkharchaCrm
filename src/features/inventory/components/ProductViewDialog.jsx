import PropTypes from 'prop-types';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Stack, Avatar, Box, Typography,
    Chip, IconButton, Tabs, Tab, Grid, Paper, TableContainer, Table, TableHead, TableRow,
    TableCell, TableBody, Button,
} from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon, Tune as AdjustIcon } from '@mui/icons-material';
import ProductAttributeForm from './ProductAttributeForm';
import { fmt, fmtQty, STOCK_STATUS } from './shared';

const ProductViewDialog = ({
    viewDialog, setViewDialog, viewProduct, viewTab, setViewTab,
    productMovements, handleOpenMovement, handleEdit,
}) => (
    <Dialog open={viewDialog} onClose={() => setViewDialog(false)}
        maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ pb: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: viewProduct?.category?.color || '#f093fb', width: 44, height: 44 }}>
                        {viewProduct?.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>{viewProduct?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {viewProduct?.sku && `SKU: ${viewProduct.sku} · `}{viewProduct?.unit}
                        </Typography>
                    </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={STOCK_STATUS[viewProduct?.stock_status]?.label}
                        color={STOCK_STATUS[viewProduct?.stock_status]?.color || 'success'}
                        size="small" sx={{ fontWeight: 700 }} />
                    <IconButton onClick={() => setViewDialog(false)}><CloseIcon /></IconButton>
                </Stack>
            </Stack>
            <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)} sx={{ mt: 1 }}>
                <Tab label="Details" />
                <Tab label={`Stock Movements (${productMovements.length})`} />
                <Tab label="Attributes" />
            </Tabs>
        </DialogTitle>
        <DialogContent>
            {viewProduct && (
                <>
                    {viewTab === 0 && (
                        <Grid container spacing={2} mt={1}>
                            {[
                                { label: 'Current Stock', value: fmtQty(viewProduct.current_stock, viewProduct.unit), color: '#2e7d32' },
                                { label: 'Stock Value', value: fmt(viewProduct.stock_value), color: '#667eea' },
                                { label: 'Avg Cost', value: fmt(viewProduct.avg_cost), color: '#1976d2' },
                                { label: 'Selling Price', value: fmt(viewProduct.selling_price), color: '#11998e' },
                                { label: 'Purchase Price', value: fmt(viewProduct.purchase_price), color: '#f5576c' },
                                { label: 'GST Rate', value: `${viewProduct.tax_rate}%`, color: '#ed6c02' },
                                { label: 'HSN Code', value: viewProduct.hsn_code || '—', color: '#9c27b0' },
                                { label: 'Low Stock Alert', value: fmtQty(viewProduct.low_stock_alert, viewProduct.unit), color: '#ed6c02' },
                            ].map((item) => (
                                <Grid item xs={6} sm={3} key={item.label}>
                                    <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: 'grey.50', textAlign: 'center' }}>
                                        <Typography variant="h6" fontWeight={800} color={item.color}>{item.value}</Typography>
                                        <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                    {viewTab === 1 && (
                        <Box mt={1}>
                            {productMovements.length === 0 ? (
                                <Typography color="text.secondary" textAlign="center" py={4}>
                                    Koi movement nahi hai abhi
                                </Typography>
                            ) : (
                                <TableContainer component={Paper} elevation={0}
                                    sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                {['Date', 'Type', 'Qty', 'Rate', 'Before', 'After', 'Ref'].map((h) => (
                                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {productMovements.map((m) => (
                                                <TableRow key={m.id} hover>
                                                    <TableCell>
                                                        <Typography variant="caption">{m.movement_date_formatted}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={m.type_label} size="small"
                                                            color={m.direction === 'in' ? 'success' : m.direction === 'out' ? 'error' : 'info'}
                                                            sx={{ fontWeight: 600, fontSize: 10 }} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={700}
                                                            color={m.qty > 0 ? '#2e7d32' : '#ef4444'}>
                                                            {m.qty > 0 ? '+' : ''}{m.qty} {viewProduct.unit}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{fmt(m.rate)}</TableCell>
                                                    <TableCell>{m.stock_before}</TableCell>
                                                    <TableCell><Typography fontWeight={700}>{m.stock_after}</Typography></TableCell>
                                                    <TableCell>
                                                        {m.reference_no ? (
                                                            <Chip label={m.reference_no} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                                                        ) : (
                                                            <Typography variant="caption" color="text.disabled">—</Typography>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}

                    {/* ✅ Tab 2 — Attributes */}
                    {viewTab === 2 && (
                        <Box mt={2}>
                            <ProductAttributeForm
                                productId={viewProduct?.id}
                                categoryId={viewProduct?.product_category_id}
                            />
                        </Box>
                    )}
                </>
            )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button startIcon={<AdjustIcon />} variant="outlined"
                onClick={() => { setViewDialog(false); handleOpenMovement(viewProduct); }}
                sx={{ borderRadius: '10px' }}>Stock Adjust</Button>
            <Button startIcon={<EditIcon />} variant="outlined"
                onClick={() => { setViewDialog(false); handleEdit(viewProduct); }}
                sx={{ borderRadius: '10px' }}>Edit</Button>
            <Box flex={1} />
            <Button onClick={() => setViewDialog(false)} sx={{ borderRadius: '10px' }}>Close</Button>
        </DialogActions>
    </Dialog>
);

ProductViewDialog.propTypes = {
    viewDialog: PropTypes.bool.isRequired,
    setViewDialog: PropTypes.func.isRequired,
    viewProduct: PropTypes.object,
    viewTab: PropTypes.number.isRequired,
    setViewTab: PropTypes.func.isRequired,
    productMovements: PropTypes.array.isRequired,
    handleOpenMovement: PropTypes.func.isRequired,
    handleEdit: PropTypes.func.isRequired,
};

export default ProductViewDialog;
