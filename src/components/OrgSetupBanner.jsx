import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Stack } from '@mui/material';
import { Business as BusinessIcon, ArrowForward as ArrowIcon } from '@mui/icons-material';

/**
 * OrgSetupBanner
 * 
 * Dashboard mein add karo — Personal users ko dikhega
 * Org users ko nahi dikhega
 * 
 * Usage:
 * import OrgSetupBanner from '../components/OrgSetupBanner';
 * // Dashboard.jsx mein sabse upar add karo:
 * <OrgSetupBanner />
 */
export default function OrgSetupBanner() {
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);

    // Org already hai → banner mat dikhao
    if (user?.org_id) return null;

    return (
        <Box sx={{
            mb: 3,
            p: 2.5,
            borderRadius: '14px',
            background: 'linear-gradient(135deg,#667eea,#764ba2)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
        }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{
                    width: 44, height: 44, borderRadius: '10px',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <BusinessIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                    <Typography fontWeight={700} variant="body1">
                        🚀 Organisation Setup Karein
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                        Inventory, Invoices, CRM aur ERP modules use karne ke liye organisation banayein
                    </Typography>
                </Box>
            </Stack>
            <Button
                onClick={() => navigate('/organisation/setup')}
                endIcon={<ArrowIcon />}
                sx={{
                    bgcolor: '#fff',
                    color: '#764ba2',
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 3,
                    '&:hover': { bgcolor: '#f3f0ff' },
                    whiteSpace: 'nowrap',
                }}>
                Setup Karein
            </Button>
        </Box>
    );
}