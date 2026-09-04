import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getProducts, createProduct, updateProduct, deleteProduct,
    getCategories, createCategory, updateCategory, deleteCategory,
    getMovementsByProduct, createMovement, reset,
} from '../features/inventory/state/inventorySlice';
import { getHsnCodes } from '../redux/features/hsnCodeSlice';
import {
    emptyProduct,
    emptyCategory,
    emptyMovement
} from '../features/inventory/components/shared';

export const appendSpeech = (value, transcript) =>
    [value, transcript].filter(Boolean).join(' ').trim();

export const useProductList = () => {
    const dispatch = useDispatch();
    const { products, categories, productMovements, isLoading, actionLoading } =
        useSelector((s) => s.inventory);
    const { hsnCodes } = useSelector((s) => s.hsnCodes);

    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedProduct, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearch] = useState('');
    const [statusFilter, setStatus] = useState('all');
    const [categoryFilter, setCategory] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRows] = useState(10);
    const [formData, setFormData] = useState({ ...emptyProduct });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [activeTab, setActiveTab] = useState(0);

    const [viewDialog, setViewDialog] = useState(false);
    const [viewProduct, setViewProduct] = useState(null);
    const [viewTab, setViewTab] = useState(0);

    const [catDialog, setCatDialog] = useState(false);
    const [catForm, setCatForm] = useState({ ...emptyCategory });
    const [catEdit, setCatEdit] = useState(null);

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const [deleteCatDialog, setDelCat] = useState(false);
    const [catToDelete, setCatToDelete] = useState(null);

    const [movDialog, setMovDialog] = useState(false);
    const [movForm, setMovForm] = useState({ ...emptyMovement });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([dispatch(getProducts()), dispatch(getCategories()), dispatch(getHsnCodes()),]);
        } finally { setLoading(false); }
    }, [dispatch]);

    useEffect(() => {
        loadData();
        return () => { dispatch(reset()); };
    }, [dispatch, loadData]);

    const showSnack = (message, severity = 'success') =>
        setSnackbar({ open: true, message, severity });

    const filtered = products.filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
            p.name?.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q) ||
            p.hsn_code?.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchCategory = categoryFilter === 'all' || String(p.product_category_id) === String(categoryFilter);
        const matchStock =
            stockFilter === 'all' ? true :
                stockFilter === 'low_stock' ? p.is_low_stock :
                    stockFilter === 'out_of_stock' ? p.is_out_of_stock : true;
        return matchSearch && matchStatus && matchCategory && matchStock;
    });

    const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
    };

    const handleOpenCreate = () => {
        setFormData({ ...emptyProduct });
        setEditMode(false); setSelected(null); setShowForm(true);
    };

    const handleEdit = (product) => {
        setFormData({
            product_category_id: product.product_category_id || '',
            name: product.name || '',
            sku: product.sku || '',
            hsn_code: product.hsn_code || '',
            description: product.description || '',
            unit: product.unit || 'pcs',
            purchase_price: product.purchase_price || '',
            selling_price: product.selling_price || '',
            tax_rate: product.tax_rate || 18,
            opening_stock: product.opening_stock || 0,
            low_stock_alert: product.low_stock_alert || 0,
            status: product.status || 'active',
            notes: product.notes || '',
        });
        setSelected(product); setEditMode(true); setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false); setEditMode(false); setSelected(null);
        setFormData({ ...emptyProduct });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) { showSnack('Product name required hai!', 'error'); return; }
        try {
            setLoading(true);
            if (editMode && selectedProduct) {
                await dispatch(updateProduct({ id: selectedProduct.id, data: formData })).unwrap();
                showSnack('Product updated successfully!');
            } else {
                await dispatch(createProduct(formData)).unwrap();
                showSnack('Product created successfully!');
            }
            handleCancel();
            await dispatch(getProducts());
        } catch (err) {
            showSnack(typeof err === 'string' ? err : 'Operation failed!', 'error');
        } finally { setLoading(false); }
    };

    const handleDeleteConfirm = (product) => { setToDelete(product); setDeleteDialog(true); };

    const handleDelete = async () => {
        try {
            setLoading(true);
            await dispatch(deleteProduct(toDelete.id)).unwrap();
            showSnack('Product deleted!');
            setDeleteDialog(false);
        } catch (err) {
            showSnack(typeof err === 'string' ? err : 'Delete failed!', 'error');
        } finally { setLoading(false); }
    };

    const handleView = async (product) => {
        setViewProduct(product); setViewDialog(true); setViewTab(0);
        await dispatch(getMovementsByProduct({ id: product.id, params: {} }));
    };

    const handleCatSubmit = async (e) => {
        e.preventDefault();
        if (!catForm.name.trim()) { showSnack('Category name required!', 'error'); return; }
        try {
            setLoading(true);
            if (catEdit) {
                await dispatch(updateCategory({ id: catEdit.id, data: catForm })).unwrap();
                showSnack('Category updated!');
            } else {
                await dispatch(createCategory(catForm)).unwrap();
                showSnack('Category created!');
            }
            setCatDialog(false); setCatForm({ ...emptyCategory }); setCatEdit(null);
            await dispatch(getCategories());
        } catch (err) {
            showSnack(typeof err === 'string' ? err : 'Failed!', 'error');
        } finally { setLoading(false); }
    };

    const handleDeleteCat = async () => {
        try {
            setLoading(true);
            await dispatch(deleteCategory(catToDelete.id)).unwrap();
            showSnack('Category deleted!');
            setDelCat(false);
            await dispatch(getCategories());
        } catch (err) {
            showSnack(typeof err === 'string' ? err : 'Delete failed!', 'error');
        } finally { setLoading(false); }
    };

    const handleOpenMovement = (product) => {
        setMovForm({ ...emptyMovement, product_id: product.id, rate: product.avg_cost || '' });
        setMovDialog(true);
    };

    // ✅ FIXED: adjustment type — physical count se difference nikalo
    const handleMovementSubmit = async (e) => {
        e.preventDefault();
        if (!movForm.qty || movForm.qty === '') { showSnack('Valid qty daalo!', 'error'); return; }

        let submitData = { ...movForm };

        if (movForm.type === 'adjustment') {
            // ✅ Adjustment = physical count — user ne actual stock enter kiya
            const currentProduct = products.find((p) => p.id === movForm.product_id);
            const currentStock = parseFloat(currentProduct?.current_stock ?? 0);
            const newStock = parseFloat(movForm.qty);
            const diff = newStock - currentStock;

            if (diff === 0) {
                showSnack('Stock same hai — koi change nahi!', 'info');
                return;
            }

            submitData = {
                ...movForm,
                // ✅ backend ke sahi type bhejo
                type: diff > 0 ? 'adjustment_plus' : 'adjustment_minus',
                qty: Math.abs(diff),   // difference qty
                notes: movForm.notes || `Physical count: ${newStock} ${currentProduct?.unit || 'pcs'} (was ${currentStock})`,
            };
        } else {
            const qty = parseFloat(movForm.qty);
            if (qty <= 0) { showSnack('Qty 0 se zyada honi chahiye!', 'error'); return; }
            submitData = { ...movForm, qty };
        }

        try {
            setLoading(true);
            await dispatch(createMovement(submitData)).unwrap();
            showSnack('Stock movement recorded!');
            setMovDialog(false);
            await dispatch(getProducts());
        } catch (err) {
            showSnack(typeof err === 'string' ? err : 'Movement failed!', 'error');
        } finally { setLoading(false); }
    };

    const stats = {
        total: products.length,
        inStock: products.filter((p) => p.stock_status === 'in_stock').length,
        lowStock: products.filter((p) => p.is_low_stock).length,
        outStock: products.filter((p) => p.is_out_of_stock).length,
    };

    // ── current product for movement dialog ──
    const movProduct = products.find((p) => p.id === movForm.product_id);

    return {
        // reference data
        products, categories, productMovements, isLoading, actionLoading, hsnCodes,

        // form / edit state
        showForm, setShowForm, editMode, selectedProduct, formData, setFormData,
        handleChange, handleOpenCreate, handleEdit, handleCancel, handleSubmit,

        // loading / snackbar
        loading, snackbar, setSnackbar, showSnack,

        // filters + pagination
        searchQuery, setSearch, statusFilter, setStatus, categoryFilter, setCategory,
        stockFilter, setStockFilter, page, setPage, rowsPerPage, setRows,
        filtered, paginated,

        // tabs
        activeTab, setActiveTab,

        // view dialog
        viewDialog, setViewDialog, viewProduct, viewTab, setViewTab, handleView,

        // category dialog
        catDialog, setCatDialog, catForm, setCatForm, catEdit, setCatEdit, handleCatSubmit,

        // delete dialogs
        deleteDialog, setDeleteDialog, toDelete, setToDelete, handleDeleteConfirm, handleDelete,
        deleteCatDialog, setDelCat, catToDelete, setCatToDelete, handleDeleteCat,

        // stock movement dialog
        movDialog, setMovDialog, movForm, setMovForm, handleOpenMovement, handleMovementSubmit, movProduct,

        // misc
        loadData, stats,
    };
};
