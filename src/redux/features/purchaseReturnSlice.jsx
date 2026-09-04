// src/redux/features/purchaseReturnSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getErrorMessage } from "../../utils/getErrorMessage";
import axiosClient from '../../api/axiosClient';

const initialState = {
    purchaseReturns: [],
    purchaseReturn:  null,
    isLoading:       false,
    isSuccess:       false,
    isError:         false,
    message:         '',
};

// ── Get All ───────────────────────────────────────────────
export const getPurchaseReturns = createAsyncThunk(
    'purchaseReturns/getAll',
    async (filters = {}, thunkAPI) => {
        try {
            const q = new URLSearchParams(filters).toString();
            const res = await axiosClient.get(q ? `/purchase-returns?${q}` : '/purchase-returns');
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

// ── Get By PO ─────────────────────────────────────────────
export const getPurchaseReturnsByPO = createAsyncThunk(
    'purchaseReturns/getByPO',
    async (poId, thunkAPI) => {
        try {
            const res = await axiosClient.get(`/purchase-returns/by-po/${poId}`);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

// ── Get Single ────────────────────────────────────────────
export const getPurchaseReturn = createAsyncThunk(
    'purchaseReturns/getById',
    async (id, thunkAPI) => {
        try {
            const res = await axiosClient.get(`/purchase-returns/${id}`);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

// ── Create ────────────────────────────────────────────────
export const createPurchaseReturn = createAsyncThunk(
    'purchaseReturns/create',
    async (data, thunkAPI) => {
        try {
            const res = await axiosClient.post('/purchase-returns', data);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

// ── Update Status ─────────────────────────────────────────
export const updatePurchaseReturnStatus = createAsyncThunk(
    'purchaseReturns/updateStatus',
    async ({ id, status }, thunkAPI) => {
        try {
            const res = await axiosClient.patch(`/purchase-returns/${id}/status`, { status });
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

// ── Slice ─────────────────────────────────────────────────
const purchaseReturnSlice = createSlice({
    name: 'purchaseReturns',
    initialState,
    reducers: {
        resetPurchaseReturn: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError   = false;
            state.message   = '';
        },
        clearPurchaseReturn: (state) => {
            state.purchaseReturn = null;
        },
    },
    extraReducers: (builder) => {
        const pending  = (state)         => { state.isLoading = true;  state.isError = false; };
        const rejected = (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; };

        builder
            .addCase(getPurchaseReturns.pending,   pending)
            .addCase(getPurchaseReturns.fulfilled, (state, action) => {
                state.isLoading      = false;
                state.purchaseReturns = action.payload.data ?? action.payload;
            })
            .addCase(getPurchaseReturns.rejected,  rejected)

            .addCase(getPurchaseReturnsByPO.pending,   pending)
            .addCase(getPurchaseReturnsByPO.fulfilled, (state, action) => {
                state.isLoading      = false;
                state.purchaseReturns = action.payload.data ?? action.payload;
            })
            .addCase(getPurchaseReturnsByPO.rejected,  rejected)

            .addCase(getPurchaseReturn.pending,   pending)
            .addCase(getPurchaseReturn.fulfilled, (state, action) => {
                state.isLoading     = false;
                state.purchaseReturn = action.payload.data ?? action.payload;
            })
            .addCase(getPurchaseReturn.rejected,  rejected)

            .addCase(createPurchaseReturn.pending,   pending)
            .addCase(createPurchaseReturn.fulfilled, (state, action) => {
                state.isLoading      = false;
                state.isSuccess      = true;
                const newReturn      = action.payload.data ?? action.payload;
                state.purchaseReturns = [newReturn, ...state.purchaseReturns];
            })
            .addCase(createPurchaseReturn.rejected,  rejected)

            .addCase(updatePurchaseReturnStatus.pending,   pending)
            .addCase(updatePurchaseReturnStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const updated   = action.payload.data ?? action.payload;
                state.purchaseReturns = state.purchaseReturns.map((r) =>
                    r.id === updated.id ? updated : r
                );
            })
            .addCase(updatePurchaseReturnStatus.rejected, rejected);
    },
});

export const { resetPurchaseReturn, clearPurchaseReturn } = purchaseReturnSlice.actions;
export default purchaseReturnSlice.reducer;