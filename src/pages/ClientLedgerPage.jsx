// src/pages/ClientLedgerPage.jsx
import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getClients, getClientLedger } from "../redux/features/clientSlice";
import ClientLedger from "../components/ClientLedger";
import { Container, Box, CircularProgress, Alert, Button, Stack, Typography, Breadcrumbs, Link } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import BusinessIcon from "@mui/icons-material/Business";

const ClientLedgerPage = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { clients, ledger } = useSelector((state) => state.clients);
    const fetchedRef = useRef(false);

    const currentClientId = parseInt(clientId, 10);

    // Agar direct URL refresh ho toh clients list load karein
    useEffect(() => {
        if (!clients || clients.length === 0) {
            dispatch(getClients());
        }
    }, [dispatch, clients]);

    // Ledger data fetch
    useEffect(() => {
        if (clientId) {
            const hasDataForThisClient = ledger.data && ledger.openClientId === currentClientId;
            if (!hasDataForThisClient && !fetchedRef.current) {
                dispatch(getClientLedger(currentClientId));
                fetchedRef.current = true;
            }
        }

        return () => {
            fetchedRef.current = false;
        };
    }, [clientId, dispatch, ledger.data, ledger.openClientId, currentClientId]);

    // Client name resolve karein (Loading... par atka nahi rahega)
    const client = (clients || []).find((c) => c.id === currentClientId);
    const responseData = ledger?.data?.data || ledger?.data;
    const clientName = client?.company_name || responseData?.client || "Client";

    const handleClose = () => {
        navigate("/clients");
    };

    // Loading state
    if (ledger.isLoading && !ledger.data) {
        return (
            <Container maxWidth="xl" sx={{ py: 6 }}>
                <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "60vh", gap: 2 }}>
                    <CircularProgress size={48} />
                    <Typography variant="body1" color="text.secondary">
                        Loading financial ledger for {clientName}...
                    </Typography>
                </Box>
            </Container>
        );
    }

    // Error state
    if (ledger.isError) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Alert
                    severity="error"
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => {
                                fetchedRef.current = false;
                                dispatch(getClientLedger(currentClientId));
                            }}
                        >
                            Retry
                        </Button>
                    }
                >
                    {ledger.message || "Failed to load ledger data"}
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/clients")}
                    sx={{ mt: 2 }}
                    variant="outlined"
                >
                    Back to Clients
                </Button>
            </Container>
        );
    }

    return (
        <Box sx={{ position: "relative", minHeight: "100vh", bgcolor: "background.default" }}>
            {/* Background Navigation Header */}
            <Box sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
                        <Link
                            underline="hover"
                            color="inherit"
                            onClick={() => navigate("/clients")}
                            sx={{ display: "flex", alignItems: "center", cursor: "pointer", gap: 0.5 }}
                        >
                            <BusinessIcon fontSize="inherit" />
                            Clients
                        </Link>
                        <Typography color="text.primary" fontWeight={600}>
                            {clientName} Ledger
                        </Typography>
                    </Breadcrumbs>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate("/clients")}
                        variant="outlined"
                        size="small"
                    >
                        Back to Clients
                    </Button>
                </Stack>
            </Box>

            {/* Ledger Component */}
            <ClientLedger
                open={true}
                onClose={handleClose}
                clientId={currentClientId}
                clientName={clientName}
            />
        </Box>
    );
};

export default ClientLedgerPage;