// src/pages/ClientList.jsx
import { getErrorMessage } from "../utils/getErrorMessage";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; // Add this

import {
    getClients,
    createClient,
    updateClient,
    deleteClient,
    reset,
} from "../redux/features/clientSlice";

import {
    Container,
    Typography,
    TextField,
    Button,
    Snackbar,
    IconButton,
    Collapse,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Grid,
    Stack,
    Tooltip,
    InputAdornment,
} from "@mui/material";

// Icons
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance"; // Add this
import { ConfirmDialog, DataTable, FormSection, PageHeader, SearchFilterBar } from "../components/common";
import "./ClientList.css";

const ClientList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate(); // Add this
    const { clients } = useSelector((state) => state.clients);
    
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    
    const [formData, setFormData] = useState({
        company_name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        gstin: "",
        opening_balance: "",
    });

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);

    const [viewDialog, setViewDialog] = useState(false);
    const [clientToView, setClientToView] = useState(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        dispatch(getClients());
        
        return () => {
            dispatch(reset());
        };
    }, [dispatch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.company_name) {
            setSnackbar({
                open: true,
                message: "Company name is required!",
                severity: "error",
            });
            return;
        }

        try {
            if (editMode && selectedClient) {
                await dispatch(
                    updateClient({
                        id: selectedClient.id,
                        data: formData,
                    })
                ).unwrap();
                
                setSnackbar({
                    open: true,
                    message: "Client updated successfully!",
                    severity: "success",
                });
            } else {
                await dispatch(createClient(formData)).unwrap();
                
                setSnackbar({
                    open: true,
                    message: "Client added successfully!",
                    severity: "success",
                });
            }

            setShowForm(false);
            setEditMode(false);
            setSelectedClient(null);
            setFormData({
                company_name: "",
                contact_person: "",
                phone: "",
                email: "",
                address: "",
                gstin: "",
                opening_balance: "",
            });

            dispatch(getClients());
        } catch (err) {
            setSnackbar({
                open: true,
                message: getErrorMessage(err, "Operation failed!"),
                severity: "error",
            });
        }
    };

    const handleEdit = (client) => {
        setEditMode(true);
        setSelectedClient(client);
        setFormData({
            company_name: client.company_name,
            contact_person: client.contact_person || "",
            phone: client.phone || "",
            email: client.email || "",
            address: client.address || "",
            gstin: client.gstin || "",
            opening_balance: client.opening_balance || "",
        });
        setShowForm(true);
    };

    const handleDeleteConfirm = (client) => {
        setClientToDelete(client);
        setDeleteDialog(true);
    };

    const handleDelete = async () => {
        try {
            await dispatch(deleteClient(clientToDelete.id)).unwrap();
            
            setSnackbar({
                open: true,
                message: "Client deleted successfully!",
                severity: "success",
            });
            
            setDeleteDialog(false);
            setClientToDelete(null);
            
            dispatch(getClients());
        } catch (err) {
            setSnackbar({
                open: true,
                message: getErrorMessage(err, "Failed to delete client!"),
                severity: "error",
            });
        }
    };

    const handleView = (client) => {
        setClientToView(client);
        setViewDialog(true);
    };

    // NEW: Handle Ledger View
    const handleViewLedger = (clientId, _clientName) => {
        navigate(`/clients/${clientId}/ledger`);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditMode(false);
        setSelectedClient(null);
        setFormData({
            company_name: "",
            contact_person: "",
            phone: "",
            email: "",
            address: "",
            gstin: "",
            opening_balance: "",
        });
    };

    const filteredClients = clients.filter((client) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            client.company_name?.toLowerCase().includes(searchLower) ||
            client.contact_person?.toLowerCase().includes(searchLower) ||
            client.email?.toLowerCase().includes(searchLower) ||
            client.phone?.toLowerCase().includes(searchLower) ||
            client.gstin?.toLowerCase().includes(searchLower)
        );
    });

    const paginatedClients = filteredClients.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const handleChangePage = (_, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <Container maxWidth="xl" className="client-page">
            <PageHeader
                title="Client Management"
                subtitle="Manage your clients and view their financial ledger."
                icon={<BusinessIcon />}
                meta={`${filteredClients.length} Clients`}
                actions={[
                    {
                        label: showForm ? "Cancel" : "Add New Client",
                        icon: showForm ? <CloseIcon /> : <AddIcon />,
                        color: showForm ? "error" : "primary",
                        onClick: () => setShowForm(!showForm),
                    },
                ]}
            />

            {/* Form - Add/Edit Client */}
            <Collapse in={showForm}>
                <FormSection
                    title={editMode ? "Edit Client" : "Add New Client"}
                    sx={{ mb: 3 }}
                >
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            {/* Company Name */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Company Name"
                                    name="company_name"
                                    fullWidth
                                    required
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <BusinessIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Contact Person */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Contact Person"
                                    name="contact_person"
                                    fullWidth
                                    value={formData.contact_person}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Phone */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Phone"
                                    name="phone"
                                    fullWidth
                                    value={formData.phone}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PhoneIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Email */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    fullWidth
                                    value={formData.email}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* GSTIN */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="GSTIN"
                                    name="gstin"
                                    fullWidth
                                    value={formData.gstin}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <ReceiptIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Opening Balance */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Opening Balance"
                                    name="opening_balance"
                                    type="number"
                                    fullWidth
                                    value={formData.opening_balance}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">₹</InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Address */}
                            <Grid item xs={12}>
                                <TextField
                                    label="Address"
                                    name="address"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </Grid>

                            {/* Action Buttons */}
                            <Grid item xs={12}>
                                <Stack direction="row" spacing={2} justifyContent="flex-end" className="client-page__form-actions">
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={handleCancel}
                                        startIcon={<CloseIcon />}
                                        className="client-page__form-button"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="success"
                                        startIcon={editMode ? <EditIcon /> : <AddIcon />}
                                        className="client-page__form-button"
                                    >
                                        {editMode ? "Update Client" : "Save Client"}
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </form>
                </FormSection>
            </Collapse>

            {/* Clients Table */}
            <FormSection title={`All Clients (${filteredClients.length})`}>
                <SearchFilterBar
                    searchValue={searchQuery}
                    onSearchChange={(value) => {
                        setSearchQuery(value);
                        setPage(0);
                    }}
                    searchPlaceholder="Search clients..."
                    sx={{ mb: 0 }}
                />
                <DataTable
                    rows={paginatedClients}
                    emptyMessage="No clients found."
                    pagination={{
                        count: filteredClients.length,
                        rowsPerPage,
                        page,
                        rowsPerPageOptions: [5, 10, 25, 50],
                        onPageChange: handleChangePage,
                        onRowsPerPageChange: handleChangeRowsPerPage,
                    }}
                    columns={[
                        {
                            field: "company_name",
                            headerName: "Company Name",
                            render: (value) => (
                                <Typography variant="body1" className="client-page__company-name">
                                    {value}
                                </Typography>
                            ),
                        },
                        { field: "contact_person", headerName: "Contact Person" },
                        { field: "phone", headerName: "Phone" },
                        { field: "email", headerName: "Email" },
                        {
                            field: "gstin",
                            headerName: "GSTIN",
                            render: (value) => value ? <Chip label={value} size="small" variant="outlined" /> : "-",
                        },
                        {
                            field: "opening_balance",
                            headerName: "Opening Balance",
                            render: (value) => (
                                <Chip
                                    label={formatCurrency(value)}
                                    color={parseFloat(value) > 0 ? "success" : "default"}
                                    size="small"
                                    className="client-page__balance-chip"
                                />
                            ),
                        },
                        {
                            id: "actions",
                            headerName: "Actions",
                            align: "center",
                            render: (_, client) => (
                                <Stack direction="row" spacing={1} justifyContent="center" className="client-page__action-stack">
                                    <Tooltip title="View Ledger">
                                        <IconButton size="small" color="secondary" onClick={() => handleViewLedger(client.id, client.company_name)}>
                                            <AccountBalanceIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="View Details">
                                        <IconButton size="small" color="info" onClick={() => handleView(client)}>
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit Client">
                                        <IconButton size="small" color="primary" onClick={() => handleEdit(client)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete Client">
                                        <IconButton size="small" color="error" onClick={() => handleDeleteConfirm(client)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            ),
                        },
                    ]}
                />
            </FormSection>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialog}
                title="Delete client?"
                description={`Are you sure you want to delete ${clientToDelete?.company_name || "this client"}? This action cannot be undone.`}
                confirmLabel="Delete"
                onClose={() => setDeleteDialog(false)}
                onConfirm={handleDelete}
            />

            {/* View Client Details Dialog */}
            <Dialog
                open={viewDialog}
                onClose={() => setViewDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle className="client-page__view-title">
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <BusinessIcon color="primary" />
                        <Typography variant="h6">Client Details</Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    {clientToView && (
                        <Grid container spacing={2} className="client-page__view-grid">
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Company Name:</strong>{" "}
                                    {clientToView.company_name}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Contact Person:</strong>{" "}
                                    {clientToView.contact_person || "N/A"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Phone:</strong> {clientToView.phone || "N/A"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Email:</strong> {clientToView.email || "N/A"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>GSTIN:</strong> {clientToView.gstin || "N/A"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Opening Balance:</strong>{" "}
                                    {formatCurrency(clientToView.opening_balance)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Address:</strong>{" "}
                                    {clientToView.address || "N/A"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Created At:</strong> {clientToView.created_at}
                                </Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions className="client-page__view-actions">
                    <Button onClick={() => setViewDialog(false)} variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ClientList;
