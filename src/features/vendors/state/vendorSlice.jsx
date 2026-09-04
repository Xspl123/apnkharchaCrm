import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import vendorService from '../services/vendorService';

// ── Vendor Thunks ─────────────────────────────────────────

export const getVendors = createAsyncThunk(
    'vendors/getAll',
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await vendorService.getAll(params);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const getVendorSummary = createAsyncThunk(
    'vendors/getSummary',
    async (_, { rejectWithValue }) => {
        try {
            const res = await vendorService.getSummary();
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const getPurchaseOrderById = createAsyncThunk(
    'vendors/getPOById',
    async (id, { rejectWithValue }) => {
        try {
            const res = await vendorService.getPOById(id);
            return res.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || 'Error'
            );
        }
    }
);

export const createVendor = createAsyncThunk(
    'vendors/create',
    async (data, { rejectWithValue }) => {
        try {
            const res = await vendorService.create(data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const updateVendor = createAsyncThunk(
    'vendors/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await vendorService.update(id, data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const deleteVendor = createAsyncThunk(
    'vendors/delete',
    async (id, { rejectWithValue }) => {
        try {
            await vendorService.remove(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

// ── Purchase Order Thunks ─────────────────────────────────

export const getPurchaseOrders = createAsyncThunk(
    'vendors/getAllPOs',
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await vendorService.getAllPOs(params);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const getPOSummary = createAsyncThunk(
    'vendors/getPOSummary', 
    async (_, { rejectWithValue }) => {
        try {
            const res = await vendorService.getPOSummary();
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const createPurchaseOrder = createAsyncThunk(
    'vendors/createPO',
    async (data, { rejectWithValue }) => {
        try {
            const res = await vendorService.createPO(data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const updatePOStatus = createAsyncThunk(
    'vendors/updatePOStatus',
    async ({ id, status }, { rejectWithValue }) => {
        try {
            const res = await vendorService.updatePOStatus(id, status);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const deletePurchaseOrder = createAsyncThunk(
    'vendors/deletePO',
    async (id, { rejectWithValue }) => {
        try {
            await vendorService.deletePO(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

// ── Payment Thunks ────────────────────────────────────────

export const getVendorPayments = createAsyncThunk(
    'vendors/getPayments',
    async (params, { rejectWithValue }) => {
        try {
            const res = await vendorService.getPayments(params);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const createVendorPayment = createAsyncThunk(
    'vendors/createPayment',
    async (data, { rejectWithValue }) => {
        try {
            const res = await vendorService.createPayment(data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const deleteVendorPayment = createAsyncThunk(
    'vendors/deletePayment',
    async (id, { rejectWithValue }) => {
        try {
            await vendorService.deletePayment(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

// ── Initial State ─────────────────────────────────────────

const initialState = {
    vendors:        [],
    vendorSummary:  null,
    purchaseOrders: [],
    poSummary:      null,
    payments:       [],
    isLoading:      false,
    actionLoading:  false,
    isError:        false,
    message:        '',
};

// ── Slice ─────────────────────────────────────────────────

const vendorSlice = createSlice({
    name: 'vendors',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading     = false;
            state.actionLoading = false;
            state.isError       = false;
            state.message       = '';
        },
        clearVendorPayments: (state) => {
            state.payments = [];
        },
    },
    extraReducers: (builder) => {
        builder

        // ── Vendors ──
        .addCase(getVendors.pending,  (state) => { state.isLoading = true; })
        .addCase(getVendors.fulfilled,(state, action) => {
            state.isLoading = false;
            state.vendors   = action.payload.data || action.payload;
        })
        .addCase(getVendors.rejected, (state, action) => {
            state.isLoading = false;
            state.isError   = true;
            state.message   = action.payload;
        })

        .addCase(getVendorSummary.fulfilled, (state, action) => {
            state.vendorSummary = action.payload;
        })

        .addCase(createVendor.pending,  (state) => { state.actionLoading = true; })
        .addCase(createVendor.fulfilled,(state, action) => {
            state.actionLoading = false;
            state.vendors.unshift(action.payload.data);
        })
        .addCase(createVendor.rejected, (state, action) => {
            state.actionLoading = false;
            state.message       = action.payload;
        })

        .addCase(updateVendor.pending,  (state) => { state.actionLoading = true; })
        .addCase(updateVendor.fulfilled,(state, action) => {
            state.actionLoading = false;
            const idx = state.vendors.findIndex(v => v.id === action.payload.data.id);
            if (idx !== -1) state.vendors[idx] = action.payload.data;
        })
        .addCase(updateVendor.rejected, (state, action) => {
            state.actionLoading = false;
            state.message       = action.payload;
        })

        .addCase(deleteVendor.fulfilled,(state, action) => {
            state.vendors = state.vendors.filter(v => v.id !== action.payload);
        })

        // ── Purchase Orders ──
        .addCase(getPurchaseOrders.pending,  (state) => { state.isLoading = true; })
        .addCase(getPurchaseOrders.fulfilled,(state, action) => {
            state.isLoading      = false;
            state.purchaseOrders = action.payload.data || action.payload;
        })
        .addCase(getPurchaseOrders.rejected, (state, action) => {
            state.isLoading = false;
            state.isError   = true;
            state.message   = action.payload;
        })

        .addCase(getPOSummary.fulfilled, (state, action) => {
            state.poSummary = action.payload;
        })

        .addCase(createPurchaseOrder.pending,  (state) => { state.actionLoading = true; })
        .addCase(createPurchaseOrder.fulfilled,(state, action) => {
            state.actionLoading = false;
            state.purchaseOrders.unshift(action.payload.data);
        })
        .addCase(createPurchaseOrder.rejected, (state, action) => {
            state.actionLoading = false;
            state.message       = action.payload;
        })

        .addCase(updatePOStatus.pending,  (state) => { state.actionLoading = true; })
        .addCase(updatePOStatus.fulfilled,(state, action) => {
            state.actionLoading = false;
            const idx = state.purchaseOrders.findIndex(p => p.id === action.payload.data.id);
            if (idx !== -1) state.purchaseOrders[idx] = action.payload.data;
        })
        .addCase(updatePOStatus.rejected, (state, action) => {
            state.actionLoading = false;
            state.message       = action.payload;
        })

        .addCase(deletePurchaseOrder.fulfilled,(state, action) => {
            state.purchaseOrders = state.purchaseOrders.filter(p => p.id !== action.payload);
        })

        // ── Payments ──
        .addCase(getVendorPayments.pending,  (state) => {
            state.isLoading = true;
            state.payments = [];
        })
        .addCase(getVendorPayments.fulfilled,(state, action) => {
            state.isLoading = false;
            state.payments  = action.payload.data || action.payload;
        })
        .addCase(getVendorPayments.rejected, (state) => { state.isLoading = false; })

        .addCase(createVendorPayment.pending,  (state) => { state.actionLoading = true; })
        .addCase(createVendorPayment.fulfilled,(state, action) => {
            state.actionLoading = false;
            state.payments.unshift(action.payload.data);
        })
        .addCase(createVendorPayment.rejected, (state, action) => {
            state.actionLoading = false;
            state.message       = action.payload;
        })

        .addCase(deleteVendorPayment.fulfilled,(state, action) => {
            state.payments = state.payments.filter(p => p.id !== action.payload);
        });
    },
});

export const { reset, clearVendorPayments } = vendorSlice.actions;
export default vendorSlice.reducer;
