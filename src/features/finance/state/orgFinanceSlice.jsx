import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import orgFinanceService from '../services/orgFinanceService';

// ── Thunks ────────────────────────────────────────────────

export const getOrgAccounts = createAsyncThunk(
    'orgFinance/getAccounts',
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await orgFinanceService.getAccounts(params);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch accounts');
        }
    }
);

export const getOrgAccountSummary = createAsyncThunk(
    'orgFinance/getAccountSummary',
    async (_, { rejectWithValue }) => {
        try {
            const res = await orgFinanceService.getAccountSummary();
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch summary');
        }
    }
);

export const createOrgAccount = createAsyncThunk(
    'orgFinance/createAccount',
    async (data, { rejectWithValue }) => {
        try {
            const res = await orgFinanceService.createAccount(data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to create account');
        }
    }
);

export const updateOrgAccount = createAsyncThunk(
    'orgFinance/updateAccount',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await orgFinanceService.updateAccount(id, data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update account');
        }
    }
);

export const deleteOrgAccount = createAsyncThunk(
    'orgFinance/deleteAccount',
    async (id, { rejectWithValue }) => {
        try {
            await orgFinanceService.deleteAccount(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to delete account');
        }
    }
);

export const getOrgTransactions = createAsyncThunk(
    'orgFinance/getTransactions',
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await orgFinanceService.getTransactions(params);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch transactions');
        }
    }
);

export const getOrgCashflowSummary = createAsyncThunk(
    'orgFinance/getCashflowSummary',
    async (params = {}, { rejectWithValue }) => {
        try {
            const res = await orgFinanceService.getCashflowSummary(params);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch cashflow');
        }
    }
);

// Alias
export const getCashflowSummary = getOrgCashflowSummary;

export const createOrgTransaction = createAsyncThunk(
    'orgFinance/createTransaction',
    async (data, { rejectWithValue }) => {
        try {
            const res = await orgFinanceService.createTransaction(data);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to record transaction');
        }
    }
);

// ── Initial State ─────────────────────────────────────────

const initialState = {
    accounts:        [],
    accountSummary:  null,
    transactions:    [],
    cashflowSummary: null,
    isLoading:       false,
    actionLoading:   false,
    isError:         false,
    message:         '',
};

// ── Slice ─────────────────────────────────────────────────

const orgFinanceSlice = createSlice({
    name: 'orgFinance',
    initialState,
    reducers: {
        resetFinance: (state) => {
            state.isLoading     = false;
            state.actionLoading = false;
            state.isError       = false;
            state.message       = '';
        },
    },
    extraReducers: (builder) => {
        builder
            // Accounts
            .addCase(getOrgAccounts.pending, (state) => { state.isLoading = true; })
            .addCase(getOrgAccounts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.accounts  = action.payload.data || action.payload;
            })
            .addCase(getOrgAccounts.rejected, (state, action) => {
                state.isLoading = false;
                state.isError   = true;
                state.message   = action.payload;
            })

            .addCase(getOrgAccountSummary.fulfilled, (state, action) => {
                state.accountSummary = action.payload;
            })

            .addCase(createOrgAccount.pending, (state) => { state.actionLoading = true; })
            .addCase(createOrgAccount.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.accounts.unshift(action.payload.data);
            })
            .addCase(createOrgAccount.rejected, (state, action) => {
                state.actionLoading = false;
                state.message       = action.payload;
            })

            .addCase(updateOrgAccount.fulfilled, (state, action) => {
                const updated = action.payload.data;
                const idx = state.accounts.findIndex(a => a.id === updated.id);
                if (idx !== -1) state.accounts[idx] = updated;
            })

            .addCase(deleteOrgAccount.fulfilled, (state, action) => {
                state.accounts = state.accounts.filter(a => a.id !== action.payload);
            })

            // Transactions
            .addCase(getOrgTransactions.pending, (state) => { state.isLoading = true; })
            .addCase(getOrgTransactions.fulfilled, (state, action) => {
                state.isLoading    = false;
                state.transactions = action.payload.data || action.payload;
            })
            .addCase(getOrgTransactions.rejected, (state, action) => {
                state.isLoading = false;
                state.isError   = true;
                state.message   = action.payload;
            })

            .addCase(getOrgCashflowSummary.fulfilled, (state, action) => {
                state.cashflowSummary = action.payload;
            })

            .addCase(createOrgTransaction.pending, (state) => { state.actionLoading = true; })
            .addCase(createOrgTransaction.fulfilled, (state) => {
                state.actionLoading = false;
            })
            .addCase(createOrgTransaction.rejected, (state, action) => {
                state.actionLoading = false;
                state.message       = action.payload;
            });
    },
});

export const { resetFinance } = orgFinanceSlice.actions;
export default orgFinanceSlice.reducer;