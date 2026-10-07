// src/components/InvoiceViewDialog.jsx
import {
    Dialog,
    DialogContent,
    Typography,
    Grid,
    Box,
    Stack,
    Avatar,
    Button,
    IconButton,
    Divider,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer
} from "@mui/material";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import DateRangeIcon from "@mui/icons-material/DateRange";
import { getItemAttributeSnapshot } from "../utils/productAttributeSnapshot";

const InvoiceViewDialog = ({
    open,
    onClose,
    invoiceToView,
    invoicePrintRef,
    handlePrint,
    handleExportPDF,
    formatDate,
    formatCurrency
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    overflow: 'hidden',
                    maxHeight: { xs: 'calc(100vh - 24px)', sm: '90vh' },
                    boxShadow: '0 20px 60px rgba(0,0,0,0.08)'
                }
            }}
        >
            {/* Premium Header - Glass Morphism */}
            <Box sx={{
                px: { xs: 2, sm: 4 },
                py: { xs: 1.5, sm: 2.5 },
                borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
                display: 'flex',
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: { xs: 1, sm: 2 },
                bgcolor: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)'
            }}>
                <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }} sx={{ minWidth: 0, flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
                    <Avatar sx={{
                        bgcolor: '#667eea',
                        width: { xs: 36, sm: 40 },
                        height: { xs: 36, sm: 40 },
                        flexShrink: 0,
                        boxShadow: '0 4px 10px rgba(102,126,234,0.2)'
                    }}>
                        <ReceiptIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#1e293b', letterSpacing: '-0.3px', overflowWrap: 'anywhere' }}>
                            Invoice {invoiceToView?.invoice_no}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DateRangeIcon sx={{ fontSize: 14 }} />
                            {formatDate(invoiceToView?.invoice_date)}
                        </Typography>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={{ xs: 0.75, sm: 1.5 }} justifyContent="space-between" sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<PrintIcon />}
                        onClick={handlePrint}
                        sx={{
                            bgcolor: '#667eea',
                            color: 'white',
                            textTransform: 'none',
                            borderRadius: '10px',
                            px: { xs: 1.5, sm: 3 },
                            py: 1,
                            fontSize: '13px',
                            fontWeight: 600,
                            boxShadow: '0 4px 10px rgba(102,126,234,0.2)',
                            '&:hover': {
                                bgcolor: '#5a67d8',
                                boxShadow: '0 6px 15px rgba(102,126,234,0.3)'
                            }
                        }}
                    >
                        Print
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<PictureAsPdfIcon />}
                        onClick={handleExportPDF}
                        sx={{
                            bgcolor: '#e53e3e',
                            color: 'white',
                            textTransform: 'none',
                            borderRadius: '10px',
                            px: { xs: 1.5, sm: 3 },
                            py: 1,
                            fontSize: '13px',
                            fontWeight: 600,
                            boxShadow: '0 4px 10px rgba(229,62,62,0.2)',
                            '&:hover': {
                                bgcolor: '#c53030',
                                boxShadow: '0 6px 15px rgba(229,62,62,0.3)'
                            }
                        }}
                    >
                        PDF
                    </Button>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: '#64748b',
                            bgcolor: '#f1f5f9',
                            '&:hover': { bgcolor: '#e2e8f0' }
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Box>

            {/* Invoice Content - Premium Design */}
            <DialogContent sx={{ p: 0, bgcolor: '#ffffff', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
                <div ref={invoicePrintRef}>
                    <Box sx={{
                        p: { xs: 2, sm: 4 },
                        maxWidth: '100%',
                        '@media print': {
                            padding: '0.5in',
                            maxHeight: '100%',
                            overflow: 'hidden'
                        }
                    }}>
                        {/* ========== PREMIUM HEADER WITH LOGO ========== */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} md={7} sx={{ minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, minWidth: 0 }}>
                                    {/* COMPANY LOGO - Premium Box */}
                                    {invoiceToView?.company?.logo_url ? (
                                        <Box sx={{
                                            width: { xs: 56, sm: 90 },
                                            height: { xs: 56, sm: 90 },
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '14px',
                                            p: 1.5,
                                            bgcolor: '#fff',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.02)'
                                        }}>
                                            <img
                                                src={invoiceToView.company.logo_url}
                                                alt={invoiceToView.company.company_name}
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                    objectFit: 'contain'
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = '<span style="font-size: 32px; font-weight: 800; color: #667eea;">' +
                                                        (invoiceToView.company.company_name?.charAt(0) || 'C') +
                                                        '</span>';
                                                }}
                                            />
                                        </Box>
                                    ) : (
                                        <Box sx={{
                                            width: { xs: 56, sm: 90 },
                                            height: { xs: 56, sm: 90 },
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            borderRadius: '14px',
                                            boxShadow: '0 10px 25px rgba(102,126,234,0.25)'
                                        }}>
                                            <Typography variant="h2" sx={{ fontWeight: 800, color: 'white', fontSize: { xs: '28px', sm: '42px' } }}>
                                                {invoiceToView?.company?.company_name?.charAt(0) || 'A'}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* COMPANY DETAILS */}
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="h5" sx={{
                                            fontWeight: 800,
                                            color: '#0f172a',
                                            mb: 0.8,
                                            letterSpacing: '-0.5px',
                                            fontSize: { xs: '1.1rem', sm: '26px' },
                                            overflowWrap: 'anywhere'
                                        }}>
                                            {invoiceToView?.company?.company_name || 'ApnaKharcha Services'}
                                        </Typography>
                                        <Box sx={{ color: '#475569', fontSize: '13px', lineHeight: '1.7', minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.8, overflowWrap: 'anywhere' }}>
                                                📍 {invoiceToView?.company?.address || 'A-126 Noida, Uttar Pradesh, 201301'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* COMPANY CONTACT */}
                                <Box sx={{
                                    mt: 2,
                                    ml: { xs: 0, sm: '115px' },
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1.5,
                                    alignItems: 'center'
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        bgcolor: '#f8fafc',
                                        px: 1.5,
                                        py: 0.8,
                                        borderRadius: '30px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        📞
                                        <Typography variant="caption" sx={{ fontWeight: 500, color: '#334155', overflowWrap: 'anywhere' }}>
                                            {invoiceToView?.company?.phone || '07982748233'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        bgcolor: '#f8fafc',
                                        px: 1.5,
                                        py: 0.8,
                                        borderRadius: '30px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        ✉️
                                        <Typography variant="caption" sx={{ fontWeight: 500, color: '#334155', overflowWrap: 'anywhere' }}>
                                            {invoiceToView?.company?.email || 'abhishek@apnakharcha.in'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        bgcolor: '#f0f9ff',
                                        px: 1.5,
                                        py: 0.8,
                                        borderRadius: '30px',
                                        border: '1px solid #bae6fd'
                                    }}>
                                        <span style={{ fontWeight: 700, color: '#0284c7' }}>GST</span>
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#0369a1', overflowWrap: 'anywhere' }}>
                                            {invoiceToView?.company?.gstin || '07ABCDE1234F1Z6'}
                                        </Typography>
                                    </Box>
                                    {invoiceToView?.company?.pan && (
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            bgcolor: '#fef2f2',
                                            px: 1.5,
                                            py: 0.8,
                                            borderRadius: '30px',
                                            border: '1px solid #fecaca'
                                        }}>
                                            <span style={{ fontWeight: 700, color: '#b91c1c' }}>PAN</span>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#991b1b' }}>
                                                {invoiceToView.company.pan}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: 0 }}>
                                <Typography variant="h2" sx={{
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    mb: 1.5,
                                    fontSize: { xs: '24px', sm: '36px' },
                                    letterSpacing: { xs: '0.5px', sm: '2px' },
                                    textShadow: '0 2px 5px rgba(0,0,0,0.02)'
                                }}>
                                    INVOICE
                                </Typography>

                                <Box sx={{
                                    display: 'inline-block',
                                    textAlign: 'left',
                                    bgcolor: '#f8fafc',
                                    p: 2.5,
                                    borderRadius: '12px',
                                    width: '100%',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Invoice Number</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', overflowWrap: 'anywhere', textAlign: 'right' }}>{invoiceToView?.invoice_no}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Invoice Date</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', textAlign: 'right' }}>{formatDate(invoiceToView?.invoice_date)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Due Date</Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 700,
                                                color: invoiceToView?.due_date && new Date(invoiceToView.due_date) < new Date() && invoiceToView?.status !== 'paid' ? '#dc2626' : '#0f172a',
                                                textAlign: 'right'
                                            }}
                                        >
                                            {formatDate(invoiceToView?.due_date) || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Premium Status Badge */}
                                {invoiceToView?.status && (
                                    <Box sx={{ mt: 2 }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 20px',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            borderRadius: '40px',
                                            letterSpacing: '0.5px',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                                            backgroundColor: invoiceToView.status === 'paid' ? '#dcfce7' :
                                                invoiceToView.status === 'unpaid' ? '#fee2e2' :
                                                    invoiceToView.status === 'partial' ? '#fef9c3' : '#f1f5f9',
                                            color: invoiceToView.status === 'paid' ? '#166534' :
                                                invoiceToView.status === 'unpaid' ? '#991b1b' :
                                                    invoiceToView.status === 'partial' ? '#854d0e' : '#334155',
                                            border: invoiceToView.status === 'paid' ? '1px solid #86efac' :
                                                invoiceToView.status === 'unpaid' ? '1px solid #fecaca' :
                                                    invoiceToView.status === 'partial' ? '1px solid #fde047' : '1px solid #e2e8f0'
                                        }}>
                                            {invoiceToView.status === 'paid' && '✅ '}
                                            {invoiceToView.status === 'unpaid' && '⏳ '}
                                            {invoiceToView.status === 'partial' && '⚠️ '}
                                            {invoiceToView.status === 'overdue' && '❗ '}
                                            {invoiceToView.status.toUpperCase()}
                                        </span>
                                    </Box>
                                )}
                            </Grid>
                        </Grid>

                        <Divider sx={{
                            my: 3.5,
                            borderColor: '#e2e8f0',
                            borderWidth: '1.5px',
                            opacity: 0.7
                        }} />

                        {/* ========== BILL TO SECTION ========== */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12}>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 3
                                }}>
                                    <Box sx={{
                                        bgcolor: '#667eea',
                                        width: '8px',
                                        height: '50px',
                                        borderRadius: '4px',
                                        mt: 0.5
                                    }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" sx={{
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            mb: 1.5,
                                            fontSize: '15px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }}>
                                            <BusinessIcon sx={{ color: '#667eea', fontSize: 20 }} />
                                            BILL TO
                                        </Typography>

                                        <Box sx={{
                                            bgcolor: '#ffffff',
                                            borderRadius: '16px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.02)',
                                            display: 'grid',
                                            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
                                            gap: { xs: 2, md: 3 },
                                            p: { xs: 2, sm: 3 }
                                        }}>
                                            <Box>
                                                <Typography variant="h6" sx={{
                                                    fontWeight: 700,
                                                    color: '#0f172a',
                                                    mb: 1.5,
                                                    fontSize: '18px'
                                                }}>
                                                    {invoiceToView?.client?.company_name || 'Krudracx'}
                                                </Typography>

                                                {invoiceToView?.client?.contact_person && (
                                                    <Typography variant="body2" sx={{
                                                        color: '#475569',
                                                        mb: 1,
                                                        fontSize: '14px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1
                                                    }}>
                                                        <span style={{ color: '#64748b' }}>Attn:</span>
                                                        <span style={{ fontWeight: 600, color: '#334155' }}>{invoiceToView.client.contact_person}</span>
                                                    </Typography>
                                                )}

                                                <Typography variant="body2" sx={{
                                                    color: '#475569',
                                                    mb: 0.8,
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    gap: 1
                                                }}>
                                                    <span style={{ color: '#64748b', minWidth: '60px' }}>Address:</span>
                                                    <span style={{ color: '#334155' }}>{invoiceToView?.client?.address || 'A140'}</span>
                                                </Typography>

                                                <Typography variant="body2" sx={{
                                                    color: '#475569',
                                                    mb: 0.8,
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    gap: 1
                                                }}>
                                                    <span style={{ color: '#64748b', minWidth: '60px' }}>City:</span>
                                                    <span style={{ color: '#334155' }}>
                                                        {invoiceToView?.client?.city} {invoiceToView?.client?.state} - {invoiceToView?.client?.pincode}
                                                    </span>
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography variant="body2" sx={{
                                                    color: '#475569',
                                                    mb: 1,
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}>
                                                    <span style={{ color: '#64748b' }}>📞</span>
                                                    <span style={{ color: '#334155' }}>{invoiceToView?.client?.phone || '07982748233'}</span>
                                                </Typography>

                                                <Typography variant="body2" sx={{
                                                    color: '#475569',
                                                    mb: 1,
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}>
                                                    <span style={{ color: '#64748b' }}>✉️</span>
                                                    <span style={{ color: '#334155' }}>{invoiceToView?.client?.email || 'challan.vertage@gmail.com'}</span>
                                                </Typography>

                                                {invoiceToView?.client?.gstin && (
                                                    <Box sx={{
                                                        mt: 1.5,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        bgcolor: '#f0f9ff',
                                                        px: 2,
                                                        py: 0.8,
                                                        borderRadius: '30px',
                                                        border: '1px solid #bae6fd'
                                                    }}>
                                                        <span style={{ fontWeight: 700, color: '#0284c7', fontSize: '12px' }}>GST</span>
                                                        <span style={{ fontWeight: 600, color: '#0369a1', fontSize: '13px' }}>
                                                            {invoiceToView.client.gstin}
                                                        </span>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* ========== PREMIUM ITEMS TABLE ========== */}
                        <Typography variant="subtitle1" sx={{
                            fontWeight: 700,
                            color: '#0f172a',
                            mb: 2,
                            fontSize: '15px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <DescriptionIcon sx={{ color: '#667eea', fontSize: 20 }} />
                            INVOICE ITEMS
                        </Typography>

                        <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' }, mb: 3, '@media print': { display: 'none' } }}>
                            {(invoiceToView?.items || []).map((item, index) => (
                                <Box key={index} sx={{
                                    p: 2,
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    bgcolor: '#fff',
                                    minWidth: 0,
                                }}>
                                    <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', overflowWrap: 'anywhere' }}>
                                                {String(index + 1).padStart(2, '0')}. {item.item_name}
                                            </Typography>
                                            {item.description && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#64748b', overflowWrap: 'anywhere' }}>
                                                    {item.description}
                                                </Typography>
                                            )}
                                            {getItemAttributeSnapshot(item).length > 0 && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#475569', overflowWrap: 'anywhere' }}>
                                                    {getItemAttributeSnapshot(item).map((attribute) =>
                                                        `${attribute.attribute_name || attribute.name || 'Attribute'}: ${attribute.value}`
                                                    ).join(' · ')}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Typography variant="subtitle2" sx={{ flexShrink: 0, fontWeight: 800, color: '#0f172a', overflowWrap: 'anywhere' }}>
                                            {item.amount}
                                        </Typography>
                                    </Stack>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.25, mt: 1.5 }}>
                                        {[
                                            ['HSN/SAC', item.hsn_code || '—'],
                                            ['Quantity', `${item.qty} ${item.unit || ''}`],
                                            ['Rate', item.rate],
                                            ['Tax', `${item.tax_rate}%`],
                                        ].map(([label, value]) => (
                                            <Box key={label} sx={{ minWidth: 0 }}>
                                                <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>{label}</Typography>
                                                <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, overflowWrap: 'anywhere' }}>{value}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            ))}
                        </Stack>

                        <TableContainer sx={{
                            display: { xs: 'none', md: 'block' },
                            mb: 3,
                            border: '1px solid #e2e8f0',
                            borderRadius: '16px',
                            overflowX: 'auto',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.02)',
                            '@media print': { display: 'block' },
                        }}>
                            <Table size="small" sx={{ minWidth: 720 }}>
                                <TableHead>
                                    <TableRow sx={{
                                        bgcolor: '#f8fafc',
                                        borderBottom: '2px solid #667eea'
                                    }}>
                                        <TableCell sx={{
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            fontSize: '13px',
                                            py: 2,
                                            borderBottom: 'none'
                                        }}>#</TableCell>
                                        <TableCell sx={{
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            fontSize: '13px',
                                            py: 2,
                                            borderBottom: 'none'
                                        }}>Item Description</TableCell>
                                        <TableCell sx={{
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            fontSize: '13px',
                                            py: 2,
                                            borderBottom: 'none'
                                        }}>HSN/SAC</TableCell>
                                        <TableCell align="center" sx={{
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            fontSize: '13px',
                                            py: 2,
                                            borderBottom: 'none'
                                        }}>Qty</TableCell>
                                        <TableCell align="right" sx={{
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            fontSize: '13px',
                                            py: 2,
                                            borderBottom: 'none'
                                        }}>Rate (₹)</TableCell>
                                        <TableCell align="right" sx={{
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            fontSize: '13px',
                                            py: 2,
                                            borderBottom: 'none'
                                        }}>Tax %</TableCell>
                                        <TableCell align="right" sx={{
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            fontSize: '13px',
                                            py: 2,
                                            borderBottom: 'none'
                                        }}>Amount (₹)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invoiceToView?.items?.map((item, index) => (
                                        <TableRow
                                            key={index}
                                            sx={{
                                                '&:last-child td': { borderBottom: 'none' },
                                                '&:hover': { bgcolor: '#f8fafc' },
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <TableCell sx={{
                                                color: '#64748b',
                                                py: 2,
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                borderBottom: '1px solid #e2e8f0'
                                            }}>
                                                {String(index + 1).padStart(2, '0')}
                                            </TableCell>
                                            <TableCell sx={{
                                                py: 2,
                                                borderBottom: '1px solid #e2e8f0'
                                            }}>
                                                <Typography variant="body2" sx={{
                                                    fontWeight: 700,
                                                    color: '#0f172a',
                                                    fontSize: '14px',
                                                    mb: 0.3
                                                }}>
                                                    {item.item_name}
                                                </Typography>
                                                {item.description && (
                                                    <Typography variant="caption" sx={{
                                                        color: '#64748b',
                                                        display: 'block',
                                                        fontSize: '12px',
                                                        lineHeight: 1.5
                                                    }}>
                                                        {item.description}
                                                    </Typography>
                                                )}
                                                {getItemAttributeSnapshot(item).length > 0 && (
                                                    <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.4, fontSize: '12px', lineHeight: 1.5 }}>
                                                        {getItemAttributeSnapshot(item).map((attribute) =>
                                                            `${attribute.attribute_name || attribute.name || 'Attribute'}: ${attribute.value}`
                                                        ).join(' · ')}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{
                                                color: '#475569',
                                                py: 2,
                                                fontSize: '13px',
                                                borderBottom: '1px solid #e2e8f0',
                                                fontWeight: 500
                                            }}>
                                                {item.hsn_code || '-'}
                                            </TableCell>
                                            <TableCell align="center" sx={{
                                                color: '#0f172a',
                                                py: 2,
                                                fontSize: '14px',
                                                borderBottom: '1px solid #e2e8f0',
                                                fontWeight: 600
                                            }}>
                                                {item.qty} {item.unit}
                                            </TableCell>
                                            <TableCell align="right" sx={{
                                                color: '#475569',
                                                py: 2,
                                                fontSize: '14px',
                                                borderBottom: '1px solid #e2e8f0',
                                                fontWeight: 500
                                            }}>
                                                {(item.rate)}
                                            </TableCell>
                                            <TableCell align="right" sx={{
                                                color: '#475569',
                                                py: 2,
                                                fontSize: '14px',
                                                borderBottom: '1px solid #e2e8f0',
                                                fontWeight: 500
                                            }}>
                                                {item.tax_rate}%
                                            </TableCell>
                                            <TableCell align="right" sx={{
                                                fontWeight: 700,
                                                color: '#0f172a',
                                                py: 2,
                                                fontSize: '15px',
                                                borderBottom: '1px solid #e2e8f0',
                                                bgcolor: '#f8fafc'
                                            }}>
                                                {(item.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* ========== PREMIUM TOTALS SECTION ========== */}
                        <Grid container justifyContent="flex-end" sx={{ mb: 4 }}>
                            <Grid item xs={12} md={5.5}>
                                <Box sx={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.02)',
                                    bgcolor: '#ffffff'
                                }}>
                                    <Table size="small" sx={{
                                        width: '100%',
                                        tableLayout: 'fixed',
                                        '& .MuiTableCell-root': {
                                            px: { xs: 1.25, sm: 2 },
                                            overflowWrap: 'anywhere',
                                        },
                                    }}>
                                        <TableBody>
                                            {/* Subtotal */}
                                            <TableRow>
                                                <TableCell sx={{
                                                    borderBottom: '1px solid #e2e8f0',
                                                    color: '#475569',
                                                    py: 2,
                                                    fontSize: '14px',
                                                    bgcolor: '#f8fafc'
                                                }}>
                                                    Subtotal
                                                </TableCell>
                                                <TableCell align="right" sx={{
                                                    borderBottom: '1px solid #e2e8f0',
                                                    fontWeight: 600,
                                                    color: '#0f172a',
                                                    py: 2,
                                                    fontSize: '14px',
                                                    bgcolor: '#f8fafc'
                                                }}>
                                                    {formatCurrency(invoiceToView?.sub_total)}
                                                </TableCell>
                                            </TableRow>

                                            {/* CGST */}
                                            {parseFloat(invoiceToView?.cgst || 0) > 0 && (
                                                <TableRow>
                                                    <TableCell sx={{
                                                        borderBottom: '1px solid #e2e8f0',
                                                        color: '#475569',
                                                        py: 1.8,
                                                        fontSize: '14px',
                                                        pl: { xs: 2, sm: 4 }
                                                    }}>
                                                        CGST ({((parseFloat(invoiceToView?.cgst) / parseFloat(invoiceToView?.sub_total) * 100) || 2.5).toFixed(2)}%)
                                                    </TableCell>
                                                    <TableCell align="right" sx={{
                                                        borderBottom: '1px solid #e2e8f0',
                                                        color: '#475569',
                                                        py: 1.8,
                                                        fontSize: '14px',
                                                        fontWeight: 500
                                                    }}>
                                                        {formatCurrency(invoiceToView?.cgst)}
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {/* SGST */}
                                            {parseFloat(invoiceToView?.sgst || 0) > 0 && (
                                                <TableRow>
                                                    <TableCell sx={{
                                                        borderBottom: '1px solid #e2e8f0',
                                                        color: '#475569',
                                                        py: 1.8,
                                                        fontSize: '14px',
                                                        pl: 4
                                                    }}>
                                                        SGST ({((parseFloat(invoiceToView?.sgst) / parseFloat(invoiceToView?.sub_total) * 100) || 2.5).toFixed(2)}%)
                                                    </TableCell>
                                                    <TableCell align="right" sx={{
                                                        borderBottom: '1px solid #e2e8f0',
                                                        color: '#475569',
                                                        py: 1.8,
                                                        fontSize: '14px',
                                                        fontWeight: 500
                                                    }}>
                                                        {formatCurrency(invoiceToView?.sgst)}
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {/* IGST */}
                                            {parseFloat(invoiceToView?.igst || 0) > 0 && (
                                                <TableRow>
                                                    <TableCell sx={{
                                                        borderBottom: '1px solid #e2e8f0',
                                                        color: '#475569',
                                                        py: 1.8,
                                                        fontSize: '14px',
                                                        pl: 4
                                                    }}>
                                                        IGST ({((parseFloat(invoiceToView?.igst) / parseFloat(invoiceToView?.sub_total) * 100) || 5).toFixed(2)}%)
                                                    </TableCell>
                                                    <TableCell align="right" sx={{
                                                        borderBottom: '1px solid #e2e8f0',
                                                        color: '#475569',
                                                        py: 1.8,
                                                        fontSize: '14px',
                                                        fontWeight: 500
                                                    }}>
                                                        {formatCurrency(invoiceToView?.igst)}
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {/* Grand Total */}
                                            <TableRow>
                                                <TableCell sx={{
                                                    fontWeight: 800,
                                                    color: '#0f172a',
                                                    py: 2.2,
                                                    fontSize: '16px',
                                                    borderBottom: parseFloat(invoiceToView?.paid_amount || 0) > 0 || parseFloat(invoiceToView?.balance_amount || 0) > 0 ? '1px solid #e2e8f0' : 'none',
                                                    bgcolor: '#f1f5f9'
                                                }}>
                                                    Grand Total
                                                </TableCell>
                                                <TableCell align="right" sx={{
                                                    fontWeight: 800,
                                                    color: '#0f172a',
                                                    py: 2.2,
                                                    fontSize: '18px',
                                                    borderBottom: parseFloat(invoiceToView?.paid_amount || 0) > 0 || parseFloat(invoiceToView?.balance_amount || 0) > 0 ? '1px solid #e2e8f0' : 'none',
                                                    bgcolor: '#f1f5f9'
                                                }}>
                                                    {formatCurrency(invoiceToView?.total_amount)}
                                                </TableCell>
                                            </TableRow>

                                            {/* Paid Amount */}
                                            {parseFloat(invoiceToView?.paid_amount || 0) > 0 && (
                                                <TableRow>
                                                    <TableCell sx={{
                                                        color: '#166534',
                                                        py: 1.8,
                                                        fontSize: '14px',
                                                        fontWeight: 700,
                                                        pl: { xs: 2, sm: 4 }
                                                    }}>
                                                        ✓ Paid Amount
                                                    </TableCell>
                                                    <TableCell align="right" sx={{
                                                        color: '#166534',
                                                        fontWeight: 700,
                                                        py: 1.8,
                                                        fontSize: '15px',
                                                        overflowWrap: 'anywhere'
                                                    }}>
                                                        {formatCurrency(invoiceToView?.paid_amount)}
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {/* Balance Due */}
                                            {parseFloat(invoiceToView?.balance_amount || 0) > 0 && (
                                                <TableRow>
                                                    <TableCell sx={{
                                                        fontWeight: 800,
                                                        color: '#b91c1c',
                                                        py: 2,
                                                        fontSize: '15px',
                                                        pl: { xs: 2, sm: 4 },
                                                        borderTop: '1px dashed #e2e8f0'
                                                    }}>
                                                        Balance Due
                                                    </TableCell>
                                                    <TableCell align="right" sx={{
                                                        fontWeight: 800,
                                                        color: '#b91c1c',
                                                        py: 2,
                                                        fontSize: '16px',
                                                        borderTop: '1px dashed #e2e8f0'
                                                    }}>
                                                        {formatCurrency(invoiceToView?.balance_amount)}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* ========== PREMIUM BANK DETAILS ========== */}
                        {invoiceToView?.company?.bank_name && (
                            <Box sx={{
                                mt: 3,
                                p: { xs: 2, sm: 3 },
                                border: '1px solid #e2e8f0',
                                borderRadius: '16px',
                                bgcolor: '#ffffff',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.02)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <Box sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '6px',
                                    height: '100%',
                                    bgcolor: '#667eea'
                                }} />
                                <Typography variant="subtitle2" sx={{
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    mb: 2,
                                    fontSize: '14px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <span style={{ fontSize: '18px' }}>🏦</span>
                                    BANK DETAILS FOR PAYMENT
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="caption" sx={{
                                            color: '#64748b',
                                            display: 'block',
                                            fontSize: '11px',
                                            mb: 0.5,
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            Bank Name
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            fontSize: '15px',
                                            overflowWrap: 'anywhere'
                                        }}>
                                            {invoiceToView.company.bank_name}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="caption" sx={{
                                            color: '#64748b',
                                            display: 'block',
                                            fontSize: '11px',
                                            mb: 0.5,
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            Account Number
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            fontSize: '15px',
                                            overflowWrap: 'anywhere'
                                        }}>
                                            {invoiceToView.company.bank_account_no}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="caption" sx={{
                                            color: '#64748b',
                                            display: 'block',
                                            fontSize: '11px',
                                            mb: 0.5,
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            IFSC Code
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            fontSize: '15px',
                                            overflowWrap: 'anywhere'
                                        }}>
                                            {invoiceToView.company.bank_ifsc}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="caption" sx={{
                                            color: '#64748b',
                                            display: 'block',
                                            fontSize: '11px',
                                            mb: 0.5,
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            Branch
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            fontSize: '15px',
                                            overflowWrap: 'anywhere'
                                        }}>
                                            {invoiceToView.company.bank_branch}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* ========== PREMIUM NOTES ========== */}
                        {invoiceToView?.notes && (
                            <Box sx={{
                                mt: 3,
                                p: { xs: 2, sm: 3 },
                                bgcolor: '#f8fafc',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.02)'
                            }}>
                                <Typography variant="subtitle2" sx={{
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    mb: 1.2,
                                    fontSize: '14px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <DescriptionIcon sx={{ color: '#667eea', fontSize: 18 }} />
                                    NOTES / TERMS & CONDITIONS
                                </Typography>
                                <Typography variant="body2" sx={{
                                    color: '#475569',
                                    whiteSpace: 'pre-line',
                                    fontSize: '14px',
                                    lineHeight: '1.7',
                                    pl: 1
                                }}>
                                    {invoiceToView.notes}
                                </Typography>
                            </Box>
                        )}

                        {/* ========== PREMIUM SIGNATURE SECTION ========== */}
                        <Box sx={{ mt: 6, mb: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{
                                        borderTop: '3px solid #94a3b8',
                                        pt: 1.5,
                                        display: 'inline-block',
                                        minWidth: { xs: 0, sm: '200px' },
                                        maxWidth: '100%'
                                    }}>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 700,
                                            color: '#334155',
                                            fontSize: '13px',
                                            letterSpacing: '0.5px'
                                        }}>
                                            CUSTOMER SIGNATURE
                                        </Typography>
                                        <Typography variant="caption" sx={{
                                            color: '#64748b',
                                            display: 'block',
                                            mt: 0.5,
                                            fontSize: '11px',
                                            fontStyle: 'italic'
                                        }}>
                                            (Authorized representative)
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                    <Box sx={{
                                        borderTop: '3px solid #667eea',
                                        pt: 1.5,
                                        display: 'inline-block',
                                        minWidth: { xs: 0, sm: '200px' },
                                        maxWidth: '100%'
                                    }}>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 800,
                                            color: '#0f172a',
                                            fontSize: '13px',
                                            letterSpacing: '0.5px'
                                        }}>
                                            AUTHORIZED SIGNATURE
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 600,
                                            color: '#667eea',
                                            mt: 0.8,
                                            fontSize: '14px'
                                        }}>
                                            {invoiceToView?.company?.company_name || 'ApnaKharcha Services'}
                                        </Typography>
                                        <Typography variant="caption" sx={{
                                            color: '#64748b',
                                            display: 'block',
                                            mt: 0.3,
                                            fontSize: '10px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px'
                                        }}>
                                            Authorized Signatory
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* ========== PREMIUM FOOTER ========== */}
                        <Box sx={{
                            mt: 5,
                            pt: 3,
                            borderTop: '2px dashed #cbd5e1',
                            textAlign: 'center',
                            position: 'relative'
                        }}>
                            {/* Decorative Element */}
                            <Box sx={{
                                position: 'absolute',
                                top: -10,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                bgcolor: 'white',
                                px: 2,
                                color: '#667eea',
                                fontSize: '20px'
                            }}>
                                ✦ ✦ ✦
                            </Box>

                            <Typography variant="body1" sx={{
                                fontWeight: 800,
                                color: '#0f172a',
                                mb: 1,
                                fontSize: '16px',
                                letterSpacing: '1px'
                            }}>
                                THANK YOU FOR YOUR BUSINESS!
                            </Typography>
                            <Typography variant="caption" sx={{
                                color: '#64748b',
                                fontSize: '12px',
                                display: 'block',
                                mb: 0.5
                            }}>
                                This is a computer-generated invoice. No physical signature required.
                            </Typography>
                            {invoiceToView?.company?.email && (
                                <Typography variant="caption" sx={{
                                    color: '#667eea',
                                    display: 'block',
                                    mt: 0.8,
                                    fontSize: '12px',
                                    fontWeight: 600
                                }}>
                                    📧 For any queries: {invoiceToView.company.email}
                                </Typography>
                            )}
                            {invoiceToView?.company?.phone && (
                                <Typography variant="caption" sx={{
                                    color: '#64748b',
                                    display: 'block',
                                    fontSize: '11px'
                                }}>
                                    📞 {invoiceToView.company.phone}
                                </Typography>
                            )}

                            {/* Watermark */}
                            <Typography variant="caption" sx={{
                                color: '#e2e8f0',
                                display: 'block',
                                mt: 2,
                                fontSize: '10px',
                                fontWeight: 800,
                                letterSpacing: '2px'
                            }}>
                                {invoiceToView?.company?.company_name?.toUpperCase() || 'APNAKHARCHA SERVICES'} • EST. 2020
                            </Typography>
                        </Box>
                    </Box>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default InvoiceViewDialog;
