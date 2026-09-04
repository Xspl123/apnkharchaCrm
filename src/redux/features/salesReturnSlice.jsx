// src/redux/features/salesReturnSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getErrorMessage } from "../../utils/getErrorMessage";
import axiosClient from '../../api/axiosClient';

const initialState = {
    salesReturns:  [],
    salesReturn:   null,
    isLoading:     false,
    isSuccess:     false,
    isError:       false,
    message:       '',
};

// ── Get All ───────────────────────────────────────────────
export const getSalesReturns = createAsyncThunk(
    'salesReturns/getAll',
    async (filters = {}, thunkAPI) => {
        try {
            const q = new URLSearchParams(filters).toString();
            const res = await axiosClient.get(q ? `/sales-returns?${q}` : '/sales-returns');
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

// ── Get By Invoice ────────────────────────────────────────
export const getSalesReturnsByInvoice = createAsyncThunk(
    'salesReturns/getByInvoice',
    async (invoiceId, thunkAPI) => {
        try {
            const res = await axiosClient.get(`/sales-returns/by-invoice/${invoiceId}`);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

// ── Get Single ────────────────────────────────────────────
export const getSalesReturn = createAsyncThunk(
    'salesReturns/getById',
    async (id, thunkAPI) => {
        try {
            const res = await axiosClient.get(`/sales-returns/${id}`);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

// ── Create ────────────────────────────────────────────────
export const createSalesReturn = createAsyncThunk(
    'salesReturns/create',
    async (data, thunkAPI) => {
        try {
            const res = await axiosClient.post('/sales-returns', data);
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

// ── Update Status ─────────────────────────────────────────
export const updateSalesReturnStatus = createAsyncThunk(
    'salesReturns/updateStatus',
    async ({ id, status }, thunkAPI) => {
        try {
            const res = await axiosClient.patch(`/sales-returns/${id}/status`, { status });
            return res.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(getErrorMessage(err));
        }
    }
);

// ── Slice ─────────────────────────────────────────────────
const salesReturnSlice = createSlice({
    name: 'salesReturns',
    initialState,
    reducers: {
        resetSalesReturn: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError   = false;
            state.message   = '';
        },
        clearSalesReturn: (state) => {
            state.salesReturn = null;
        },
    },
    extraReducers: (builder) => {
        const pending  = (state)        => { state.isLoading = true;  state.isError = false; };
        const rejected = (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; };

        builder
            // getAll
            .addCase(getSalesReturns.pending,   pending)
            .addCase(getSalesReturns.fulfilled, (state, action) => {
                state.isLoading   = false;
                state.salesReturns = action.payload.data ?? action.payload;
            })
            .addCase(getSalesReturns.rejected,  rejected)

            // getByInvoice
            .addCase(getSalesReturnsByInvoice.pending,   pending)
            .addCase(getSalesReturnsByInvoice.fulfilled, (state, action) => {
                state.isLoading   = false;
                state.salesReturns = action.payload.data ?? action.payload;
            })
            .addCase(getSalesReturnsByInvoice.rejected,  rejected)

            // getById
            .addCase(getSalesReturn.pending,   pending)
            .addCase(getSalesReturn.fulfilled, (state, action) => {
                state.isLoading  = false;
                state.salesReturn = action.payload.data ?? action.payload;
            })
            .addCase(getSalesReturn.rejected,  rejected)

            // create
            .addCase(createSalesReturn.pending,   pending)
            .addCase(createSalesReturn.fulfilled, (state, action) => {
                state.isLoading  = false;
                state.isSuccess  = true;
                const newReturn  = action.payload.data ?? action.payload;
                state.salesReturns = [newReturn, ...state.salesReturns];
            })
            .addCase(createSalesReturn.rejected,  rejected)

            // updateStatus
            .addCase(updateSalesReturnStatus.pending,   pending)
            .addCase(updateSalesReturnStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const updated   = action.payload.data ?? action.payload;
                state.salesReturns = state.salesReturns.map((r) =>
                    r.id === updated.id ? updated : r
                );
            })
            .addCase(updateSalesReturnStatus.rejected, rejected);
    },
});

export const { resetSalesReturn, clearSalesReturn } = salesReturnSlice.actions;
export default salesReturnSlice.reducer;