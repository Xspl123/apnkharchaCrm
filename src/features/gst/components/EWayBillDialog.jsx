import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Stack,
    Grid,
    TextField,
    Button,
    Tabs,
    Tab,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    Divider,
    Alert,
    CircularProgress,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    Paper,
    IconButton,
} from '@mui/material';
import {
    Close as CloseIcon,
    LocalShipping as TruckIcon,
    FileDownload as DownloadIcon,
    QrCode2 as QrCodeIcon,
    Print as PrintIcon,
    CheckCircle as CheckCircleIcon,
    Save as SaveIcon,
    ElectricBolt as BoltIcon,
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import eInvoiceService from '../services/eInvoiceService';

// Safe number parser stripping currency symbols, commas, or any non-numeric noise
const cleanNum = (v) => {
    if (v === null || v === undefined || v === '') return 0;
    const s = String(v).replace(/[^0-9.-]/g, '').trim();
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
};

const fmt = (v) => `₹${cleanNum(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function EWayBillDialog({ open, onClose, invoice, onUpdated }) {
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [downloadingEwb, setDownloadingEwb] = useState(false);
    const [downloadingEinv, setDownloadingEinv] = useState(false);
    const [generatingIrn, setGeneratingIrn] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const [formData, setFormData] = useState({
        transporter_id: '',
        transporter_name: '',
        trans_mode: '1',
        trans_doc_no: '',
        trans_doc_date: '',
        vehicle_no: '',
        vehicle_type: 'R',
        distance_km: 50,
        eway_bill_no: '',
        eway_bill_date: '',
    });

    useEffect(() => {
        if (invoice) {
            setFormData({
                transporter_id: invoice.transporter_id || '',
                transporter_name: invoice.transporter_name || '',
                trans_mode: invoice.trans_mode || '1',
                trans_doc_no: invoice.trans_doc_no || '',
                trans_doc_date: invoice.trans_doc_date ? invoice.trans_doc_date.split('T')[0] : '',
                vehicle_no: invoice.vehicle_no || '',
                vehicle_type: invoice.vehicle_type || 'R',
                distance_km: invoice.distance_km || 50,
                eway_bill_no: invoice.eway_bill_no || '',
                eway_bill_date: invoice.eway_bill_date ? invoice.eway_bill_date.split('T')[0] : '',
            });
            setFeedback(null);
        }
    }, [invoice, open]);

    if (!invoice) return null;

    const company = invoice.company || {};
    const client = invoice.client || {};
    const items = invoice.items || [];
    const isEwbEligible = cleanNum(invoice.total_amount) >= 50000;

    const handleDownloadEwbJson = async () => {
        setDownloadingEwb(true);
        setFeedback(null);
        try {
            const res = await eInvoiceService.downloadEWayBillJson(invoice.id, formData);
            const blob = new Blob([res.data], { type: 'application/json' });
            saveAs(blob, `EWB_${String(invoice.invoice_no).replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
            setFeedback({ type: 'success', message: 'E-Way Bill JSON downloaded! Ready for upload on ewaybillgst.gov.in' });
        } catch (err) {
            console.error('EWB Download Error:', err);
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to download E-Way Bill JSON' });
        } finally {
            setDownloadingEwb(false);
        }
    };

    const handleDownloadEinvJson = async () => {
        setDownloadingEinv(true);
        setFeedback(null);
        try {
            const res = await eInvoiceService.downloadEInvoiceJson(invoice.id);
            const blob = new Blob([res.data], { type: 'application/json' });
            saveAs(blob, `EINV_${String(invoice.invoice_no).replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
            setFeedback({ type: 'success', message: 'E-Invoice Schema 1.03 JSON downloaded! Ready for IRP portal upload' });
        } catch (err) {
            console.error('E-Invoice Download Error:', err);
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to download E-Invoice JSON' });
        } finally {
            setDownloadingEinv(false);
        }
    };

    const handleSavePartB = async () => {
        setLoading(true);
        setFeedback(null);
        try {
            const res = await eInvoiceService.saveEWayBill(invoice.id, formData);
            setFeedback({ type: 'success', message: 'Transportation & Part-B details saved successfully!' });
            if (onUpdated) onUpdated(res.data?.data || res.data);
        } catch (err) {
            console.error('Save Part-B Error:', err);
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to save Part-B details' });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateIrn = async () => {
        setGeneratingIrn(true);
        setFeedback(null);
        try {
            const res = await eInvoiceService.generateIrn(invoice.id);
            setFeedback({ type: 'success', message: 'IRN & Signed QR successfully generated!' });
            if (onUpdated) onUpdated({ ...invoice, ...res.data?.data });
        } catch (err) {
            console.error('Generate IRN Error:', err);
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to generate IRN' });
        } finally {
            setGeneratingIrn(false);
        }
    };

    const handlePrintEwbSlip = () => {
        const ewbNo = formData.eway_bill_no ? formData.eway_bill_no : ('DRAFT-EWB-' + (invoice.invoice_no || ''));
        const ewbDate = formData.eway_bill_date ? formData.eway_bill_date : new Date().toLocaleDateString('en-IN');
        const compGstin = company.gstin ? company.gstin : 'URP';
        const compName = company.company_name ? company.company_name : 'Merchant';
        const compAddr = company.address ? company.address : '';
        const clientGstin = client.gstin ? client.gstin : 'URP';
        const clientName = client.company_name ? client.company_name : 'Customer';
        const clientAddr = client.address ? client.address : '';
        const taxableVal = cleanNum(invoice.sub_total).toFixed(2);
        const totalVal = cleanNum(invoice.total_amount).toFixed(2);
        const vehNo = formData.vehicle_no ? formData.vehicle_no : 'NOT SPECIFIED';
        const transName = formData.transporter_name ? formData.transporter_name : 'Self / Own Vehicle';
        const transId = formData.transporter_id ? formData.transporter_id : '—';
        const lrNo = formData.trans_doc_no ? formData.trans_doc_no : '—';
        const lrDate = formData.trans_doc_date ? formData.trans_doc_date : '—';
        const distKm = formData.distance_km ? formData.distance_km : 50;

        const html = `<!DOCTYPE html>
<html>
<head>
    <title>E-Way Bill Slip - ${invoice.invoice_no}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 13px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
        .title { font-size: 18px; font-weight: bold; }
        .subtitle { font-size: 13px; color: #475569; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
        .table th, .table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        .table th { background: #f1f5f9; font-weight: bold; }
        .section-title { background: #e2e8f0; font-weight: bold; padding: 6px 8px; margin-top: 12px; }
        .barcode { text-align: center; margin: 15px 0; font-family: monospace; font-size: 16px; letter-spacing: 4px; font-weight: bold; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">E-WAY BILL / CONSIGNMENT NOTE</div>
        <div class="subtitle">e-Way Bill Generation Under GST Rules</div>
    </div>
    <div class="barcode">E-WAY BILL: ${invoice.invoice_no}</div>
    <table class="table">
        <tr>
            <td><strong>e-Way Bill No:</strong> ${ewbNo}</td>
            <td><strong>e-Way Bill Date:</strong> ${ewbDate}</td>
        </tr>
        <tr>
            <td><strong>Generated By:</strong> ${compGstin} - ${compName}</td>
            <td><strong>Valid Upto:</strong> Approx 1 Day (Distance: ${distKm} km)</td>
        </tr>
    </table>

    <div class="section-title">PART-A: INVOICE & GOODS DETAILS</div>
    <table class="table">
        <tr>
            <td><strong>Doc Type & No:</strong> TAX INVOICE - ${invoice.invoice_no}</td>
            <td><strong>Doc Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</td>
        </tr>
        <tr>
            <td><strong>Consignor (From):</strong><br/>${compName}<br/>GSTIN: ${compGstin}<br/>${compAddr}</td>
            <td><strong>Consignee (To):</strong><br/>${clientName}<br/>GSTIN: ${clientGstin}<br/>${clientAddr}</td>
        </tr>
        <tr>
            <td><strong>Total Taxable Value:</strong> ₹${taxableVal}</td>
            <td><strong>Total Invoice Value:</strong> ₹${totalVal}</td>
        </tr>
    </table>

    <div class="section-title">PART-B: VEHICLE & TRANSPORT DETAILS</div>
    <table class="table">
        <tr>
            <td><strong>Mode:</strong> Road</td>
            <td><strong>Vehicle Registration No:</strong> ${vehNo}</td>
        </tr>
        <tr>
            <td><strong>Transporter:</strong> ${transName}</td>
            <td><strong>Transporter ID:</strong> ${transId}</td>
        </tr>
        <tr>
            <td><strong>Doc / LR No:</strong> ${lrNo}</td>
            <td><strong>Doc Date:</strong> ${lrDate}</td>
        </tr>
    </table>
    <div style="margin-top: 30px; display: flex; justify-content: space-between; text-align: center;">
        <div>____________________<br/>Driver Signature</div>
        <div>____________________<br/>Authorized Signatory</div>
    </div>
    <script>window.onload = function() { window.print(); window.close(); }</script>
</body>
</html>`;

        const win = window.open('', '', 'width=900,height=700');
        win.document.write(html);
        win.document.close();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
            <DialogTitle sx={{ p: 2.5, bgcolor: '#0f172a', color: 'white' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(59, 130, 246, 0.2)' }}>
                            <TruckIcon sx={{ color: '#60a5fa', fontSize: 28 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                E-Way Bill & E-Invoice Engine
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Invoice #{invoice.invoice_no} | Consignment Total: {fmt(invoice.total_amount)}
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: 'white' } }}>
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: '#f8fafc' }}>
                <Tabs value={tab} onChange={(e, val) => setTab(val)} textColor="primary" indicatorColor="primary">
                    <Tab icon={<TruckIcon />} iconPosition="start" label="Part-B Transport Details" sx={{ fontWeight: 600, textTransform: 'none' }} />
                    <Tab icon={<DownloadIcon />} iconPosition="start" label="Part-A Consignment Summary" sx={{ fontWeight: 600, textTransform: 'none' }} />
                    <Tab icon={<QrCodeIcon />} iconPosition="start" label="E-Invoice (IRN & QR)" sx={{ fontWeight: 600, textTransform: 'none' }} />
                </Tabs>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {feedback && (
                    <Alert severity={feedback.type} sx={{ mb: 2.5, borderRadius: '10px' }} onClose={() => setFeedback(null)}>
                        {feedback.message}
                    </Alert>
                )}

                {!isEwbEligible && (
                    <Alert severity="info" sx={{ mb: 2.5, borderRadius: '10px' }}>
                        Note: Consignment value is below ₹50,000 threshold ({fmt(invoice.total_amount)}). E-Way Bill generation is optional.
                    </Alert>
                )}

                {/* TAB 0: Part-B Form */}
                {tab === 0 && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5 }}>
                            Vehicle & Transporter Information (Part-B)
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Vehicle Registration Number"
                                    placeholder="e.g. UP14AB1234"
                                    value={formData.vehicle_no}
                                    onChange={(e) => setFormData({ ...formData, vehicle_no: e.target.value.toUpperCase() })}
                                    helperText="Format: State + District + Series + Digits"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Transport Mode</InputLabel>
                                    <Select
                                        value={formData.trans_mode}
                                        label="Transport Mode"
                                        onChange={(e) => setFormData({ ...formData, trans_mode: e.target.value })}
                                    >
                                        <MenuItem value="1">1 — Road (Truck / Tempo)</MenuItem>
                                        <MenuItem value="2">2 — Rail</MenuItem>
                                        <MenuItem value="3">3 — Air</MenuItem>
                                        <MenuItem value="4">4 — Ship</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Transporter ID (GSTIN / TRANSIN)"
                                    placeholder="15-digit GSTIN or TRANSIN"
                                    value={formData.transporter_id}
                                    onChange={(e) => setFormData({ ...formData, transporter_id: e.target.value.toUpperCase() })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Transporter Name"
                                    placeholder="e.g. SafeXpress, VRL Logistics"
                                    value={formData.transporter_name}
                                    onChange={(e) => setFormData({ ...formData, transporter_name: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="LR / Trans Doc No"
                                    placeholder="e.g. LR-98234"
                                    value={formData.trans_doc_no}
                                    onChange={(e) => setFormData({ ...formData, trans_doc_no: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    label="LR / Doc Date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.trans_doc_date}
                                    onChange={(e) => setFormData({ ...formData, trans_doc_date: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    label="Approx Distance (KM)"
                                    value={formData.distance_km}
                                    onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                                    helperText="1 day validity per 200 km"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Portal Generated E-Way Bill No"
                                    placeholder="12-digit number from ewaybillgst.gov.in"
                                    value={formData.eway_bill_no}
                                    onChange={(e) => setFormData({ ...formData, eway_bill_no: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    label="E-Way Bill Date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.eway_bill_date}
                                    onChange={(e) => setFormData({ ...formData, eway_bill_date: e.target.value })}
                                />
                            </Grid>
                        </Grid>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                                onClick={handleSavePartB}
                                disabled={loading}
                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                            >
                                Save Part-B Details
                            </Button>

                            <Button
                                variant="outlined"
                                color="success"
                                startIcon={downloadingEwb ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                                onClick={handleDownloadEwbJson}
                                disabled={downloadingEwb}
                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                            >
                                Download NIC E-Way Bill JSON
                            </Button>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<PrintIcon />}
                                onClick={handlePrintEwbSlip}
                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                            >
                                Print E-Way Slip
                            </Button>
                        </Stack>
                    </Box>
                )}

                {/* TAB 1: Part-A Summary */}
                {tab === 1 && (
                    <Box>
                        <Grid container spacing={2} sx={{ mb: 2.5 }}>
                            <Grid item xs={12} sm={6}>
                                <Paper sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563eb' }}>
                                        CONSIGNOR (FROM)
                                    </Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5 }}>
                                        {company.company_name || 'Merchant'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                                        GSTIN: <strong>{company.gstin || 'Not Specified'}</strong>
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                                        {company.address || 'Address'}, {company.city || ''} - {company.pincode || ''}
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Paper sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669' }}>
                                        CONSIGNEE (TO)
                                    </Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5 }}>
                                        {client.company_name || 'Customer'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                                        GSTIN: <strong>{client.gstin || 'URP (Unregistered)'}</strong>
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                                        {client.address || 'Address'}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', mb: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>HSN</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Rate</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Taxable</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Tax %</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((it, idx) => {
                                        const qty = cleanNum(it.qty ?? it.quantity ?? 1) || 1;
                                        let rate = cleanNum(it.rate ?? it.price ?? it.unit_price);
                                        let amount = cleanNum(it.amount ?? it.taxable_amount ?? it.taxable ?? it.total);

                                        if (rate === 0 && amount > 0 && qty > 0) {
                                            rate = amount / qty;
                                        }
                                        if (amount === 0 && rate > 0 && qty > 0) {
                                            amount = rate * qty;
                                        }

                                        const taxRate = cleanNum(it.tax_rate ?? it.taxRate ?? 18) || 18;

                                        return (
                                            <TableRow key={idx}>
                                                <TableCell sx={{ fontWeight: 600 }}>{it.item_name || it.name || 'Goods'}</TableCell>
                                                <TableCell>{it.hsn_code || it.hsnCode || '998314'}</TableCell>
                                                <TableCell align="right">{qty} {it.unit || 'pcs'}</TableCell>
                                                <TableCell align="right">{fmt(rate)}</TableCell>
                                                <TableCell align="right">{fmt(amount)}</TableCell>
                                                <TableCell align="right">{taxRate}%</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Stack direction="row" spacing={3} justifyContent="flex-end" sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: '8px' }}>
                            <Typography variant="body2">Taxable: <strong>{fmt(invoice.sub_total)}</strong></Typography>
                            <Typography variant="body2">CGST: <strong>{fmt(invoice.cgst)}</strong></Typography>
                            <Typography variant="body2">SGST: <strong>{fmt(invoice.sgst)}</strong></Typography>
                            <Typography variant="body2">IGST: <strong>{fmt(invoice.igst)}</strong></Typography>
                            <Typography variant="body2" sx={{ color: '#2563eb' }}>Total: <strong>{fmt(invoice.total_amount)}</strong></Typography>
                        </Stack>
                    </Box>
                )}

                {/* TAB 2: E-Invoice (IRN & QR) */}
                {tab === 2 && (
                    <Box>
                        {invoice.irn ? (
                            <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', p: 2.5, mb: 3 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                    <CheckCircleIcon sx={{ color: '#16a34a' }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#166534' }}>
                                        E-Invoice IRN Active
                                    </Typography>
                                    <Chip label="IRP Verified" size="small" color="success" sx={{ fontWeight: 600 }} />
                                </Stack>

                                <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: '8px', border: '1px solid #bbf7d0', mb: 1.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block' }}>
                                        INVOICE REFERENCE NUMBER (IRN - 64 CHAR HASH):
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: 600, color: '#0f172a' }}>
                                        {invoice.irn}
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: '#475569' }}>Ack No: <strong>{invoice.ack_no || '—'}</strong></Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: '#475569' }}>Ack Date: <strong>{invoice.ack_date ? new Date(invoice.ack_date).toLocaleString('en-IN') : 'Just now'}</strong></Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        ) : (
                            <Box sx={{ bgcolor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', p: 3, textAlign: 'center', mb: 3 }}>
                                <QrCodeIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                    No E-Invoice IRN Generated Yet
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 450, mx: 'auto', mt: 0.5, mb: 2 }}>
                                    Generate canonical 64-character SHA-256 IRN hash according to GST rules for B2B compliance.
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={generatingIrn ? <CircularProgress size={16} color="inherit" /> : <BoltIcon />}
                                    onClick={handleGenerateIrn}
                                    disabled={generatingIrn}
                                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 3 }}
                                >
                                    Generate Official IRN & Signed QR
                                </Button>
                            </Box>
                        )}

                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={downloadingEinv ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                                onClick={handleDownloadEinvJson}
                                disabled={downloadingEinv}
                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                            >
                                Download NIC Schema 1.03 E-Invoice JSON
                            </Button>
                        </Stack>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}