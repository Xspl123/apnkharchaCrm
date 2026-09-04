import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    FormControlLabel,
    Grid,
    InputAdornment,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    Add as AddIcon,
    AttachMoney as AttachMoneyIcon,
    Business as BusinessIcon,
    Close as CloseIcon,
    DateRange as DateRangeIcon,
    Description as DescriptionIcon,
    Edit as EditIcon,
    Receipt as ReceiptIcon,
    Save as SaveIcon,
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import SpeechFieldButton from "../../../components/SpeechFieldButton";
import InvoiceItemCard from "./InvoiceItemCard";
import { GlassCard, GradientButton } from "./invoiceStyledComponents";

const InvoiceFormSection = ({
    appendSpeech,
    clients,
    companies,
    editMode,
    formData,
    formatCurrency,
    gstType,
    handleAddItem,
    handleCancel,
    handleChange,
    handleHsnSelect,
    handleItemChange,
    handleProductSelect,
    handleRemoveItem,
    handleSubmit,
    hsnCodes,
    products,
    selectedInvoice,
    setFormData,
    setGstType,
    showForm,
    totals,
}) => (
        <AnimatePresence>
            {showForm && (
                <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }} transition={{ duration: 0.3 }}>
                    <GlassCard className="invoice-page__form-shell">
                        <CardContent className="invoice-page__form-content">
                            <Stack direction="row" alignItems="center" spacing={2} className="invoice-page__form-header">
                                <Avatar className="invoice-page__form-avatar">
                                    {editMode ? <EditIcon /> : <AddIcon />}
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" className="invoice-page__form-title">
                                        {editMode ? "Edit Invoice" : "Create New Invoice"}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {editMode
                                            ? `Editing invoice #${selectedInvoice?.invoice_no}`
                                            : "Fill in the details to generate a professional invoice"}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Divider className="invoice-page__form-divider" />

                            <form onSubmit={handleSubmit}>
                                <Grid container spacing={4}>

                                    {/* Step 1: Company & Client */}
                                    <Grid item xs={12}>
                                        <Typography variant="h6" className="invoice-page__section-title">
                                            <BusinessIcon className="invoice-page__section-icon" />
                                            1. Company & Client Details
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Select name="company_id" fullWidth required value={formData.company_id}
                                            onChange={handleChange} displayEmpty
                                            className="invoice-page__select-control">
                                            <MenuItem value="" disabled>🏢 Select Your Company *</MenuItem>
                                            {companies.map((company) => (
                                                <MenuItem key={company.id} value={company.id}>
                                                    <Stack>
                                                        <Typography variant="body1">{company.company_name}</Typography>
                                                        <Typography variant="caption" color="textSecondary">GST: {company.gstin}</Typography>
                                                    </Stack>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {editMode && (
                                            <Typography variant="caption" color="info" className="invoice-page__helper-text">
                                                Selected Company ID: {formData.company_id || "None"} | Companies Loaded: {companies.length}
                                            </Typography>
                                        )}
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Select name="client_id" fullWidth required value={formData.client_id}
                                            onChange={handleChange} displayEmpty
                                            className="invoice-page__select-control">
                                            <MenuItem value="" disabled>👤 Select Client *</MenuItem>
                                            {clients.map((client) => (
                                                <MenuItem key={client.id} value={client.id}>
                                                    <Stack>
                                                        <Typography variant="body1">{client.company_name}</Typography>
                                                        <Typography variant="caption" color="textSecondary">GST: {client.gstin}</Typography>
                                                    </Stack>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField label="Invoice Number" name="invoice_no" fullWidth required
                                            value={formData.invoice_no} onChange={handleChange}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start"><ReceiptIcon color="action" /></InputAdornment>,
                                                endAdornment: <InputAdornment position="end"><SpeechFieldButton onTranscript={(text) => setFormData((prev) => ({ ...prev, invoice_no: appendSpeech(prev.invoice_no, text) }))} /></InputAdornment>,
                                            }}
                                            className="invoice-page__field-rounded" />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField label="Invoice Date" type="date" name="invoice_date" fullWidth required
                                            InputLabelProps={{ shrink: true }} value={formData.invoice_date} onChange={handleChange}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><DateRangeIcon color="action" /></InputAdornment> }}
                                            className="invoice-page__field-rounded" />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField label="Due Date" type="date" name="due_date" fullWidth required
                                            InputLabelProps={{ shrink: true }} value={formData.due_date} onChange={handleChange}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><DateRangeIcon color="action" /></InputAdornment> }}
                                            className="invoice-page__field-rounded" />
                                    </Grid>

                                    {/* GST Type */}
                                    <Grid item xs={12}>
                                        <Divider className="invoice-page__section-divider"><Chip label="GST DETAILS" className="invoice-page__section-chip" /></Divider>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <RadioGroup row value={gstType} onChange={(e) => setGstType(e.target.value)}>
                                            <FormControlLabel value="intra" control={<Radio />}
                                                label={<Stack direction="row" alignItems="center" spacing={1}><span>🏭 Intra-State (CGST + SGST)</span><Chip size="small" label="Local" color="primary" variant="outlined" /></Stack>} />
                                            <FormControlLabel value="inter" control={<Radio />}
                                                label={<Stack direction="row" alignItems="center" spacing={1}><span>🚚 Inter-State (IGST)</span><Chip size="small" label="National" color="secondary" variant="outlined" /></Stack>} />
                                        </RadioGroup>
                                    </Grid>

                                    {/* GST Details Box */}
                                    <Box className="invoice-page__gst-box">
                                        <Stack direction="row" alignItems="center" spacing={1.5} className="invoice-page__gst-header">
                                            <Avatar className="invoice-page__gst-avatar"><ReceiptIcon className="invoice-page__gst-avatar-icon" /></Avatar>
                                            <Typography variant="subtitle1" fontWeight={700}>GST Details</Typography>
                                            <Chip label="Required for GSTR-1" size="small" color="primary" variant="outlined" className="invoice-page__gst-chip" />
                                        </Stack>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1} className="invoice-page__gst-label">Invoice Type *</Typography>
                                                <Select fullWidth size="medium" value={formData.invoice_type}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, invoice_type: e.target.value }))}
                                                    className="invoice-page__select-control"
                                                    renderValue={(val) => {
                                                        const map = { b2b: { label: 'B2B', sub: 'Client ke paas GSTIN hai', color: '#1976d2' }, b2cs: { label: 'B2CS', sub: 'No GSTIN, amount < 2.5L', color: '#2e7d32' }, b2cl: { label: 'B2CL', sub: 'No GSTIN, amount ≥ 2.5L', color: '#ed6c02' }, export: { label: 'Export', sub: 'Foreign client ko supply', color: '#9c27b0' } };
                                                        const item = map[val];
                                                        return <Stack direction="row" spacing={1.5} alignItems="center"><Chip label={item.label} size="small" sx={{ bgcolor: item.color, color: '#fff', fontWeight: 700, minWidth: 52 }} /><Typography variant="body2" color="text.secondary">{item.sub}</Typography></Stack>;
                                                    }}>
                                                    {[{ value: 'b2b', label: 'B2B', sub: 'Client ke paas GSTIN hai', color: '#1976d2' }, { value: 'b2cs', label: 'B2CS', sub: 'No GSTIN, amount < 2.5L', color: '#2e7d32' }, { value: 'b2cl', label: 'B2CL', sub: 'No GSTIN, amount ≥ 2.5L', color: '#ed6c02' }, { value: 'export', label: 'Export', sub: 'Foreign client ko supply', color: '#9c27b0' }].map((opt) => (
                                                        <MenuItem key={opt.value} value={opt.value} sx={{ py: 1.5 }}>
                                                            <Stack direction="row" spacing={1.5} alignItems="center"><Chip label={opt.label} size="small" sx={{ bgcolor: opt.color, color: '#fff', fontWeight: 700, minWidth: 52 }} /><Typography variant="body2">{opt.sub}</Typography></Stack>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1} className="invoice-page__gst-label">Place of Supply</Typography>
                                                <Select fullWidth size="medium" value={formData.place_of_supply}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, place_of_supply: e.target.value }))}
                                                    displayEmpty className="invoice-page__select-control"
                                                    renderValue={(val) => val ? <Typography variant="body2">{val}</Typography> : <Typography variant="body2" color="text.disabled">Select State</Typography>}>
                                                    <MenuItem value=""><em>Select State</em></MenuItem>
                                                    {['Jammu & Kashmir','Himachal Pradesh','Punjab','Chandigarh','Uttarakhand','Haryana','Delhi','Rajasthan','Uttar Pradesh','Bihar','Assam','West Bengal','Jharkhand','Odisha','Chhattisgarh','Madhya Pradesh','Gujarat','Maharashtra','Karnataka','Goa','Kerala','Tamil Nadu','Telangana','Andhra Pradesh','Ladakh'].map((state) => (
                                                        <MenuItem key={state} value={state} sx={{ py: 1.2 }}><Typography variant="body2">{state}</Typography></MenuItem>
                                                    ))}
                                                </Select>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1} className="invoice-page__gst-label">Reverse Charge (RCM)</Typography>
                                                <Paper elevation={0} onClick={() => setFormData((prev) => ({ ...prev, is_reverse_charge: !prev.is_reverse_charge }))}
                                                    sx={{ height: 56, px: 2, borderRadius: '12px', border: '1.5px solid', borderColor: formData.is_reverse_charge ? '#ed6c02' : 'rgba(102,126,234,0.4)', bgcolor: formData.is_reverse_charge ? 'rgba(237,108,2,0.06)' : 'background.paper', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease' }}>
                                                    <Typography variant="body2" fontWeight={600} color={formData.is_reverse_charge ? '#ed6c02' : 'text.secondary'}>
                                                        {formData.is_reverse_charge ? '⚠️ RCM Applicable' : 'Not Applicable'}
                                                    </Typography>
                                                    <Chip label={formData.is_reverse_charge ? 'YES' : 'NO'} size="small" sx={{ fontWeight: 700, bgcolor: formData.is_reverse_charge ? '#ed6c02' : 'grey.200', color: formData.is_reverse_charge ? '#fff' : 'text.secondary', minWidth: 44 }} />
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Paper elevation={0} sx={{ px: 2.5, py: 1.5, borderRadius: '10px', borderLeft: '4px solid', borderColor: { b2b: '#1976d2', b2cs: '#2e7d32', b2cl: '#ed6c02', export: '#9c27b0' }[formData.invoice_type], bgcolor: { b2b: 'rgba(25,118,210,0.05)', b2cs: 'rgba(46,125,50,0.05)', b2cl: 'rgba(237,108,2,0.05)', export: 'rgba(156,39,176,0.05)' }[formData.invoice_type] }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                        {formData.invoice_type === 'b2b'    && '✅ B2B: Client ka GSTIN GSTR-1 mein report hoga. Supply type ke hisaab se CGST+SGST (intra) ya IGST (inter) lagega.'}
                                                        {formData.invoice_type === 'b2cs'   && '🟢 B2CS: Consumer invoice, amount 2.5L se kam, intra-state. State-wise grouped summary GSTR-1 mein jaayegi.'}
                                                        {formData.invoice_type === 'b2cl'   && '🟡 B2CL: Consumer invoice, amount 2.5L ya zyada, inter-state. Invoice-wise detail GSTR-1 mein separately jaayegi.'}
                                                        {formData.invoice_type === 'export' && '🟣 Export: Foreign client ko supply. Zero-rated ya IGST with refund claim. GSTR-1 mein Export section mein jaayega.'}
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {/* Step 2: Items */}
                                    <Grid item xs={12}>
                                        <Divider className="invoice-page__section-divider"><Chip label="INVOICE ITEMS" className="invoice-page__section-chip" /></Divider>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="h6" className="invoice-page__section-title">
                                            <DescriptionIcon className="invoice-page__section-icon" />
                                            2. Add Items / Services
                                        </Typography>
                                    </Grid>

                                    {formData.items.map((item, index) => {
                                        const linkedProduct = products?.find(p => p.id === item.product_id) || null;
                                        const stockWarn = linkedProduct && (
                                            linkedProduct.is_out_of_stock
                                                ? { msg: `⚠️ Out of Stock! (${linkedProduct.name})`, color: 'error' }
                                                : Number(item.qty) > Number(linkedProduct.current_stock)
                                                    ? { msg: `⚠️ Available stock: ${linkedProduct.current_stock} ${linkedProduct.unit}`, color: 'warning' }
                                                    : null
                                        );

                                        return (
                                            <InvoiceItemCard
                                                appendSpeech={appendSpeech}
                                                formatCurrency={formatCurrency}
                                                handleHsnSelect={handleHsnSelect}
                                                handleItemChange={handleItemChange}
                                                handleProductSelect={handleProductSelect}
                                                handleRemoveItem={handleRemoveItem}
                                                hsnCodes={hsnCodes}
                                                index={index}
                                                item={item}
                                                itemCount={formData.items.length}
                                                key={index}
                                                linkedProduct={linkedProduct}
                                                products={products}
                                                stockWarn={stockWarn}
                                            />
                                        );
                                    })}

                                    {/* Add Item Button */}
                                    <Grid item xs={12}>
                                        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddItem} fullWidth
                                            className="invoice-page__add-item">
                                            Add Another Item
                                        </Button>
                                    </Grid>

                                    {/* Step 3: Summary & Notes */}
                                    <Grid item xs={12}>
                                        <Divider className="invoice-page__section-divider"><Chip label="SUMMARY & NOTES" className="invoice-page__section-chip" /></Divider>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="h6" className="invoice-page__section-title">
                                            <AttachMoneyIcon className="invoice-page__section-icon" />
                                            3. Invoice Summary
                                        </Typography>
                                    </Grid>

                                    {/* Totals */}
                                    <Grid item xs={12}>
                                        <Card className="invoice-page__totals-card">
                                            <Grid container spacing={3} alignItems="center">
                                                <Grid item xs={12} md={3}>
                                                    <Typography variant="body2" className="invoice-page__totals-label">Subtotal</Typography>
                                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatCurrency(totals.subTotal)}</Typography>
                                                </Grid>
                                                {gstType === 'intra' ? (
                                                    <>
                                                        <Grid item xs={6} md={2}>
                                                            <Typography variant="body2" className="invoice-page__totals-label">CGST</Typography>
                                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>{formatCurrency(totals.cgst)}</Typography>
                                                        </Grid>
                                                        <Grid item xs={6} md={2}>
                                                            <Typography variant="body2" className="invoice-page__totals-label">SGST</Typography>
                                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>{formatCurrency(totals.sgst)}</Typography>
                                                        </Grid>
                                                    </>
                                                ) : (
                                                    <Grid item xs={12} md={4}>
                                                        <Typography variant="body2" className="invoice-page__totals-label">IGST</Typography>
                                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{formatCurrency(totals.igst)}</Typography>
                                                    </Grid>
                                                )}
                                                <Grid item xs={12} md={3}>
                                                    <Typography variant="body2" className="invoice-page__totals-label">Grand Total</Typography>
                                                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{formatCurrency(totals.grandTotal)}</Typography>
                                                </Grid>
                                            </Grid>
                                        </Card>
                                    </Grid>

                                    {/* Notes */}
                                    <Grid item xs={12}>
                                        <TextField label="Notes / Terms & Conditions" name="notes" fullWidth multiline rows={4}
                                            value={formData.notes} onChange={handleChange}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end"><SpeechFieldButton onTranscript={(text) => setFormData((prev) => ({ ...prev, notes: appendSpeech(prev.notes, text) }))} /></InputAdornment>,
                                            }}
                                            placeholder="Payment terms, delivery information, additional notes..."
                                            className="invoice-page__notes" />
                                    </Grid>

                                    {/* Action Buttons */}
                                    <Grid item xs={12}>
                                        <Divider className="invoice-page__actions-divider" />
                                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                                            <Button variant="outlined" color="error" size="large"
                                                onClick={handleCancel} startIcon={<CloseIcon />}
                                                className="invoice-page__cancel-action">
                                                Cancel
                                            </Button>
                                            <GradientButton type="submit" size="large" startIcon={<SaveIcon />} className="invoice-page__submit-action">
                                                {editMode ? "Update Invoice" : "Save Invoice"}
                                            </GradientButton>
                                        </Stack>
                                    </Grid>

                                </Grid>
                            </form>
                        </CardContent>
                    </GlassCard>
                </motion.div>
            )}
        </AnimatePresence>
);

export default InvoiceFormSection;
