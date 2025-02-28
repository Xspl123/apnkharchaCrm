import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createCategoryAPI, getCategoryAPI, updateCategoryAPI, deleteCategoryAPI } from "../redux/features/categorySlice";
import {
    Container, Typography, Table, TableHead, TableRow, TableCell,
    TableBody, CircularProgress, Alert, Paper, TableContainer,
    TextField, Button, Grid, MenuItem, Select, Box, FormControl, Snackbar,
    IconButton
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

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
            setSnackbarMessage(error?.message || "Failed to process category!");
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

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                await dispatch(deleteCategoryAPI(id)).unwrap();
                setSnackbarMessage("Category deleted successfully!");
                setSnackbarSeverity("success");
                dispatch(getCategoryAPI());
            } catch (error) {
                setSnackbarMessage(error?.message || "Failed to delete category!");
                setSnackbarSeverity("error");
            }
            setOpenSnackbar(true);
        }
    };

    return (
        <Container>
            <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: "bold", color: "#1976d2" }}>
                Categories
            </Typography>

            <Button variant="contained" color="primary" onClick={() => setShowForm(!showForm)} sx={{ mb: 2 }}>
                {showForm ? "Cancel" : "Add Category"}
            </Button>

            {showForm && (
                <Grid item xs={12} md={6}>
                    <Box
                        p={4}
                        sx={{
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            backgroundColor: "#fff",
                            boxShadow: 2,
                            maxWidth: "500px",
                            mx: "auto",
                        }}
                    >
                        <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold", textAlign: "center" }}>
                            {editId ? "Edit Category" : "Add New Category"}
                        </Typography>

                        <form onSubmit={handleAddOrUpdateCategory}>
                            <TextField fullWidth label="Category Name" variant="outlined" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} sx={{ mb: 2 }} />

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <Select value={categoryType} onChange={(e) => setCategoryType(e.target.value)}>
                                    <MenuItem value="Expense">Expense</MenuItem>
                                    <MenuItem value="Income">Income</MenuItem>
                                </Select>
                            </FormControl>

                            <Button variant="contained" color="primary" type="submit" fullWidth sx={{ py: 1.5, fontSize: "16px" }}>
                                {editId ? "Update Category" : "Add Category"}
                            </Button>
                        </form>
                    </Box>
                </Grid>
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
                <>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                            <TableRow sx={{ backgroundColor: "#1976d2", color: "white" }}>                                    <TableCell><strong>ID</strong></TableCell>
                                    <TableCell><strong>Category Name</strong></TableCell>
                                    <TableCell><strong>Type</strong></TableCell>
                                    <TableCell><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {categories.slice(0, visibleCount).map((item, index) => (
                                    <TableRow key={item?.id || index}>
                                        <TableCell>{item?.id ?? "N/A"}</TableCell>
                                        <TableCell>{item?.name ?? "Unnamed"}</TableCell>
                                        <TableCell>{item?.type ?? "Unknown"}</TableCell>
                                        <TableCell>
                                            <IconButton color="primary" onClick={() => handleEdit(item)}>
                                                <Edit />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => handleDelete(item?.id)}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {visibleCount < categories.length && (
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => setVisibleCount(visibleCount + 10)}
                            sx={{ mt: 2 }}
                        >
                            Load More
                        </Button>
                    )}
                </>
            )}

            <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default CategoryPage;
