import { getErrorMessage } from "../utils/getErrorMessage";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createCategoryAPI, getCategoryAPI, updateCategoryAPI, deleteCategoryAPI } from "../redux/features/categorySlice";
import {
    Container, CircularProgress, Alert,
    TextField, Button, MenuItem, Select, Box, FormControl, Snackbar,
    IconButton
} from "@mui/material";
import { Edit, Delete, Mic } from "@mui/icons-material";
import { ConfirmDialog, DataTable, FormSection, PageHeader, StatusChip } from "../components/common";

const CategoryPage = () => {
    const dispatch = useDispatch();
    const [categoryName, setCategoryName] = useState("");
    const [categoryType, setCategoryType] = useState("Expense");
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [visibleCount, setVisibleCount] = useState(5);
    const [deleteCandidate, setDeleteCandidate] = useState(null);

    const { list: categories, loading, error } = useSelector((state) => state.category);

    useEffect(() => {
        dispatch(getCategoryAPI());
    }, [dispatch]);

    const handleAddOrUpdateCategory = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            setSnackbarMessage("Category name is required!");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
            return;
        }

        try {
            if (editId) {

                await dispatch(updateCategoryAPI({ id: editId, name: categoryName, type: categoryType })).unwrap();
                setSnackbarMessage("Category updated successfully!");
            } else {
                await dispatch(createCategoryAPI({ name: categoryName, type: categoryType })).unwrap();
                setSnackbarMessage("Category added successfully!");
            }

            setSnackbarSeverity("success");
            setCategoryName("");
            setCategoryType("Expense");

            setEditId(null); 
            setShowForm(false);
            dispatch(getCategoryAPI());
        } catch (error) {
            setSnackbarMessage(getErrorMessage(error, "Failed to process category!"));
            setSnackbarSeverity("error");
        }

        setOpenSnackbar(true);
    };

    const handleEdit = (category) => {

        setCategoryName(category.name);
        setCategoryType(category.type);
        setEditId(category.id);
        setShowForm(true);
    };

    const handleDelete = async () => {
        if (!deleteCandidate?.id) return;

        try {
            await dispatch(deleteCategoryAPI(deleteCandidate.id)).unwrap();
            setSnackbarMessage("Category deleted successfully!");
            setSnackbarSeverity("success");
            setDeleteCandidate(null);
            dispatch(getCategoryAPI());
        } catch (error) {
            setSnackbarMessage(getErrorMessage(error, "Failed to delete category!"));
            setSnackbarSeverity("error");
        }
        setOpenSnackbar(true);
    };

    const handleSpeechToText = () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;
            setCategoryName(speechResult);
            setSnackbarMessage("Speech recognized successfully!");
            setSnackbarSeverity("success");
            setOpenSnackbar(true);
        };

        recognition.onerror = () => {
            setSnackbarMessage("Speech recognition failed. Please try again.");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        };

        recognition.start();
    };

    const handleSpeechToSelectType = () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript.toLowerCase();
            if (speechResult.includes("income")) {
                setCategoryType("Income");
                setSnackbarMessage("Category type set to Income!");
                setSnackbarSeverity("success");
            } else if (speechResult.includes("expense")) {
                setCategoryType("Expense");
                setSnackbarMessage("Category type set to Expense!");
                setSnackbarSeverity("success");
            } else {
                setSnackbarMessage("Unrecognized category type. Please say 'Income' or 'Expense'.");
                setSnackbarSeverity("error");
            }
            setOpenSnackbar(true);
        };

        recognition.onerror = () => {
            setSnackbarMessage("Speech recognition failed. Please try again.");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        };

        recognition.start();
    };

    return (
        <Container>
            <PageHeader
                title="Categories"
                subtitle="Create and maintain category types for transactions."
                actions={[
                    {
                        label: showForm ? "Cancel" : "Add Category",
                        onClick: () => setShowForm(!showForm),
                    },
                ]}
            />

            {showForm && (
                <FormSection
                    title={editId ? "Edit Category" : "Add New Category"}
                    sx={{ mb: 3, maxWidth: 720, mx: "auto" }}
                >
                            <form onSubmit={handleAddOrUpdateCategory}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Category Name"
                                        variant="outlined"
                                        value={categoryName}
                                        onChange={(e) => setCategoryName(e.target.value)}
                                        InputProps={{
                                            endAdornment: (
                                                <IconButton color="primary" onClick={handleSpeechToText} edge="end" tabIndex={-1}>
                                                    <Mic />
                                                </IconButton>
                                            ),
                                        }}
                                    />
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <FormControl fullWidth>
                                        <Select
                                            value={categoryType}
                                            onChange={(e) => setCategoryType(e.target.value)}
                                            displayEmpty
                                            // Add a custom renderValue to show mic inside the select input
                                            renderValue={(selected) => (
                                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                                    <span style={{ flex: 1 }}>{selected}</span>
                                                    <IconButton
                                                        color="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSpeechToSelectType();
                                                        }}
                                                        edge="end"
                                                        size="small"
                                                        tabIndex={-1}
                                                        sx={{ ml: 1 }}
                                                    >
                                                        <Mic fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        >
                                            <MenuItem value="Expense">Expense</MenuItem>
                                            <MenuItem value="Income">Income</MenuItem>
                                            <MenuItem value="borrow">Loan</MenuItem>
                                            <MenuItem value="borrow_return">Borrow Return</MenuItem>
                                            <MenuItem value="saving">Saving</MenuItem>
                                            <MenuItem value="reimbursement">Reimbursement</MenuItem>
                                            <MenuItem value="transfer">Transfer</MenuItem>
                                            <MenuItem value="repayment">Repayment</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                    fullWidth
                                    sx={{ py: 1.5, fontSize: "16px" }}
                                >
                                    {editId ? "Update Category" : "Add Category"}
                                </Button>
                            </form>
                </FormSection>
            )}

            {loading ? (
                <CircularProgress />
            ) : error ? (
                error.includes("Forbidden") ? (
                    <Alert severity="error">Access Denied: Admin access required</Alert>
                ) : (
                    <Alert severity="error">{error}</Alert>
                )
            ) : categories?.length === 0 ? (
                <Alert severity="info">No categories found.</Alert>
            ) : (

                <FormSection title="All Categories">
                    <DataTable
                        rows={categories.slice(0, visibleCount)}
                        emptyMessage="No categories found."
                        getRowId={(row, index) => row?.id || index}
                        columns={[
                            { field: "name", headerName: "Category Name", fallback: "Unnamed" },
                            {
                                field: "type",
                                headerName: "Type",
                                render: (value) => <StatusChip status={value} label={value || "Unknown"} />,
                            },
                            {
                                id: "actions",
                                headerName: "Actions",
                                render: (_, item) => (
                                    <>
                                        <IconButton color="primary" onClick={() => handleEdit(item)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => setDeleteCandidate(item)}>
                                            <Delete />
                                        </IconButton>
                                    </>
                                ),
                            },
                        ]}
                    />
                    {visibleCount < categories.length && (
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => setVisibleCount(visibleCount + 10)}
                        >
                            Load More
                        </Button>
                    )}
                </FormSection>
            )}

            <ConfirmDialog
                open={Boolean(deleteCandidate)}
                title="Delete category?"
                description={`Are you sure you want to delete ${deleteCandidate?.name || "this category"}?`}
                confirmLabel="Delete"
                onClose={() => setDeleteCandidate(null)}
                onConfirm={handleDelete}
            />

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};


export default CategoryPage;
