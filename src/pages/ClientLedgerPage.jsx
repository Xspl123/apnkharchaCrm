// src/pages/ClientLedgerPage.jsx
import { useEffect, useRef } from 'react'; // Add useRef
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getClientLedger } from '../redux/features/clientSlice';
import ClientLedger from '../components/ClientLedger';
import { Container, Box, CircularProgress, Alert, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ClientLedgerPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { clients, ledger } = useSelector((state) => state.clients);
  const fetchedRef = useRef(false); // Add ref to prevent multiple fetches

  // ========== FIXED: Fetch only once ==========
  useEffect(() => {
    const currentClientId = parseInt(clientId);
    
    // Only fetch if:
    // 1. clientId exists
    // 2. Haven't fetched before
    // 3. Don't have data OR client changed
    if (clientId) {
      const hasDataForThisClient = ledger.data && ledger.openClientId === currentClientId;
      
      if (!hasDataForThisClient && !fetchedRef.current) {
        dispatch(getClientLedger(currentClientId));
        fetchedRef.current = true;
      }
    }

    // Reset ref when component unmounts
    return () => {
      fetchedRef.current = false;
    };
  }, [clientId, dispatch, ledger.data, ledger.openClientId]);

  // Find client name
  const client = clients.find(c => c.id === parseInt(clientId));
  const clientName = client?.company_name || 'Loading...';

  const handleClose = () => {
    navigate('/clients');
  };

  // Loading state
  if (ledger.isLoading && !ledger.data) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
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
                fetchedRef.current = false; // Reset ref on retry
                dispatch(getClientLedger(parseInt(clientId)));
              }}
            >
              Retry
            </Button>
          }
        >
          {ledger.message || 'Failed to load ledger data'}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/clients')}
          sx={{ mt: 2 }}
        >
          Back to Clients
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/clients')}
        sx={{ 
          position: 'absolute', 
          top: 20, 
          left: 20, 
          zIndex: 10,
          bgcolor: 'white',
          boxShadow: 1,
          '&:hover': { bgcolor: '#f5f5f5' }
        }}
      >
        Back to Clients
      </Button>

      {/* Ledger Component - open is always true for page */}
      <ClientLedger
        open={true}
        onClose={handleClose}
        clientId={parseInt(clientId)}
        clientName={clientName}
      />
    </Box>
  );
};

export default ClientLedgerPage;
