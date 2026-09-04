import { getErrorMessage } from "../utils/getErrorMessage";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    getHsnCodes,
    createHsnCode,
    updateHsnCode,
    deleteHsnCode,
    reset,
} from "../redux/features/hsnCodeSlice";

import {
    Container,
    Typography,
    TextField,
    Button,
    Snackbar,
    IconButton,
    Collapse,
    Alert,
    Card,
    CardContent,
    Grid,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import {
    ConfirmDialog,
    DataTable,
    FormSection,
    PageHeader,
    StatusChip,
} from "../components/common";

const HsnCodeList = () => {
    const dispatch = useDispatch();
    const hsnCodeState = useSelector((state) => state.hsnCodes);
    const hsnCodes = hsnCodeState?.hsnCodes || [];

    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedHsn, setSelectedHsn] = useState(null);

    const [formData, setFormData] = useState({
        hsn_code: "",
        description: "",
        gst_rate: 18,
    });

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [hsnToDelete, setHsnToDelete] = useState(null);

    useEffect(() => {
        dispatch(getHsnCodes());
        return () => dispatch(reset());
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

        if (!formData.hsn_code || !formData.description) {
            setSnackbar({
                open: true,
                message: "Please fill required fields!",
                severity: "error",
            });
            return;
        }

        try {
            if (editMode && selectedHsn) {
                await dispatch(
                    updateHsnCode({
                        id: selectedHsn.id,
                        data: formData,
                    })
                ).unwrap();

                setSnackbar({
                    open: true,
                    message: "HSN Code updated successfully!",
                    severity: "success",
                });
            } else {
                await dispatch(createHsnCode(formData)).unwrap();

                setSnackbar({
                    open: true,
                    message: "HSN Code added successfully!",
                    severity: "success",
                });
            }

            handleCancel();
            dispatch(getHsnCodes());
        } catch (err) {
            setSnackbar({
                open: true,
                message: getErrorMessage(err, "Operation failed!"),
                severity: "error",
            });
        }
    };

    const handleEdit = (hsn) => {
        setEditMode(true);
        setSelectedHsn(hsn);
        setFormData({
            hsn_code: hsn.hsn_code || "",
            description: hsn.description || "",
            gst_rate: hsn.gst_rate || 18,
        });
        setShowForm(true);
    };

    const handleDeleteConfirm = (hsn) => {
        setHsnToDelete(hsn);
        setDeleteDialog(true);
    };

    const handleDelete = async () => {
        try {
            await dispatch(deleteHsnCode(hsnToDelete.id)).unwrap();

            setSnackbar({
                open: true,
                message: "HSN Code deleted successfully!",
                severity: "success",
            });

            setDeleteDialog(false);
            setHsnToDelete(null);

            dispatch(getHsnCodes());
        } catch (err) {
            setSnackbar({
                open: true,
                message: getErrorMessage(err, "Failed to delete HSN Code!"),
                severity: "error",
            });
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditMode(false);
        setSelectedHsn(null);
        setFormData({
            hsn_code: "",
            description: "",
            gst_rate: 18,
        });
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <PageHeader
                title="HSN Code Master"
                subtitle="Maintain GST HSN codes and tax rates used in invoices."
                meta={`${hsnCodes.length} HSN Codes`}
                actions={[
                    {
                        label: showForm ? "Cancel" : "Add HSN Code",
                        icon: <AddIcon />,
                        onClick: () => setShowForm(!showForm),
                    },
                ]}
            />

            {/* Statistics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
                        <CardContent>
                            <Typography variant="h6">Total HSN Codes</Typography>
                            <Typography variant="h4">{hsnCodes.length}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white" }}>
                        <CardContent>
                            <Typography variant="h6">18% GST</Typography>
                            <Typography variant="h4">
                                {hsnCodes.filter((h) => parseFloat(h.gst_rate) === 18).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white" }}>
                        <CardContent>
                            <Typography variant="h6">12% GST</Typography>
                            <Typography variant="h4">
                                {hsnCodes.filter((h) => parseFloat(h.gst_rate) === 12).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", color: "white" }}>
                        <CardContent>
                            <Typography variant="h6">5% GST</Typography>
                            <Typography variant="h4">
                                {hsnCodes.filter((h) => parseFloat(h.gst_rate) === 5).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Form */}
            <Collapse in={showForm}>
                <FormSection
                    title={editMode ? "Edit HSN Code" : "New HSN Code"}
                    sx={{ mb: 3 }}
                >
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="HSN Code"
                                    name="hsn_code"
                                    fullWidth
                                    required
                                    value={formData.hsn_code}
                                    onChange={handleChange}
                                    placeholder="e.g., 998314"
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="Description"
                                    name="description"
                                    fullWidth
                                    required
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="e.g., Software Development Services"
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    label="GST Rate (%)"
                                    name="gst_rate"
                                    type="number"
                                    fullWidth
                                    required
                                    value={formData.gst_rate}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="success"
                                    fullWidth
                                    size="large"
                                >
                                    {editMode ? "Update HSN Code" : "Save HSN Code"}
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

            {/* HSN Codes Table */}
            <FormSection title="All HSN Codes">
                <DataTable
                    rows={hsnCodes}
                    emptyMessage="No HSN codes found. Add your first HSN code."
                    columns={[
                        {
                            field: "hsn_code",
                            headerName: "HSN Code",
                            render: (value) => (
                                <Typography variant="body1" fontWeight={600}>
                                    {value}
                                </Typography>
                            ),
                        },
                        { field: "description", headerName: "Description" },
                        {
                            field: "gst_rate",
                            headerName: "GST Rate",
                            render: (value) => (
                                <StatusChip status="active" label={`${value}%`} />
                            ),
                        },
                        {
                            id: "actions",
                            headerName: "Actions",
                            align: "center",
                            render: (_, hsn) => (
                                <>
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleEdit(hsn)}
                                        title="Edit"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteConfirm(hsn)}
                                        title="Delete"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </>
                            ),
                        },
                    ]}
                />
            </FormSection>

            {/* Delete Dialog */}
            <ConfirmDialog
                open={deleteDialog}
                title="Confirm Delete"
                description={`Are you sure you want to delete HSN Code ${hsnToDelete?.hsn_code || ""} - ${hsnToDelete?.description || ""}?`}
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

export default HsnCodeList;
