import PropTypes from 'prop-types';
import {
    CardContent, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
    TablePagination, Typography, Stack, Avatar, Box, Chip, Tooltip, IconButton,
    LinearProgress, Zoom,
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Inventory as InventoryIcon, Tune as AdjustIcon, Visibility as ViewIcon,
} from '@mui/icons-material';
import { GlassCard, StyledRow, fmt, fmtQty, STOCK_STATUS, GradientButton } from './shared';

const ProductsTable = ({
    isLoading, paginated, filtered, page, rowsPerPage, setPage, setRows,
    handleView, handleOpenMovement, handleEdit, handleDeleteConfirm, handleOpenCreate,
}) => (
    <GlassCard>
        <CardContent sx={{ p: 0 }}>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                            {['#', 'Product', 'Category', 'Unit', 'Purchase', 'Selling',
                                'GST', 'Stock', 'Status', 'Actions'].map((h) => (
                                    <TableCell key={h} sx={{ fontWeight: 700, py: 2 }}>{h}</TableCell>
                                ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">Loading...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : paginated.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                                    <Stack alignItems="center" spacing={2}>
                                        <Avatar sx={{ width: 72, height: 72, bgcolor: '#f9f0ff' }}>
                                            <InventoryIcon sx={{ fontSize: 40, color: '#f093fb' }} />
                                        </Avatar>
                                        <Typography variant="h6" color="text.secondary">
                                            Koi product nahi mila
                                        </Typography>
                                        <GradientButton startIcon={<AddIcon />}
                                            onClick={handleOpenCreate}
                                            gradient="linear-gradient(135deg,#f093fb,#f5576c)">
                                            Pehla Product Add Karo
                                        </GradientButton>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ) : paginated.map((p, i) => (
                            <StyledRow key={p.id}>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                        {page * rowsPerPage + i + 1}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Avatar sx={{ bgcolor: p.category?.color || '#f093fb', width: 36, height: 36, fontSize: 14, fontWeight: 700 }}>
                                            {p.name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>{p.name}</Typography>
                                            {p.sku && (
                                                <Typography variant="caption" color="text.secondary">
                                                    SKU: {p.sku}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    {p.category ? (
                                        <Chip size="small" label={p.category.name}
                                            sx={{ bgcolor: (p.category.color || '#667eea') + '20', color: p.category.color || '#667eea', fontWeight: 600, fontSize: 11 }} />
                                    ) : (
                                        <Typography variant="caption" color="text.disabled">—</Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip label={p.unit} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>{fmt(p.purchase_price)}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600} color="#2e7d32">{fmt(p.selling_price)}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{p.tax_rate}%</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={700}
                                        color={p.is_out_of_stock ? '#ef4444' : p.is_low_stock ? '#ed6c02' : '#2e7d32'}>
                                        {fmtQty(p.current_stock, p.unit)}
                                    </Typography>
                                    {p.low_stock_alert > 0 && (
                                        <LinearProgress variant="determinate"
                                            value={Math.min(Math.round((p.current_stock / p.low_stock_alert) * 100), 100)}
                                            color={p.is_out_of_stock ? 'error' : p.is_low_stock ? 'warning' : 'success'}
                                            sx={{ mt: 0.5, borderRadius: 4, height: 3 }}
                                        />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip label={STOCK_STATUS[p.stock_status]?.label || 'In Stock'}
                                        size="small" color={STOCK_STATUS[p.stock_status]?.color || 'success'}
                                        sx={{ fontWeight: 700 }} />
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={0.5}>
                                        <Tooltip title="View Details" TransitionComponent={Zoom}>
                                            <IconButton size="small" color="info"
                                                onClick={() => handleView(p)}
                                                sx={{ bgcolor: 'rgba(59,130,246,0.1)' }}>
                                                <ViewIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Stock In/Out" TransitionComponent={Zoom}>
                                            <IconButton size="small" color="success"
                                                onClick={() => handleOpenMovement(p)}
                                                sx={{ bgcolor: 'rgba(46,125,50,0.1)' }}>
                                                <AdjustIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit" TransitionComponent={Zoom}>
                                            <IconButton size="small" color="primary"
                                                onClick={() => handleEdit(p)}
                                                sx={{ bgcolor: 'rgba(102,126,234,0.1)' }}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete" TransitionComponent={Zoom}>
                                            <IconButton size="small" color="error"
                                                onClick={() => handleDeleteConfirm(p)}
                                                sx={{ bgcolor: 'rgba(239,68,68,0.1)' }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </StyledRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div" count={filtered.length}
                rowsPerPage={rowsPerPage} page={page}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={(e) => { setRows(parseInt(e.target.value, 10)); setPage(0); }}
                sx={{ borderTop: '1px solid #e2e8f0' }}
            />
        </CardContent>
    </GlassCard>
);

ProductsTable.propTypes = {
    isLoading: PropTypes.bool,
    paginated: PropTypes.array.isRequired,
    filtered: PropTypes.array.isRequired,
    page: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
    setPage: PropTypes.func.isRequired,
    setRows: PropTypes.func.isRequired,
    handleView: PropTypes.func.isRequired,
    handleOpenMovement: PropTypes.func.isRequired,
    handleEdit: PropTypes.func.isRequired,
    handleDeleteConfirm: PropTypes.func.isRequired,
    handleOpenCreate: PropTypes.func.isRequired,
};

export default ProductsTable;
