import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import inventoryService from '../services/inventoryService';

// ── Category Thunks ───────────────────────────────────────

export const getCategories = createAsyncThunk(
    'inventory/getCategories',
    async (_, { rejectWithValue }) => {
        try {
            const res = await inventoryService.getCategories();
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const createCategory = createAsyncThunk(
    'inventory/createCategory',
    async (data, { rejectWithValue }) => {
        try {
            const res = await inventoryService.createCategory(data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const updateCategory = createAsyncThunk(
    'inventory/updateCategory',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await inventoryService.updateCategory(id, data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const deleteCategory = createAsyncThunk(
    'inventory/deleteCategory',
    async (id, { rejectWithValue }) => {
        try {
            await inventoryService.deleteCategory(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

// ── Product Thunks ────────────────────────────────────────

export const getProducts = createAsyncThunk(
    'inventory/getProducts',
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await inventoryService.getProducts(params);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const getProductSummary = createAsyncThunk(
    'inventory/getProductSummary',
    async (_, { rejectWithValue }) => {
        try {
            const res = await inventoryService.getProductSummary();
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const getLowStock = createAsyncThunk(
    'inventory/getLowStock',
    async (_, { rejectWithValue }) => {
        try {
            const res = await inventoryService.getLowStock();
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const createProduct = createAsyncThunk(
    'inventory/createProduct',
    async (data, { rejectWithValue }) => {
        try {
            const res = await inventoryService.createProduct(data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const updateProduct = createAsyncThunk(
    'inventory/updateProduct',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await inventoryService.updateProduct(id, data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const deleteProduct = createAsyncThunk(
    'inventory/deleteProduct',
    async (id, { rejectWithValue }) => {
        try {
            await inventoryService.deleteProduct(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

// ── Stock Movement Thunks ─────────────────────────────────

export const getMovements = createAsyncThunk(
    'inventory/getMovements',
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await inventoryService.getMovements(params);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const getMovementsByProduct = createAsyncThunk(
    'inventory/getMovementsByProduct',
    async ({ id, params }, { rejectWithValue }) => {
        try {
            const res = await inventoryService.getMovementsByProduct(id, params);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const getInventoryReport = createAsyncThunk(
    'inventory/getReport',
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await inventoryService.getReport(params);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const createMovement = createAsyncThunk(
    'inventory/createMovement',
    async (data, { rejectWithValue }) => {
        try {
            const res = await inventoryService.createMovement(data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const deleteMovement = createAsyncThunk(
    'inventory/deleteMovement',
    async (id, { rejectWithValue }) => {
        try {
            await inventoryService.deleteMovement(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

// ── Initial State ─────────────────────────────────────────

const initialState = {
    categories:      [],
    products:        [],
    productSummary:  null,
    lowStockItems:   [],
    movements:       [],
    productMovements:[],
    inventoryReport: null,
    isLoading:       false,
    actionLoading:   false,
    isError:         false,
    message:         '',
};

// ── Slice ─────────────────────────────────────────────────

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading     = false;
            state.actionLoading = false;
            state.isError       = false;
            state.message       = '';
        },
    },
    extraReducers: (builder) => {
        builder

        // ── Categories ──
        .addCase(getCategories.fulfilled, (state, action) => {
            state.categories = action.payload.data || action.payload;
        })
        .addCase(createCategory.pending,   (state) => { state.actionLoading = true; })
        .addCase(createCategory.fulfilled, (state, action) => {
            state.actionLoading = false;
            state.categories.push(action.payload.data);
        })
        .addCase(createCategory.rejected,  (state, action) => {
            state.actionLoading = false;
            state.message       = action.payload;
        })
        .addCase(updateCategory.fulfilled, (state, action) => {
            state.actionLoading = false;
            const idx = state.categories.findIndex(c => c.id === action.payload.data.id);
            if (idx !== -1) state.categories[idx] = action.payload.data;
        })
        .addCase(deleteCategory.fulfilled, (state, action) => {
            state.categories = state.categories.filter(c => c.id !== action.payload);
        })

        // ── Products ──
        .addCase(getProducts.pending,   (state) => { state.isLoading = true; })
        .addCase(getProducts.fulfilled, (state, action) => {
            state.isLoading = false;
            state.products  = action.payload.data || action.payload;
        })
        .addCase(getProducts.rejected,  (state, action) => {
            state.isLoading = false;
            state.isError   = true;
            state.message   = action.payload;
        })

        .addCase(getProductSummary.fulfilled, (state, action) => {
            state.productSummary = action.payload;
        })

        .addCase(getLowStock.fulfilled, (state, action) => {
            state.lowStockItems = action.payload.data || action.payload;
        })

        .addCase(createProduct.pending,   (state) => { state.actionLoading = true; })
        .addCase(createProduct.fulfilled, (state, action) => {
            state.actionLoading = false;
            state.products.unshift(action.payload.data);
        })
        .addCase(createProduct.rejected,  (state, action) => {
            state.actionLoading = false;
            state.message       = action.payload;
        })

        .addCase(updateProduct.pending,   (state) => { state.actionLoading = true; })
        .addCase(updateProduct.fulfilled, (state, action) => {
            state.actionLoading = false;
            const idx = state.products.findIndex(p => p.id === action.payload.data.id);
            if (idx !== -1) state.products[idx] = action.payload.data;
        })
        .addCase(updateProduct.rejected,  (state, action) => {
            state.actionLoading = false;
            state.message       = action.payload;
        })

        .addCase(deleteProduct.fulfilled, (state, action) => {
            state.products = state.products.filter(p => p.id !== action.payload);
        })

        // ── Movements ──
        .addCase(getMovements.pending,   (state) => { state.isLoading = true; })
        .addCase(getMovements.fulfilled, (state, action) => {
            state.isLoading = false;
            state.movements = action.payload.data || action.payload;
        })
        .addCase(getMovements.rejected,  (state) => { state.isLoading = false; })

        .addCase(getMovementsByProduct.fulfilled, (state, action) => {
            state.productMovements = action.payload.data || action.payload;
        })

        .addCase(getInventoryReport.pending,   (state) => { state.isLoading = true; })
        .addCase(getInventoryReport.fulfilled, (state, action) => {
            state.isLoading       = false;
            state.inventoryReport = action.payload;
        })
        .addCase(getInventoryReport.rejected,  (state) => { state.isLoading = false; })

        .addCase(createMovement.pending,   (state) => { state.actionLoading = true; })
        .addCase(createMovement.fulfilled, (state, action) => {
            state.actionLoading = false;
            state.movements.unshift(action.payload.data);
        })
        .addCase(createMovement.rejected,  (state, action) => {
            state.actionLoading = false;
            state.message       = action.payload;
        })

        .addCase(deleteMovement.fulfilled, (state, action) => {
            state.movements = state.movements.filter(m => m.id !== action.payload);
        });
    },
});

export const { reset } = inventorySlice.actions;
export default inventorySlice.reducer;
