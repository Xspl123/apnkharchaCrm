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
    Business as BusinessIcon,
    Close as CloseIcon,
    DateRange as DateRangeIcon,
    Edit as EditIcon,
    Save as SaveIcon,
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import SpeechFieldButton from "../../../components/SpeechFieldButton";
import InvoiceItemCard from "./InvoiceItemCard";
import { GlassCard, GradientButton } from "./invoiceStyledComponents";

const INDIAN_STATES = [
    { code: '01', name: 'Jammu & Kashmir' },
    { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' },
    { code: '04', name: 'Chandigarh' },
    { code: '05', name: 'Uttarakhand' },
    { code: '06', name: 'Haryana' },
    { code: '07', name: 'Delhi' },
    { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' },
    { code: '10', name: 'Bihar' },
    { code: '11', name: 'Sikkim' },
    { code: '12', name: 'Arunachal Pradesh' },
    { code: '13', name: 'Nagaland' },
    { code: '14', name: 'Manipur' },
    { code: '15', name: 'Mizoram' },
    { code: '16', name: 'Tripura' },
    { code: '17', name: 'Meghalaya' },
    { code: '18', name: 'Assam' },
    { code: '19', name: 'West Bengal' },
    { code: '20', name: 'Jharkhand' },
    { code: '21', name: 'Odisha' },
    { code: '22', name: 'Chhattisgarh' },
    { code: '23', name: 'Madhya Pradesh' },
    { code: '24', name: 'Gujarat' },
    { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
    { code: '27', name: 'Maharashtra' },
    { code: '28', name: 'Andhra Pradesh' },
    { code: '29', name: 'Karnataka' },
    { code: '30', name: 'Goa' },
    { code: '31', name: 'Lakshadweep' },
    { code: '32', name: 'Kerala' },
    { code: '33', name: 'Tamil Nadu' },
    { code: '34', name: 'Puducherry' },
    { code: '36', name: 'Telangana' },
    { code: '37', name: 'Andhra Pradesh' },
    { code: '38', name: 'Ladakh' },
];

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
}) => {
    const selectedCompany = companies?.find((c) => String(c.id) === String(formData.company_id));

    return (
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
                                <Grid container spacing={3}>

                                    {/* Company & Client Details */}
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" className="invoice-page__field-label">
                                            Select Company *
                                        </Typography>
                                        <Select name="company_id" fullWidth required value={formData.company_id}
                                            onChange={handleChange} displayEmpty
                                            className="invoice-page__select-control">
                                            <MenuItem value="" disabled>🏢 Select Your Company *</MenuItem>
                                            {companies.map((company) => (
                                                <MenuItem key={company.id} value={company.id}>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {company.company_name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {company.city ? `${company.city}, ` : ''}{company.state || 'N/A'} | GST: {company.gstin || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {selectedCompany && (
                                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, display: 'block', mt: 0.5 }}>
                                                📍 Supplier Origin: {selectedCompany.city ? `${selectedCompany.city}, ` : ''}{selectedCompany.state || 'N/A'}
                                            </Typography>
                                        )}
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" className="invoice-page__field-label">
                                            Select Client *
                                        </Typography>
                                        <Select name="client_id" fullWidth required value={formData.client_id}
                                            onChange={handleChange} displayEmpty
                                            className="invoice-page__select-control">
                                            <MenuItem value="" disabled>👤 Select Client *</MenuItem>
                                            {clients.map((client) => (
                                                <MenuItem key={client.id} value={client.id}>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {client.company_name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            GST: {client.gstin || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>

                                    {/* Dates Row (50% - 50%) */}
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" className="invoice-page__field-label">
                                            Invoice Date *
                                        </Typography>
                                        <TextField type="date" name="invoice_date" fullWidth required
                                            value={formData.invoice_date} onChange={handleChange}
                                            InputProps={{
                                                startAdornment: <DateRangeIcon color="action" sx={{ mr: 1 }} />,
                                            }}
                                            className="invoice-page__text-field"
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" className="invoice-page__field-label">
                                            Due Date *
                                        </Typography>
                                        <TextField type="date" name="due_date" fullWidth required
                                            value={formData.due_date} onChange={handleChange}
                                            InputProps={{
                                                startAdornment: <DateRangeIcon color="action" sx={{ mr: 1 }} />,
                                            }}
                                            className="invoice-page__text-field"
                                        />
                                    </Grid>

                                    {/* GST Type Selector */}
                                    <Grid item xs={12}>
                                        <Divider className="invoice-page__divider">
                                            <Chip label="GST DETAILS" size="small" className="invoice-page__divider-chip" />
                                        </Divider>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <RadioGroup row value={gstType} onChange={(e) => setGstType(e.target.value)}>
                                            <FormControlLabel value="intra" control={<Radio color="primary" />}
                                                sx={{
                                                    border: '1.5px solid',
                                                    borderColor: gstType === 'intra' ? '#1976d2' : '#e2e8f0',
                                                    bgcolor: gstType === 'intra' ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                                                    borderRadius: '8px',
                                                    px: 2,
                                                    py: 0.5,
                                                    m: 0,
                                                    mr: 2,
                                                    transition: 'all 0.2s',
                                                }}
                                                label={<Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography variant="body2" fontWeight={gstType === 'intra' ? 700 : 500} color={gstType === 'intra' ? 'primary.main' : 'text.primary'}>
                                                        🏭 Intra-State (CGST + SGST)
                                                    </Typography>
                                                    <Chip size="small" label={gstType === 'intra' ? "✓ Local (Active)" : "Local"} color={gstType === 'intra' ? "primary" : "default"} variant="outlined" sx={{ fontWeight: 700, fontSize: '10px' }} />
                                                </Stack>} />
                                            <FormControlLabel value="inter" control={<Radio color="secondary" />}
                                                sx={{
                                                    border: '1.5px solid',
                                                    borderColor: gstType === 'inter' ? '#9c27b0' : '#e2e8f0',
                                                    bgcolor: gstType === 'inter' ? 'rgba(156, 39, 176, 0.08)' : 'transparent',
                                                    borderRadius: '8px',
                                                    px: 2,
                                                    py: 0.5,
                                                    m: 0,
                                                    transition: 'all 0.2s',
                                                }}
                                                label={<Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography variant="body2" fontWeight={gstType === 'inter' ? 700 : 500} color={gstType === 'inter' ? 'secondary.main' : 'text.primary'}>
                                                        🚚 Inter-State (IGST)
                                                    </Typography>
                                                    <Chip size="small" label={gstType === 'inter' ? "✓ National (Active)" : "National"} color={gstType === 'inter' ? "secondary" : "default"} variant="outlined" sx={{ fontWeight: 700, fontSize: '10px' }} />
                                                </Stack>} />
                                        </RadioGroup>
                                    </Grid>

                                    {/* Place of Supply & Tax Details */}
                                    <Grid item xs={12}>
                                        <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                                            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                                                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '14px' }}>
                                                    <BusinessIcon fontSize="inherit" />
                                                </Avatar>
                                                <Typography variant="subtitle2" fontWeight={700}>
                                                    GST Details
                                                </Typography>
                                                <Chip label="Required for GSTR-1" size="small" color="primary" variant="outlined" sx={{ fontSize: '11px', height: 20 }} />
                                            </Stack>

                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={4}>
                                                    <Typography variant="caption" color="textSecondary" fontWeight={600} display="block" mb={0.5}>
                                                        INVOICE TYPE *
                                                    </Typography>
                                                    <Select fullWidth size="medium" name="invoice_type" value={formData.invoice_type || 'b2b'}
                                                        onChange={handleChange} className="invoice-page__select-control">
                                                        <MenuItem value="b2b">
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Chip label="B2B" size="small" color="primary" sx={{ height: 20, fontSize: '10px', fontWeight: 700 }} />
                                                                <Typography variant="body2">Client ke paas GSTIN hai</Typography>
                                                            </Stack>
                                                        </MenuItem>
                                                        <MenuItem value="b2cl">
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Chip label="B2CL" size="small" color="warning" sx={{ height: 20, fontSize: '10px', fontWeight: 700 }} />
                                                                <Typography variant="body2">B2C Large (&gt; ₹2.5 Lakh Inter-State)</Typography>
                                                            </Stack>
                                                        </MenuItem>
                                                        <MenuItem value="b2cs">
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Chip label="B2CS" size="small" color="default" sx={{ height: 20, fontSize: '10px', fontWeight: 700 }} />
                                                                <Typography variant="body2">B2C Small (Retail / Consumer)</Typography>
                                                            </Stack>
                                                        </MenuItem>
                                                        <MenuItem value="export">
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Chip label="EXPORT" size="small" color="secondary" sx={{ height: 20, fontSize: '10px', fontWeight: 700 }} />
                                                                <Typography variant="body2">Export with / without LUT</Typography>
                                                            </Stack>
                                                        </MenuItem>
                                                    </Select>
                                                </Grid>

                                                <Grid item xs={12} sm={4}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                                        <Typography variant="caption" color="textSecondary" fontWeight={600}>
                                                            PLACE OF SUPPLY *
                                                        </Typography>
                                                        {formData.place_of_supply && (
                                                            <Chip
                                                                size="small"
                                                                label={gstType === 'intra' ? "🏠 Intra (CGST+SGST)" : "🚚 Inter (IGST)"}
                                                                color={gstType === 'intra' ? "primary" : "secondary"}
                                                                sx={{ height: 18, fontSize: '10px', fontWeight: 700 }}
                                                            />
                                                        )}
                                                    </Stack>
                                                    <Select fullWidth size="medium" name="place_of_supply" value={formData.place_of_supply}
                                                        onChange={handleChange}
                                                        displayEmpty className="invoice-page__select-control"
                                                        renderValue={(val) => val ? <Typography variant="body2">{val}</Typography> : <Typography variant="body2" color="text.disabled">Select State</Typography>}>
                                                        <MenuItem value=""><em>Select State</em></MenuItem>
                                                        {INDIAN_STATES.map((s) => (
                                                            <MenuItem key={s.code} value={s.name} sx={{ py: 1.2 }}>
                                                                <Typography variant="body2">{s.name} ({s.code})</Typography>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </Grid>

                                                <Grid item xs={12} sm={4}>
                                                    <Typography variant="caption" color="textSecondary" fontWeight={600} display="block" mb={0.5}>
                                                        REVERSE CHARGE (RCM)
                                                    </Typography>
                                                    <Select fullWidth size="medium" name="is_reverse_charge" value={formData.is_reverse_charge ? "yes" : "no"}
                                                        onChange={(e) => setFormData(p => ({ ...p, is_reverse_charge: e.target.value === "yes" }))}
                                                        className="invoice-page__select-control">
                                                        <MenuItem value="no">
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Typography variant="body2">Not Applicable</Typography>
                                                                <Chip label="NO" size="small" sx={{ height: 18, fontSize: '9px' }} />
                                                            </Stack>
                                                        </MenuItem>
                                                        <MenuItem value="yes">
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Typography variant="body2">Yes — Buyer pays tax (RCM)</Typography>
                                                                <Chip label="RCM" size="small" color="error" sx={{ height: 18, fontSize: '9px', fontWeight: 700 }} />
                                                            </Stack>
                                                        </MenuItem>
                                                    </Select>
                                                </Grid>
                                            </Grid>

                                            <Box sx={{ mt: 1.5, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    ℹ️ {formData.invoice_type === 'b2b'
                                                        ? 'B2B: The client GSTIN will be reported in GSTR-1. CGST+SGST applies to intra-state supplies; IGST applies to inter-state supplies.'
                                                        : formData.invoice_type === 'b2cl'
                                                            ? 'B2CL: Invoice-level reporting required in GSTR-1 Table 5.'
                                                            : formData.invoice_type === 'b2cs'
                                                                ? 'B2CS: Consolidated state-wise reporting in GSTR-1 Table 7.'
                                                                : 'Export: Zero-rated supply reported in GSTR-1 Table 6A.'}
                                                </Typography>
                                            </Box>
                                        </Card>
                                    </Grid>

                                    {/* Items Section */}
                                    <Grid item xs={12}>
                                        <Divider className="invoice-page__divider">
                                            <Chip label="INVOICE ITEMS" size="small" className="invoice-page__divider-chip" />
                                        </Divider>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="h6" className="invoice-page__section-subtitle">
                                                2. Add Items / Services
                                            </Typography>
                                            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddItem}
                                                className="invoice-page__add-item-button">
                                                Add Item
                                            </Button>
                                        </Stack>

                                        {formData.items.map((item, index) => (
                                            <InvoiceItemCard
                                                key={index}
                                                appendSpeech={appendSpeech}
                                                formatCurrency={formatCurrency}
                                                handleHsnSelect={handleHsnSelect}
                                                handleItemChange={handleItemChange}
                                                handleProductSelect={handleProductSelect}
                                                handleRemoveItem={handleRemoveItem}
                                                hsnCodes={hsnCodes}
                                                index={index}
                                                item={item}
                                                itemsCount={formData.items.length}
                                                products={products}
                                                setFormData={setFormData}
                                            />
                                        ))}
                                    </Grid>

                                    {/* Terms & Summary */}
                                    <Grid item xs={12} md={7}>
                                        <Stack spacing={2}>
                                            <Box>
                                                <Typography variant="subtitle2" className="invoice-page__field-label">
                                                    Terms & Conditions
                                                </Typography>
                                                <TextField name="terms_conditions" fullWidth multiline rows={3}
                                                    value={formData.terms_conditions} onChange={handleChange}
                                                    placeholder="1. Payment due within 15 days..."
                                                    className="invoice-page__text-field"
                                                />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" className="invoice-page__field-label">
                                                    Notes
                                                </Typography>
                                                <TextField name="notes" fullWidth multiline rows={2}
                                                    value={formData.notes} onChange={handleChange}
                                                    placeholder="Additional notes for client..."
                                                    InputProps={{
                                                        endAdornment: (
                                                            <SpeechFieldButton onTranscript={(t) =>
                                                                setFormData((p) => ({ ...p, notes: appendSpeech(p.notes, t) }))}
                                                            />
                                                        ),
                                                    }}
                                                    className="invoice-page__text-field"
                                                />
                                            </Box>
                                        </Stack>
                                    </Grid>

                                    <Grid item xs={12} md={5}>
                                        <Paper className="invoice-page__totals-card">
                                            <Typography variant="h6" className="invoice-page__totals-title">
                                                Invoice Summary
                                            </Typography>
                                            <Stack spacing={2} className="invoice-page__totals-stack">
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography color="textSecondary">Subtotal:</Typography>
                                                    <Typography fontWeight={600}>{formatCurrency(totals?.subTotal ?? totals?.subtotal ?? totals?.sub_total ?? 0)}</Typography>
                                                </Stack>

                                                {gstType === 'intra' ? (
                                                    <>
                                                        <Stack direction="row" justifyContent="space-between">
                                                            <Typography color="textSecondary">CGST:</Typography>
                                                            <Typography fontWeight={600} color="primary.main">{formatCurrency(totals.cgst)}</Typography>
                                                        </Stack>
                                                        <Stack direction="row" justifyContent="space-between">
                                                            <Typography color="textSecondary">SGST:</Typography>
                                                            <Typography fontWeight={600} color="primary.main">{formatCurrency(totals.sgst)}</Typography>
                                                        </Stack>
                                                    </>
                                                ) : (
                                                    <Stack direction="row" justifyContent="space-between">
                                                        <Typography color="textSecondary">IGST (Inter-State):</Typography>
                                                        <Typography fontWeight={600} color="secondary.main">{formatCurrency(totals.igst)}</Typography>
                                                    </Stack>
                                                )}

                                                <Divider />

                                                <Stack direction="row" justifyContent="space-between" className="invoice-page__grand-total-row">
                                                    <Typography variant="h6" fontWeight={700}>Total Amount:</Typography>
                                                    <Typography variant="h6" fontWeight={700} color="primary.main">
                                                        {formatCurrency(totals?.grandTotal ?? totals?.total ?? totals?.total_amount ?? 0)}
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        </Paper>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 2 }} />
                                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                                            <Button variant="outlined" startIcon={<CloseIcon />} onClick={handleCancel}
                                                className="invoice-page__cancel-button">
                                                Cancel
                                            </Button>
                                            <GradientButton type="submit" startIcon={<SaveIcon />}
                                                className="invoice-page__submit-button">
                                                {editMode ? "Update Invoice" : "Create Invoice"}
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
};

export default InvoiceFormSection;