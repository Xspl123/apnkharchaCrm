import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Card, CardContent, Typography, TextField, Button,
    Stack, Alert, CircularProgress, Grid,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Business as BusinessIcon } from '@mui/icons-material';
import axiosClient from '../../api/axiosClient';

const emptyForm = {
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    product_interest: '',
    notes: '',
    hp_confirm: '', // honeypot — real visitors never see or fill this
};

// Fully public, unauthenticated page. Rendered directly in AppRoutes
// (outside both PublicRoute and ProtectedRoute) so it works the same
// whether or not the visitor happens to be logged into the CRM elsewhere
// in the same browser. The org is identified purely by the `orgSlug` in
// the URL — see InitializeTenancyFromSlug on the backend.
export default function PublicLeadForm() {
    const { orgSlug } = useParams();

    const [orgLoading, setOrgLoading] = useState(true);
    const [orgError, setOrgError] = useState('');
    const [org, setOrg] = useState(null);

    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setOrgLoading(true);
        setOrgError('');

        axiosClient.get(`/public/leads/${orgSlug}`)
            .then(({ data }) => {
                if (!cancelled) setOrg(data.data);
            })
            .catch((err) => {
                if (cancelled) return;
                const status = err.response?.status;
                if (status === 404) {
                    setOrgError('Yeh form link valid nahi hai.');
                } else if (status === 409) {
                    setOrgError('Yeh form abhi available nahi hai. Baad me try karein.');
                } else {
                    setOrgError('Form load nahi ho paya. Baad me try karein.');
                }
            })
            .finally(() => {
                if (!cancelled) setOrgLoading(false);
            });

        return () => { cancelled = true; };
    }, [orgSlug]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!form.company_name.trim()) {
            setSubmitError('Company name daalna zaroori hai.');
            return;
        }
        if (!form.phone.trim() && !form.email.trim()) {
            setSubmitError('Phone ya email me se koi ek daalna zaroori hai.');
            return;
        }

        setSubmitting(true);
        try {
            await axiosClient.post(`/public/leads/${orgSlug}`, form);
            setSubmitted(true);
        } catch (err) {
            const status = err.response?.status;
            if (status === 429) {
                setSubmitError('Bahut zyada submissions ho gaye. Thodi der baad try karein.');
            } else if (status === 422) {
                setSubmitError(err.response?.data?.message || 'Kuch fields sahi nahi hain. Dobara check karein.');
            } else {
                setSubmitError('Submit nahi ho paya. Dobara try karein.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                background: 'linear-gradient(135deg,#0f172a,#1e3a8a)',
            }}
        >
            <Card
                sx={{
                    width: '100%',
                    maxWidth: 480,
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.97)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
                }}
            >
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    {orgLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress size={28} />
                        </Box>
                    ) : orgError ? (
                        <Alert severity="error">{orgError}</Alert>
                    ) : submitted ? (
                        <Stack spacing={2} alignItems="center" sx={{ py: 3, textAlign: 'center' }}>
                            <CheckCircleIcon sx={{ fontSize: 56, color: '#16a34a' }} />
                            <Typography variant="h6" fontWeight={700}>Dhanyavaad!</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Aapki details mil gayi hain. Hamari team jald hi aapse sampark karegi.
                            </Typography>
                        </Stack>
                    ) : (
                        <>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                                <Box sx={{
                                    width: 40, height: 40, borderRadius: '10px',
                                    bgcolor: '#eef2ff', color: '#4338ca',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <BusinessIcon />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                                    <Typography variant="h6" fontWeight={700}>{org?.name || 'Us'}</Typography>
                                </Box>
                            </Stack>

                            {submitError && (
                                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>
                                    {submitError}
                                </Alert>
                            )}

                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth size="small" label="Company Name" name="company_name"
                                            value={form.company_name} onChange={handleChange} required
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth size="small" label="Contact Person" name="contact_person"
                                            value={form.contact_person} onChange={handleChange}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth size="small" label="Phone" name="phone"
                                            value={form.phone} onChange={handleChange}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth size="small" label="Email" name="email" type="email"
                                            value={form.email} onChange={handleChange}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth size="small" label="What are you looking for?" name="product_interest"
                                            value={form.product_interest} onChange={handleChange}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth size="small" label="Message" name="notes" multiline rows={3}
                                            value={form.notes} onChange={handleChange}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        />
                                    </Grid>

                                    {/* Honeypot — visually and semantically hidden from real visitors,
                                        but a plain input a naive bot's autofill will still populate. */}
                                    <Box
                                        sx={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
                                        aria-hidden="true"
                                    >
                                        <TextField
                                            label="Leave this field empty"
                                            name="hp_confirm"
                                            value={form.hp_confirm}
                                            onChange={handleChange}
                                            tabIndex={-1}
                                            autoComplete="off"
                                        />
                                    </Box>

                                    <Grid item xs={12}>
                                        <Button
                                            type="submit" fullWidth variant="contained" disabled={submitting}
                                            sx={{
                                                borderRadius: '10px', textTransform: 'none', fontWeight: 600, py: 1.1,
                                                background: 'linear-gradient(135deg,#667eea,#764ba2)',
                                            }}
                                        >
                                            {submitting ? 'Submitting...' : 'Submit'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}