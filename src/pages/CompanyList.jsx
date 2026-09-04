// src/pages/CompanyList.jsx
import { getErrorMessage } from "../utils/getErrorMessage";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    getCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    reset,
} from "../redux/features/companySlice";

import {
    Container,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Grid,
    Snackbar,
    Alert,
    IconButton,
    Avatar,
    Box,
    Collapse,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import BusinessIcon from "@mui/icons-material/Business";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { ConfirmDialog, FormSection, PageHeader } from "../components/common";
import "./CompanyList.css";

const CompanyList = () => {
    const dispatch = useDispatch();
    const companyState = useSelector((state) => state.companies);
    const companies = companyState?.companies || [];

    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    const [formData, setFormData] = useState({
        company_name: "",
        logo: null,
        address: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
        email: "",
        gstin: "",
        pan: "",
        website: "",
        bank_name: "",
        bank_account_no: "",
        bank_ifsc: "",
        bank_branch: "",
    });

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState(null);

    useEffect(() => {
        dispatch(getCompanies());
        return () => dispatch(reset());
    }, [dispatch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({
                ...prev,
                logo: file,
            }));
            setLogoPreview(URL.createObjectURL(file));
        }
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

        const submitData = new FormData();
        Object.keys(formData).forEach((key) => {
            if (formData[key] !== null && formData[key] !== "") {
                submitData.append(key, formData[key]);
            }
        });

        // For Laravel PUT request workaround
        if (editMode) {
            submitData.append('_method', 'PUT');
        }

        try {
            if (editMode && selectedCompany) {
                await dispatch(
                    updateCompany({
                        id: selectedCompany.id,
                        formData: submitData,
                    })
                ).unwrap();

                setSnackbar({
                    open: true,
                    message: "Company updated successfully!",
                    severity: "success",
                });
            } else {
                await dispatch(createCompany(submitData)).unwrap();

                setSnackbar({
                    open: true,
                    message: "Company added successfully!",
                    severity: "success",
                });
            }

            handleCancel();
            dispatch(getCompanies());
        } catch (err) {
            setSnackbar({
                open: true,
                message: getErrorMessage(err, "Operation failed!"),
                severity: "error",
            });
        }
    };

    const handleEdit = (company) => {
        setEditMode(true);
        setSelectedCompany(company);
        setFormData({
            company_name: company.company_name || "",
            logo: null,
            address: company.address || "",
            city: company.city || "",
            state: company.state || "",
            pincode: company.pincode || "",
            phone: company.phone || "",
            email: company.email || "",
            gstin: company.gstin || "",
            pan: company.pan || "",
            website: company.website || "",
            bank_name: company.bank_name || "",
            bank_account_no: company.bank_account_no || "",
            bank_ifsc: company.bank_ifsc || "",
            bank_branch: company.bank_branch || "",
        });
        setLogoPreview(company.logo_url);
        setShowForm(true);
    };

    const handleDeleteConfirm = (company) => {
        setCompanyToDelete(company);
        setDeleteDialog(true);
    };

    const handleDelete = async () => {
        try {
            await dispatch(deleteCompany(companyToDelete.id)).unwrap();
            setSnackbar({
                open: true,
                message: "Company deleted successfully!",
                severity: "success",
            });
            setDeleteDialog(false);
            setCompanyToDelete(null);
            dispatch(getCompanies());
        } catch (err) {
            setSnackbar({
                open: true,
                message: getErrorMessage(err, "Failed to delete company!"),
                severity: "error",
            });
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditMode(false);
        setSelectedCompany(null);
        setLogoPreview(null);
        setFormData({
            company_name: "",
            logo: null,
            address: "",
            city: "",
            state: "",
            pincode: "",
            phone: "",
            email: "",
            gstin: "",
            pan: "",
            website: "",
            bank_name: "",
            bank_account_no: "",
            bank_ifsc: "",
            bank_branch: "",
        });
    };

    return (
        <Container maxWidth="xl" className="company-page">
            <PageHeader
                title="Company Management"
                subtitle="Manage company profiles, GST details and banking information."
                meta={`${companies.length} Companies`}
                actions={[
                    {
                        label: showForm ? "Cancel" : "Add Company",
                        onClick: () => setShowForm(!showForm),
                    },
                ]}
            />

            {/* Form */}
            <Collapse in={showForm}>
                <FormSection
                    title={editMode ? "Edit Company" : "New Company"}
                    sx={{ mb: 3 }}
                >
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                {/* Logo Upload */}
                                <Grid item xs={12} className="company-page__logo-upload">
                                    <input
                                        accept="image/*"
                                        className="company-page__logo-input"
                                        id="logo-upload"
                                        type="file"
                                        onChange={handleLogoChange}
                                    />
                                    <label htmlFor="logo-upload">
                                        <Avatar
                                            src={logoPreview}
                                            className="company-page__logo-avatar"
                                        >
                                            <AddPhotoAlternateIcon className="company-page__logo-icon" />
                                        </Avatar>
                                    </label>
                                    <Typography variant="caption" className="company-page__logo-caption">
                                        Click to upload logo
                                    </Typography>
                                </Grid>

                                {/* Company Details */}
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Company Name"
                                        name="company_name"
                                        fullWidth
                                        required
                                        value={formData.company_name}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Email"
                                        name="email"
                                        type="email"
                                        fullWidth
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Phone"
                                        name="phone"
                                        fullWidth
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Website"
                                        name="website"
                                        fullWidth
                                        value={formData.website}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        label="Address"
                                        name="address"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="City"
                                        name="city"
                                        fullWidth
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="State"
                                        name="state"
                                        fullWidth
                                        value={formData.state}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Pincode"
                                        name="pincode"
                                        fullWidth
                                        value={formData.pincode}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="GSTIN"
                                        name="gstin"
                                        fullWidth
                                        value={formData.gstin}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="PAN"
                                        name="pan"
                                        fullWidth
                                        value={formData.pan}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                {/* Bank Details */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" className="company-page__section-title">
                                        Bank Details
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Bank Name"
                                        name="bank_name"
                                        fullWidth
                                        value={formData.bank_name}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Account Number"
                                        name="bank_account_no"
                                        fullWidth
                                        value={formData.bank_account_no}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="IFSC Code"
                                        name="bank_ifsc"
                                        fullWidth
                                        value={formData.bank_ifsc}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Branch"
                                        name="bank_branch"
                                        fullWidth
                                        value={formData.bank_branch}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                {/* Buttons */}
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="success"
                                        fullWidth
                                        size="large"
                                    >
                                        {editMode ? "Update Company" : "Save Company"}
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        fullWidth
                                        size="large"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                </FormSection>
            </Collapse>

            {/* Company Cards */}
            <Grid container spacing={3}>
                {companies.map((company) => (
                    <Grid item xs={12} md={6} lg={4} key={company.id}>
                        <Card className="company-page__card">
                            <CardContent>
                                <Box className="company-page__card-header">
                                    <Avatar
                                        src={company.logo_url}
                                        className="company-page__card-avatar"
                                    >
                                        <BusinessIcon />
                                    </Avatar>
                                    <Box flex={1}>
                                        <Typography variant="h6" fontWeight="600">
                                            {company.company_name}
                                        </Typography>
                                        <Typography variant="caption" className="company-page__card-email">
                                            {company.email}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography variant="body2" gutterBottom>
                                    📞 {company.phone || "N/A"}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    📍 {company.city}, {company.state}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    🔖 GSTIN: {company.gstin || "N/A"}
                                </Typography>

                                <Box className="company-page__card-actions">
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleEdit(company)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteConfirm(company)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {companies.length === 0 && (
                    <Grid item xs={12}>
                        <Typography variant="body1" className="company-page__empty">
                            No companies found. Add your first company!
                        </Typography>
                    </Grid>
                )}
            </Grid>

            <ConfirmDialog
                open={deleteDialog}
                title="Delete company?"
                description={`Are you sure you want to delete ${companyToDelete?.company_name || "this company"}?`}
                confirmLabel="Delete"
                onClose={() => setDeleteDialog(false)}
                onConfirm={handleDelete}
            />

            {/* Snackbar */}
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

export default CompanyList;
