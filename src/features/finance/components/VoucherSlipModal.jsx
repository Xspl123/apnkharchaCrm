import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Button, Divider, Stack, IconButton, Chip, Paper
} from '@mui/material';
import {
    Print as PrintIcon,
    Close as CloseIcon,
    ReceiptLong as ReceiptIcon,
} from '@mui/icons-material';

// Helper: Number to Words in Indian Rupees (Lakhs & Crores)
function numberToWordsINR(num) {
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const n = Math.floor(Math.abs(Number(num) || 0));
    if (n === 0) return "Zero Rupees Only";

    function convertTwoDigits(n) {
        if (n < 20) return a[n];
        return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    }

    function convertThreeDigits(n) {
        let str = "";
        if (Math.floor(n / 100) > 0) {
            str += a[Math.floor(n / 100)] + " Hundred";
            if (n % 100 !== 0) str += " and ";
        }
        str += convertTwoDigits(n % 100);
        return str.trim();
    }

    let crore = Math.floor(n / 10000000);
    let lakh = Math.floor((n % 10000000) / 100000);
    let thousand = Math.floor((n % 100000) / 1000);
    let remainder = n % 1000;

    let res = [];
    if (crore > 0) res.push(convertThreeDigits(crore) + " Crore");
    if (lakh > 0) res.push(convertThreeDigits(lakh) + " Lakh");
    if (thousand > 0) res.push(convertThreeDigits(thousand) + " Thousand");
    if (remainder > 0) res.push(convertThreeDigits(remainder));

    const paise = Math.round((Math.abs(Number(num)) - n) * 100);
    let words = "Rupees " + res.join(" ");
    if (paise > 0) {
        words += " and " + convertTwoDigits(paise) + " Paise";
    }
    return words + " Only";
}

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function VoucherSlipModal({ open, onClose, transaction, company, user }) {
    if (!transaction) return null;

    const isCredit = transaction.type === 'credit';
    const isTransfer = transaction.category === 'transfer';

    const voucherTitle = isTransfer
        ? 'CONTRA VOUCHER'
        : isCredit
            ? 'RECEIPT VOUCHER'
            : 'PAYMENT VOUCHER';

    const voucherColor = isTransfer ? '#4f46e5' : isCredit ? '#10b981' : '#dc2626';

    const compName = company?.company_name || 'Krudracx (ApnaKharcha)';
    const compGst  = company?.gstin || '09ABDFK0972D1ZG';
    const compAddr = company?.address || 'Ghaziabad, Uttar Pradesh, India';

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }} className="no-print">
                <Stack direction="row" spacing={1} alignItems="center">
                    <ReceiptIcon sx={{ color: voucherColor }} />
                    <Typography variant="h6" fontWeight={700}>
                        Print Voucher Slip ({transaction.voucher_no})
                    </Typography>
                </Stack>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <style>{`
                    @media print {
                        body * { visibility: hidden !important; }
                        #voucher-print-area, #voucher-print-area * { visibility: visible !important; }
                        #voucher-print-area {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 24px !important;
                            box-shadow: none !important;
                            border: 2px solid #000 !important;
                        }
                        .no-print { display: none !important; }
                    }
                `}</style>

                <Paper
                    id="voucher-print-area"
                    elevation={0}
                    sx={{
                        p: 3.5,
                        borderRadius: '12px',
                        border: '2px solid #334155',
                        bgcolor: '#ffffff',
                        color: '#0f172a',
                    }}
                >
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '2px solid #334155' }}>
                        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 1, textTransform: 'uppercase' }}>
                            {compName}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                            {compAddr} · GSTIN: <strong>{compGst}</strong>
                        </Typography>
                        <Chip
                            label={voucherTitle}
                            sx={{
                                mt: 1.5,
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                letterSpacing: 1.5,
                                px: 2,
                                bgcolor: voucherColor,
                                color: '#ffffff',
                            }}
                        />
                    </Box>

                    {/* Metadata Grid */}
                    <Box sx={{ py: 2, borderBottom: '1px solid #cbd5e1' }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Voucher Number:</Typography>
                                <Typography variant="subtitle1" fontWeight={800} color={voucherColor}>
                                    {transaction.voucher_no}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Date:</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {transaction.transaction_date}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: { sm: 'right' } }}>
                                <Typography variant="caption" color="text.secondary">
                                    {isTransfer ? 'From / To Accounts:' : isCredit ? 'Deposited To Account:' : 'Deducted From Account:'}
                                </Typography>
                                <Typography variant="subtitle1" fontWeight={700}>
                                    {transaction.account_name || 'Bank/Cash'}
                                    {transaction.transfer_account_name ? ` ➔ ${transaction.transfer_account_name}` : ''}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Payment Mode & Ref:</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {transaction.payment_method?.toUpperCase()} · Ref: {transaction.reference_no || 'N/A'}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* Particulars & Amount */}
                    <Box sx={{ py: 2.5, borderBottom: '2px solid #334155' }}>
                        <Typography variant="caption" color="text.secondary">Particulars / Narration:</Typography>
                        <Typography variant="body1" fontWeight={600} sx={{ my: 0.5 }}>
                            {transaction.description || 'Business transaction recorded in cashbook.'}
                        </Typography>

                        <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: '#f8fafc', borderColor: '#cbd5e1' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Amount in Words:</Typography>
                                    <Typography variant="body2" fontWeight={700} sx={{ fontStyle: 'italic' }}>
                                        {numberToWordsINR(transaction.amount)}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary">Total Amount:</Typography>
                                    <Typography variant="h5" fontWeight={800} sx={{ color: voucherColor }}>
                                        {fmt(transaction.amount)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>

                    {/* 4 Signatures Block */}
                    <Box sx={{ pt: 5, pb: 1 }}>
                        <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ textAlign: 'center' }}>
                            <Box sx={{ flex: 1, borderTop: '1px dashed #64748b', pt: 1 }}>
                                <Typography variant="caption" fontWeight={700} display="block">
                                    Prepared By
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {user?.name || 'Accounts Staff'}
                                </Typography>
                            </Box>

                            <Box sx={{ flex: 1, borderTop: '1px dashed #64748b', pt: 1 }}>
                                <Typography variant="caption" fontWeight={700} display="block">
                                    Checked By
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Accountant
                                </Typography>
                            </Box>

                            <Box sx={{ flex: 1, borderTop: '1px dashed #64748b', pt: 1 }}>
                                <Typography variant="caption" fontWeight={700} display="block">
                                    Authorized Signatory
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Director / Partner (Seal)
                                </Typography>
                            </Box>

                            <Box sx={{ flex: 1, borderTop: '1px dashed #64748b', pt: 1 }}>
                                <Typography variant="caption" fontWeight={700} display="block">
                                    Receiver's Signature
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Sign / Date / Mobile
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Paper>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }} className="no-print">
                <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '10px' }}>
                    Close
                </Button>
                <Button
                    onClick={handlePrint}
                    variant="contained"
                    startIcon={<PrintIcon />}
                    sx={{ bgcolor: voucherColor, '&:hover': { opacity: 0.9 }, borderRadius: '10px' }}
                >
                    Print Slip / Save PDF
                </Button>
            </DialogActions>
        </Dialog>
    );
}