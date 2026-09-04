import { Box, Container, Paper, Tabs, Tab, LinearProgress, Snackbar, Alert, Fade } from '@mui/material';
import AttributeManager from '../components/AttributeManager';
import ProductHeader from '../components/ProductHeader';
import ProductStatsCards from '../components/ProductStatsCards';
import ProductFilters from '../components/ProductFilters';
import ProductForm from '../components/ProductForm';
import ProductsTable from '../components/ProductsTable';
import CategoriesTab from '../components/CategoriesTab';
import ProductViewDialog from '../components/ProductViewDialog';
import CategoryDialog from '../components/CategoryDialog';
import StockMovementDialog from '../components/StockMovementDialog';
import { DeleteProductDialog, DeleteCategoryDialog } from '../components/DeleteDialogs';
import { useProductList, appendSpeech } from "../../../hooks/useProductList";

const ProductList = () => {
    const p = useProductList();

    return (
        <>
            {p.loading && (
                <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
                    <LinearProgress />
                </Box>
            )}

            <Container maxWidth="xl" sx={{ py: 4 }}>

                <ProductHeader stats={p.stats} />

                <ProductStatsCards stats={p.stats} categoriesCount={p.categories.length} />

                {/* ══ TABS ══ */}
                <Paper sx={{ mb: 2, borderRadius: '12px' }} elevation={1}>
                    <Tabs value={p.activeTab} onChange={(_, v) => p.setActiveTab(v)} sx={{ px: 2 }}>
                        <Tab label={`📦 Products (${p.products.length})`} />
                        <Tab label={`🏷️ Categories (${p.categories.length})`} />
                        <Tab label="🎛️ Attributes" />
                    </Tabs>
                </Paper>

                {p.activeTab === 0 && (
                    <>
                        <ProductFilters
                            searchQuery={p.searchQuery} setSearch={p.setSearch} appendSpeech={appendSpeech}
                            categoryFilter={p.categoryFilter} setCategory={p.setCategory} categories={p.categories}
                            stockFilter={p.stockFilter} setStockFilter={p.setStockFilter}
                            statusFilter={p.statusFilter} setStatus={p.setStatus}
                            loadData={p.loadData} showForm={p.showForm}
                            handleCancel={p.handleCancel} handleOpenCreate={p.handleOpenCreate}
                        />

                        <ProductForm
                            showForm={p.showForm} editMode={p.editMode} selectedProduct={p.selectedProduct}
                            formData={p.formData} setFormData={p.setFormData}
                            handleChange={p.handleChange} handleSubmit={p.handleSubmit} handleCancel={p.handleCancel}
                            categories={p.categories} hsnCodes={p.hsnCodes} actionLoading={p.actionLoading}
                            appendSpeech={appendSpeech}
                        />

                        <ProductsTable
                            isLoading={p.isLoading} paginated={p.paginated} filtered={p.filtered}
                            page={p.page} rowsPerPage={p.rowsPerPage} setPage={p.setPage} setRows={p.setRows}
                            handleView={p.handleView} handleOpenMovement={p.handleOpenMovement}
                            handleEdit={p.handleEdit} handleDeleteConfirm={p.handleDeleteConfirm}
                            handleOpenCreate={p.handleOpenCreate}
                        />
                    </>
                )}

                {p.activeTab === 1 && (
                    <CategoriesTab
                        categories={p.categories}
                        setCatForm={p.setCatForm} setCatEdit={p.setCatEdit} setCatDialog={p.setCatDialog}
                        setCatToDelete={p.setCatToDelete} setDelCat={p.setDelCat}
                    />
                )}

                {p.activeTab === 2 && (
                    <AttributeManager categories={p.categories} />
                )}

                <ProductViewDialog
                    viewDialog={p.viewDialog} setViewDialog={p.setViewDialog} viewProduct={p.viewProduct}
                    viewTab={p.viewTab} setViewTab={p.setViewTab} productMovements={p.productMovements}
                    handleOpenMovement={p.handleOpenMovement} handleEdit={p.handleEdit}
                />

                <CategoryDialog
                    catDialog={p.catDialog} setCatDialog={p.setCatDialog} catForm={p.catForm}
                    setCatForm={p.setCatForm} catEdit={p.catEdit} handleCatSubmit={p.handleCatSubmit}
                    loading={p.loading} appendSpeech={appendSpeech}
                />

                <StockMovementDialog
                    movDialog={p.movDialog} setMovDialog={p.setMovDialog} movForm={p.movForm}
                    setMovForm={p.setMovForm} movProduct={p.movProduct}
                    handleMovementSubmit={p.handleMovementSubmit} loading={p.loading} appendSpeech={appendSpeech}
                />

                <DeleteProductDialog
                    open={p.deleteDialog} onClose={() => p.setDeleteDialog(false)}
                    toDelete={p.toDelete} onConfirm={p.handleDelete} loading={p.loading}
                />

                <DeleteCategoryDialog
                    open={p.deleteCatDialog} onClose={() => p.setDelCat(false)}
                    catToDelete={p.catToDelete} onConfirm={p.handleDeleteCat} loading={p.loading}
                />

                {/* ══ SNACKBAR ══ */}
                <Snackbar open={p.snackbar.open} autoHideDuration={4000}
                    onClose={() => p.setSnackbar((s) => ({ ...s, open: false }))}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    TransitionComponent={Fade}>
                    <Alert severity={p.snackbar.severity} variant="filled"
                        sx={{ borderRadius: '12px', fontWeight: 500 }}>
                        {p.snackbar.message}
                    </Alert>
                </Snackbar>

            </Container>
        </>
    );
};

export default ProductList;
