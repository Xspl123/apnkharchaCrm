import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getVendors, getVendorLedger } from "../state/vendorSlice";
import VendorLedger from "../components/VendorLedger";
import { Container, Box, CircularProgress, Alert, Button, Stack, Typography, Breadcrumbs, Link } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import StoreIcon from "@mui/icons-material/Store";

const VendorLedgerPage = () => {
    const { vendorId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { vendors, ledger } = useSelector((state) => state.vendors);
    const fetchedRef = useRef(false);

    const currentVendorId = parseInt(vendorId, 10);

    useEffect(() => {
        if (!vendors || vendors.length === 0) {
            dispatch(getVendors());
        }
    }, [dispatch, vendors]);

    useEffect(() => {
        if (vendorId) {
            const hasDataForThisVendor = ledger.data && ledger.openVendorId === currentVendorId;
            if (!hasDataForThisVendor && !fetchedRef.current) {
                dispatch(getVendorLedger(currentVendorId));
                fetchedRef.current = true;
            }
        }
        return () => { fetchedRef.current = false; };
    }, [vendorId, dispatch, ledger.data, ledger.openVendorId, currentVendorId]);

    const vendor = (vendors || []).find((v) => v.id === currentVendorId);
    const responseData = ledger?.data?.data || ledger?.data;
    const vendorName = vendor?.vendor_name || responseData?.vendor || "Vendor";

    const handleClose = () => {
        navigate("/vendors/list");
    };

    if (ledger.isLoading && !ledger.data) {
        return (
            <Container maxWidth="xl" sx={{ py: 6 }}>
                <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "60vh", gap: 2 }}>
                    <CircularProgress size={48} />
                    <Typography variant="body1" color="text.secondary">
                        Loading financial ledger for {vendorName}...
                    </Typography>
                </Box>
            </Container>
        );
    }

    if (ledger.isError) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={() => {
                            fetchedRef.current = false;
                            dispatch(getVendorLedger(currentVendorId));
                        }}>
                            Retry
                        </Button>
                    }
                >
                    {ledger.message || "Failed to load ledger data"}
                </Alert>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/vendors/list")} sx={{ mt: 2 }} variant="outlined">
                    Back to Vendors
                </Button>
            </Container>
        );
    }

    return (
        <Box sx={{ position: "relative", minHeight: "100vh", bgcolor: "background.default" }}>
            <Box sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                        <Link
                            underline="hover"
                            color="inherit"
                            onClick={() => navigate("/vendors/list")}
                            sx={{ display: "flex", alignItems: "center", cursor: "pointer", gap: 0.5 }}
                        >
                            <StoreIcon fontSize="inherit" />
                            Vendors
                        </Link>
                        <Typography color="text.primary" fontWeight={600}>
                            {vendorName} Ledger
                        </Typography>
                    </Breadcrumbs>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/vendors/list")} variant="outlined" size="small">
                        Back to Vendors
                    </Button>
                </Stack>
            </Box>

            <VendorLedger
                open={true}
                onClose={handleClose}
                vendorId={currentVendorId}
                vendorName={vendorName}
            />
        </Box>
    );
};

export default VendorLedgerPage;