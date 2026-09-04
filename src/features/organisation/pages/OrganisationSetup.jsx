import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createOrganisation } from '../state/orgSlice';
import { updateAuthOrg } from '../../auth/state/authSlice';
import {
    Box, Card, CardContent, Typography, Button, TextField,
    Stack, Alert, CircularProgress, Stepper, Step, StepLabel,
    Grid, InputAdornment,
} from '@mui/material';
import {
    Business as BusinessIcon,
    LocationOn as LocationIcon,
    Receipt as GstIcon,
    CheckCircle as CheckIcon,
    ArrowForward as NextIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const GlassCard = styled(Card)(() => ({
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
}));

const GradientButton = styled(Button)(() => ({
    background: 'linear-gradient(135deg,#667eea,#764ba2)',
    color: '#fff',
    borderRadius: '12px',
    textTransform: 'none',
    fontWeight: 700,
    padding: '12px 32px',
    fontSize: 16,
    '&:hover': { opacity: 0.9, transform: 'translateY(-2px)' },
    '&:disabled': { background: '#ccc' },
    transition: 'all 0.2s',
}));

const steps = ['Basic Info', 'Location & Tax', 'Review'];

const emptyForm = {
    name: '', email: '', phone: '',
    address: '', city: '', country: 'India',
    gst_number: '', pan_number: '',
};

export default function OrganisationSetup() {
    const dispatch  = useDispatch();
    const navigate  = useNavigate();
    const { user }  = useSelector((s) => s.auth);
    const { actionLoading, error } = useSelector((s) => s.orgs);

    const [step,     setStep]     = useState(0);
    const [formData, setFormData] = useState(emptyForm);
    const [formErr,  setFormErr]  = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
    };

    const handleNext = () => {
        setFormErr('');
        if (step === 0 && !formData.name.trim()) {
            setFormErr('Organisation name required!');
            return;
        }
        setStep((p) => p + 1);
    };

    const handleSubmit = async () => {
        setFormErr('');
        try {
            await dispatch(createOrganisation(formData)).unwrap();
            await dispatch(updateAuthOrg()).unwrap();
            navigate('/dashboard');
        } catch (err) {
            setFormErr(err || 'Failed to create organisation');
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            p: 2,
        }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: 620 }}>

                <GlassCard>
                    <CardContent sx={{ p: 4 }}>
                        {/* Header */}
                        <Box textAlign="center" mb={4}>
                            <Box sx={{ width: 64, height: 64, borderRadius: '16px',
                                background: 'linear-gradient(135deg,#667eea,#764ba2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                mx: 'auto', mb: 2 }}>
                                <BusinessIcon sx={{ color: '#fff', fontSize: 32 }} />
                            </Box>
                            <Typography variant="h4" fontWeight={800} gutterBottom>
                                Setup Your Organisation
                            </Typography>
                            <Typography color="text.secondary">
                                Namaskar <strong>{user?.name}</strong>! Apni organisation setup karo aur ERP shuru karo.
                            </Typography>
                        </Box>

                        {/* Stepper */}
                        <Stepper activeStep={step} sx={{ mb: 4 }}>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        {(formErr || error) && (
                            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setFormErr('')}>
                                {formErr || error}
                            </Alert>
                        )}

                        {/* Step 0 — Basic Info */}
                        {step === 0 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="Organisation Name *" name="name"
                                            value={formData.name} onChange={handleChange}
                                            placeholder="e.g. Sharma Enterprises Pvt Ltd"
                                            InputProps={{ startAdornment: <InputAdornment position="start"><BusinessIcon sx={{ color: '#667eea' }} /></InputAdornment> }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Business Email" name="email" type="email"
                                            value={formData.email} onChange={handleChange}
                                            placeholder="contact@company.com"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Phone" name="phone"
                                            value={formData.phone} onChange={handleChange}
                                            placeholder="+91 98765 43210"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                    </Grid>
                                </Grid>
                            </motion.div>
                        )}

                        {/* Step 1 — Location & Tax */}
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="Address" name="address" multiline rows={2}
                                            value={formData.address} onChange={handleChange}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><LocationIcon sx={{ color: '#667eea' }} /></InputAdornment> }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="City" name="city"
                                            value={formData.city} onChange={handleChange}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Country" name="country"
                                            value={formData.country} onChange={handleChange}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="GST Number" name="gst_number"
                                            value={formData.gst_number} onChange={handleChange}
                                            placeholder="22AAAAA0000A1Z5"
                                            InputProps={{ startAdornment: <InputAdornment position="start"><GstIcon sx={{ color: '#667eea' }} /></InputAdornment> }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="PAN Number" name="pan_number"
                                            value={formData.pan_number} onChange={handleChange}
                                            placeholder="AAAAA0000A"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                    </Grid>
                                </Grid>
                            </motion.div>
                        )}

                        {/* Step 2 — Review */}
                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <Box sx={{ bgcolor: '#f8fafc', borderRadius: '12px', p: 3, mb: 2 }}>
                                    <Typography fontWeight={700} variant="h6" mb={2}>
                                        🏢 Review Organisation Details
                                    </Typography>
                                    <Grid container spacing={1.5}>
                                        {[
                                            { label: 'Name',       value: formData.name },
                                            { label: 'Email',      value: formData.email      || '—' },
                                            { label: 'Phone',      value: formData.phone      || '—' },
                                            { label: 'City',       value: formData.city       || '—' },
                                            { label: 'Country',    value: formData.country    || '—' },
                                            { label: 'GST Number', value: formData.gst_number || '—' },
                                            { label: 'PAN Number', value: formData.pan_number || '—' },
                                        ].map((item) => (
                                            <Grid item xs={6} key={item.label}>
                                                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                                                <Typography fontWeight={600} variant="body2">{item.value}</Typography>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                                <Alert severity="info" sx={{ borderRadius: '10px' }}>
                                    Aap <strong>Owner</strong> honge is organisation ke — baad mein team members add kar sakte ho.
                                </Alert>
                            </motion.div>
                        )}

                        {/* Actions */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={4}>
                            <Button onClick={() => setStep((p) => p - 1)} disabled={step === 0}
                                sx={{ textTransform: 'none', borderRadius: '10px' }}>
                                Back
                            </Button>

                            {step < 2 ? (
                                <GradientButton onClick={handleNext} endIcon={<NextIcon />}>
                                    Continue
                                </GradientButton>
                            ) : (
                                <GradientButton onClick={handleSubmit} disabled={actionLoading}
                                    startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : <CheckIcon />}>
                                    {actionLoading ? 'Creating...' : 'Create Organisation'}
                                </GradientButton>
                            )}
                        </Stack>

                        {/* Skip option */}
                        <Box textAlign="center" mt={2}>
                            <Button onClick={() => navigate('/dashboard')} size="small"
                                sx={{ textTransform: 'none', color: 'text.secondary' }}>
                                Skip — Personal account use karo
                            </Button>
                        </Box>
                    </CardContent>
                </GlassCard>
            </motion.div>
        </Box>
    );
}
