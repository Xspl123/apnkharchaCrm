import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import gstService from '../services/gstService';

// ── Async Thunks ──────────────────────────────────────────

export const fetchGstSummary = createAsyncThunk(
    'gst/fetchSummary',
    async (period, { rejectWithValue }) => {
        try {
            const res = await gstService.getSummary(period);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const fetchGstr1 = createAsyncThunk(
    'gst/fetchGstr1',
    async (period, { rejectWithValue }) => {
        try {
            const res = await gstService.getGstr1(period);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const fetchGstr3b = createAsyncThunk(
    'gst/fetchGstr3b',
    async (period, { rejectWithValue }) => {
        try {
            const res = await gstService.getGstr3b(period);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const fetchReturns = createAsyncThunk(
    'gst/fetchReturns',
    async (params, { rejectWithValue }) => {
        try {
            const res = await gstService.getReturns(params);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const saveReturnDraft = createAsyncThunk(
    'gst/saveDraft',
    async (data, { rejectWithValue }) => {
        try {
            const res = await gstService.saveDraft(data);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const fileReturn = createAsyncThunk(
    'gst/fileReturn',
    async (id, { rejectWithValue }) => {
        try {
            const res = await gstService.fileReturn(id);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

export const fetchStates = createAsyncThunk(
    'gst/fetchStates',
    async (_, { rejectWithValue }) => {
        try {
            const res = await gstService.getStates();
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Error');
        }
    }
);

// ── Initial State ─────────────────────────────────────────

const initialState = {
    // Summary
    summary:      null,
    summaryLoading: false,

    // GSTR-1
    gstr1:        null,
    gstr1Loading: false,

    // GSTR-3B
    gstr3b:       null,
    gstr3bLoading: false,

    // Returns
    returns:      [],
    returnsLoading: false,

    // States dropdown
    states:       [],

    // Selected period (shared across pages)
    selectedPeriod: new Date().toISOString().slice(0, 7), // '2026-02'

    // UI
    error:        null,
    actionLoading: false,
};

// ── Slice ─────────────────────────────────────────────────

const gstSlice = createSlice({
    name: 'gst',
    initialState,
    reducers: {
        setSelectedPeriod: (state, action) => {
            state.selectedPeriod = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearGstr1: (state) => {
            state.gstr1 = null;
        },
        clearGstr3b: (state) => {
            state.gstr3b = null;
        },
    },
    extraReducers: (builder) => {

        // ── Summary ──
        builder
            .addCase(fetchGstSummary.pending, (state) => {
                state.summaryLoading = true;
                state.error = null;
            })
            .addCase(fetchGstSummary.fulfilled, (state, action) => {
                state.summaryLoading = false;
                state.summary = action.payload;
            })
            .addCase(fetchGstSummary.rejected, (state, action) => {
                state.summaryLoading = false;
                state.error = action.payload;
            });

        // ── GSTR-1 ──
        builder
            .addCase(fetchGstr1.pending, (state) => {
                state.gstr1Loading = true;
                state.error = null;
            })
            .addCase(fetchGstr1.fulfilled, (state, action) => {
                state.gstr1Loading = false;
                state.gstr1 = action.payload;
            })
            .addCase(fetchGstr1.rejected, (state, action) => {
                state.gstr1Loading = false;
                state.error = action.payload;
            });

        // ── GSTR-3B ──
        builder
            .addCase(fetchGstr3b.pending, (state) => {
                state.gstr3bLoading = true;
                state.error = null;
            })
            .addCase(fetchGstr3b.fulfilled, (state, action) => {
                state.gstr3bLoading = false;
                state.gstr3b = action.payload;
            })
            .addCase(fetchGstr3b.rejected, (state, action) => {
                state.gstr3bLoading = false;
                state.error = action.payload;
            });

        // ── Returns ──
        builder
            .addCase(fetchReturns.pending, (state) => {
                state.returnsLoading = true;
            })
            .addCase(fetchReturns.fulfilled, (state, action) => {
                state.returnsLoading = false;
                state.returns = action.payload;
            })
            .addCase(fetchReturns.rejected, (state, action) => {
                state.returnsLoading = false;
                state.error = action.payload;
            });

        // ── Save Draft ──
        builder
            .addCase(saveReturnDraft.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(saveReturnDraft.fulfilled, (state, action) => {
                state.actionLoading = false;
                // returns list mein update karo
                const idx = state.returns.findIndex(r => r.id === action.payload.id);
                if (idx !== -1) {
                    state.returns[idx] = action.payload;
                } else {
                    state.returns.unshift(action.payload);
                }
            })
            .addCase(saveReturnDraft.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            });

        // ── File Return ──
        builder
            .addCase(fileReturn.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(fileReturn.fulfilled, (state, action) => {
                state.actionLoading = false;
                const idx = state.returns.findIndex(r => r.id === action.payload.id);
                if (idx !== -1) state.returns[idx] = action.payload;
            })
            .addCase(fileReturn.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            });

        // ── States ──
        builder
            .addCase(fetchStates.fulfilled, (state, action) => {
                state.states = action.payload;
            });
    },
});

export const {
    setSelectedPeriod,
    clearError,
    clearGstr1,
    clearGstr3b,
} = gstSlice.actions;

export default gstSlice.reducer;
