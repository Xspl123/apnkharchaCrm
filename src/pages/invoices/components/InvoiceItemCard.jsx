import {
    Alert,
    Autocomplete,
    Badge,
    Box,
    Card,
    Chip,
    Grid,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    Delete as DeleteIcon,
    Inventory as InventoryIcon,
    Percent as PercentIcon,
} from "@mui/icons-material";
import SpeechFieldButton from "../../../components/SpeechFieldButton";

const InvoiceItemCard = ({
    appendSpeech,
    formatCurrency,
    handleHsnSelect,
    handleItemChange,
    handleProductSelect,
    handleRemoveItem,
    hsnCodes,
    index,
    item,
    itemCount,
    linkedProduct,
    products,
    stockWarn,
}) => (
        <Grid item xs={12} key={index}>
            <Card className={`invoice-page__item-card ${item.product_id ? "invoice-page__item-card--linked" : index % 2 === 0 ? "invoice-page__item-card--striped" : ""}`}>
                {/* Item Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" className="invoice-page__item-header">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Badge badgeContent={index + 1} color="primary" className="invoice-page__item-badge" />
                        <Typography variant="subtitle1" className="invoice-page__item-title">
                            Item #{index + 1}
                        </Typography>
                        {linkedProduct && (
                            <Chip
                                icon={<InventoryIcon sx={{ fontSize: '14px !important' }} />}
                                label={`Inventory: ${linkedProduct.name}`}
                                size="small"
                                className="invoice-page__inventory-chip"
                            />
                        )}
                    </Stack>
                    {itemCount > 1 && (
                        <IconButton color="error" onClick={() => handleRemoveItem(index)} size="small"
                            className="invoice-page__remove-item">
                            <DeleteIcon />
                        </IconButton>
                    )}
                </Stack>

                {/* Stock warning */}
                {stockWarn && (
                    <Alert severity={stockWarn.color} className="invoice-page__stock-alert">
                        {stockWarn.msg}
                    </Alert>
                )}

                <Grid container spacing={3}>

                    {/* Inventory Product Select */}
                    <Grid item xs={12} md={6}>
                        <Autocomplete
                            freeSolo
                            options={products || []}
                            getOptionLabel={(option) =>
                                typeof option === 'string' ? option : option.name || ''
                            }
                            value={linkedProduct || item.item_name || null}
                            onChange={(_, newValue) => {
                                if (typeof newValue === 'string') {
                                    handleItemChange(index, 'item_name', newValue);
                                } else if (newValue) {
                                    handleProductSelect(index, newValue);
                                } else {
                                    handleItemChange(index, 'item_name', '');
                                    handleItemChange(index, 'product_id', null);
                                }
                            }}
                            onInputChange={(_, value, reason) => {
                                if (reason === 'input') {
                                    handleItemChange(index, 'item_name', value);
                                }
                            }}
                            filterOptions={(options, { inputValue }) =>
                                (options || [])
                                    .filter(o =>
                                        o.name?.toLowerCase().includes(inputValue.toLowerCase()) ||
                                        o.sku?.toLowerCase().includes(inputValue.toLowerCase()) ||
                                        o.hsn_code?.toLowerCase().includes(inputValue.toLowerCase())
                                    )
                                    .slice(0, 20)
                            }
                            renderOption={(props, option) => (
                                <Box component="li" {...props} key={option.id}>
                                    <Stack spacing={0.3} className="invoice-page__product-option">
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" fontWeight={700}>{option.name}</Typography>
                                            <Chip
                                                label={
                                                    option.is_out_of_stock ? 'Out of Stock' :
                                                    option.is_low_stock    ? `Low: ${option.current_stock}` :
                                                    `Stock: ${option.current_stock} ${option.unit}`
                                                }
                                                size="small"
                                                color={option.is_out_of_stock ? 'error' : option.is_low_stock ? 'warning' : 'success'}
                                                className="invoice-page__option-stock-chip"
                                            />
                                        </Stack>
                                        <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
                                            {option.sku && (
                                                <Typography variant="caption" color="text.secondary">
                                                    SKU: {option.sku}
                                                </Typography>
                                            )}
                                            {option.hsn_code && (
                                                <Chip label={`HSN: ${option.hsn_code}`} size="small"
                                                    className="invoice-page__option-code-chip invoice-page__option-code-chip--hsn" />
                                            )}
                                            <Chip
                                                label={`₹${Number(option.selling_price || 0).toLocaleString('en-IN')}`}
                                                size="small"
                                                className="invoice-page__option-code-chip invoice-page__option-code-chip--price"
                                            />
                                            <Chip label={`GST ${option.tax_rate}%`} size="small"
                                                className="invoice-page__option-code-chip invoice-page__option-code-chip--gst" />
                                        </Stack>
                                    </Stack>
                                </Box>
                            )}
                            renderInput={(params) => (
                                <TextField {...params}
                                    label="🏪 Product (Inventory se select karo)"
                                    placeholder="Name, SKU ya HSN se search karo..."
                                    required
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                <InputAdornment position="start">
                                                    <InventoryIcon color="action" sx={{ fontSize: 18 }} />
                                                </InputAdornment>
                                                {params.InputProps.startAdornment}
                                            </>
                                        ),
                                        endAdornment: (
                                            <>
                                                <SpeechFieldButton onTranscript={(text) => handleItemChange(index, "item_name", appendSpeech(item.item_name, text))} />
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '10px',
                                            bgcolor: item.product_id ? 'rgba(17,153,142,0.04)' : 'transparent',
                                        }
                                    }}
                                />
                            )}
                            noOptionsText={
                                <Typography variant="body2" color="text.secondary">
                                    Inventory mein nahi mila — manually type karo
                                </Typography>
                            }
                        />
                    </Grid>

                    {/* HSN / SAC Code */}
                    <Grid item xs={12} md={6}>
                        <Autocomplete
                            options={hsnCodes}
                            getOptionLabel={(option) =>
                                `${option.hsn_code} - ${option.description}`
                            }
                            value={hsnCodes.find(h => h.hsn_code === item.hsn_code) || null}
                            onChange={(_, newValue) => handleHsnSelect(index, newValue)}
                            renderInput={(params) => (
                                <TextField {...params}
                                    label="Search HSN/SAC Code"
                                    required
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                <InputAdornment position="start"><PercentIcon color="action" /></InputAdornment>
                                                {params.InputProps.startAdornment}
                                            </>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '10px',
                                            bgcolor: item.product_id ? 'rgba(17,153,142,0.04)' : 'transparent',
                                        }
                                    }}
                                />
                            )}
                            renderOption={(props, option) => (
                                <li {...props}>
                                    <Box>
                                        <Typography variant="body2" fontWeight="600">{option.hsn_code}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {option.description} | GST: {option.gst_rate}%
                                        </Typography>
                                    </Box>
                                </li>
                            )}
                        />
                    </Grid>

                    {/* Description */}
                    <Grid item xs={12}>
                        <TextField label="Description" fullWidth multiline rows={2}
                            value={item.description}
                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                            placeholder="Detailed description of the item/service"
                            InputProps={{
                                endAdornment: <InputAdornment position="end"><SpeechFieldButton onTranscript={(text) => handleItemChange(index, "description", appendSpeech(item.description, text))} /></InputAdornment>,
                            }}
                            className="invoice-page__field-rounded-sm"
                        />
                    </Grid>

                    {/* Qty */}
                    <Grid item xs={6} md={2}>
                        <TextField label="Qty" type="number" fullWidth required
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                            inputProps={{ min: 0.01, step: 0.01 }}
                            className="invoice-page__field-rounded-sm"
                        />
                    </Grid>

                    {/* Unit */}
                    <Grid item xs={6} md={2}>
                        <TextField label="Unit" fullWidth
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                            placeholder="pcs"
                            className={`invoice-page__field-rounded-sm ${item.product_id ? "invoice-page__field-linked" : ""}`}
                        />
                    </Grid>

                    {/* Rate */}
                    <Grid item xs={6} md={2}>
                        <TextField label="Rate" type="number" fullWidth required
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            inputProps={{ min: 0, step: 0.01 }}
                            className={`invoice-page__field-rounded-sm ${item.product_id ? "invoice-page__field-linked" : ""}`}
                        />
                    </Grid>

                    {/* Tax Rate */}
                    <Grid item xs={6} md={2}>
                        <TextField label="Tax %" type="number" fullWidth
                            value={item.tax_rate}
                            onChange={(e) => handleItemChange(index, "tax_rate", e.target.value)}
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                            className={`invoice-page__field-rounded-sm ${item.product_id ? "invoice-page__field-linked" : ""}`}
                        />
                    </Grid>

                    {/* Amount (read-only) */}
                    <Grid item xs={6} md={2}>
                        <TextField label="Amount" fullWidth
                            value={formatCurrency(item.amount)} disabled
                            className="invoice-page__field-rounded-sm invoice-page__field-amount"
                        />
                    </Grid>

                    {/* Tax Amount (read-only) */}
                    <Grid item xs={6} md={2}>
                        <TextField label="Tax Amount" fullWidth
                            value={formatCurrency(item.tax_amount)} disabled
                            className="invoice-page__field-rounded-sm invoice-page__field-tax"
                        />
                    </Grid>

                </Grid>
            </Card>
        </Grid>
);

export default InvoiceItemCard;
