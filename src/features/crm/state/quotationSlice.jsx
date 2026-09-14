import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../../api/axiosClient';

// ── Thunks ────────────────────────────────────────────────

export const getQuotations = createAsyncThunk(
    'quotations/getAll',
    async (params = {}, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/quotations', { params });
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const getQuotationById = createAsyncThunk(
    'quotations/getById',
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get(`/quotations/${id}`);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

// The dedicated "create from lead" endpoint — sets lead_id server-side and
// (per QuotationRepository::create) automatically advances the lead's
// status to 'quotation_sent' if it's still in an early stage.
export const createQuotationFromLead = createAsyncThunk(
    'quotations/createFromLead',
    async ({ leadId, data }, { rejectWithValue }) => {
        try {
            const res = await axiosClient.post(`/leads/${leadId}/quotation`, data);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const updateQuotation = createAsyncThunk(
    'quotations/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await axiosClient.put(`/quotations/${id}`, data);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const updateQuotationStatus = createAsyncThunk(
    'quotations/updateStatus',
    async ({ id, status }, { rejectWithValue }) => {
        try {
            const res = await axiosClient.patch(`/quotations/${id}/status`, { status });
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const deleteQuotation = createAsyncThunk(
    'quotations/delete',
    async (id, { rejectWithValue }) => {
        try {
            await axiosClient.delete(`/quotations/${id}`);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

// Sends the quotation as a PDF attachment (built client-side via
// QuotationPrintPDF + html2pdf, same as the existing Invoice PDF flow) —
// data.pdf_base64 is the raw base64 payload, no data-URI prefix.
export const sendQuotationEmail = createAsyncThunk(
    'quotations/sendEmail',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await axiosClient.post(`/quotations/${id}/send-email`, data);
            return res.data.message;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

const quotationSlice = createSlice({
    name: 'quotations',
    initialState: {
        quotations: [],
        selectedQuotation: null,
        isLoading: false,
        actionLoading: false,
        error: null,
    },
    reducers: {
        clearSelectedQuotation: (state) => { state.selectedQuotation = null; },
        clearQuotationError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getQuotations.pending, (s) => { s.isLoading = true; })
            .addCase(getQuotations.fulfilled, (s, a) => {
                s.isLoading = false;
                s.quotations = a.payload || [];
            })
            .addCase(getQuotations.rejected, (s, a) => { s.isLoading = false; s.error = a.payload; })

            .addCase(getQuotationById.fulfilled, (s, a) => { s.selectedQuotation = a.payload; })

            .addCase(createQuotationFromLead.pending, (s) => { s.actionLoading = true; })
            .addCase(createQuotationFromLead.fulfilled, (s, a) => {
                s.actionLoading = false;
                s.quotations = [a.payload, ...s.quotations];
            })
            .addCase(createQuotationFromLead.rejected, (s, a) => { s.actionLoading = false; s.error = a.payload; })

            .addCase(updateQuotation.pending, (s) => { s.actionLoading = true; })
            .addCase(updateQuotation.fulfilled, (s, a) => {
                s.actionLoading = false;
                const i = s.quotations.findIndex((q) => q.id === a.payload.id);
                if (i !== -1) s.quotations[i] = a.payload;
            })
            .addCase(updateQuotation.rejected, (s, a) => { s.actionLoading = false; s.error = a.payload; })

            .addCase(updateQuotationStatus.fulfilled, (s, a) => {
                const i = s.quotations.findIndex((q) => q.id === a.payload.id);
                if (i !== -1) s.quotations[i] = a.payload;
            })

            .addCase(deleteQuotation.fulfilled, (s, a) => {
                s.quotations = s.quotations.filter((q) => q.id !== a.payload);
            });
    },
});

export const { clearSelectedQuotation, clearQuotationError } = quotationSlice.actions;
export default quotationSlice.reducer;