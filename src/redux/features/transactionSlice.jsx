import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

// Fetch Transactions with Pagination
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async ({ page = 1, perPage = 10 } = {}, thunkAPI) => {
    try {
      const response = await axiosClient.get('/transactions', {
        params: { page, per_page: perPage },
      });
      return response.data; // Ensure the API response includes pagination details
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || 'Failed to fetch transactions'
      );
    }
  }
);

// Search Transactions with Pagination
export const fetchSearchedTransactions = createAsyncThunk(
  'transactions/fetchSearchedTransactions',
  async ({ searchParams, page = 1, perPage = 10 } = {}, thunkAPI) => {
    try {
      const response = await axiosClient.get('/search', {
        params: { ...searchParams, page, per_page: perPage },
      });
      return response.data; // Ensure the API response includes pagination details
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || 'Failed to fetch searched transactions'
      );
    }
  }
);

// Create Transaction
export const createTransaction = createAsyncThunk(
  'transactions/createTransaction',
  async (transactionData, thunkAPI) => {
    try {
      const response = await axiosClient.post('/transactions/create', transactionData);
      return response.data.transaction;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error || 'Failed to create transaction'
      );
    }
  }
);

// ✅ Update Account
export const updateAccountAPI = createAsyncThunk(
    "accounts/update",
    async ({ id, account_name, account_balance }, { rejectWithValue }) => {
        try {
            await axiosClient.put(`/accounts/${id}`, 
                { account_name, account_balance }
            );
            return { id, account_name, account_balance };
        } catch (error) {
            const errorMessages = error.response?.data?.errors
                ? Object.values(error.response.data.errors).flat()
                : [error.response?.data?.error || "Something went wrong!"];
            return rejectWithValue(errorMessages);
        }
    }
);

// Delete Transaction
export const deleteTransactionApi = createAsyncThunk(
  'transactions/deleteTransaction',
  async (id, thunkAPI) => {
    try {
      await axiosClient.delete(`/transactions/${id}`);
      return id; // Returning deleted transaction ID
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || 'Failed to delete transaction'
      );
    }
  }
);

// Transaction Slice
const transactionSlice = createSlice({
  name: 'transactions',
  initialState: {
    transactions: [],
    searchedTransactions: [],
    loading: false,
    error: null,
    success: false,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      perPage: 10,
      totalItems: 0,
    },
    speechToTextResults: {}, // Store speech-to-text results
  },
  reducers: {
    resetTransactionState: (state) => {
      state.success = false;
      state.error = null;
    },
    updateSpeechToText: (state, action) => {
      state.speechToTextResults = {
        ...state.speechToTextResults,
        ...action.payload,
      };
    },
    clearSpeechToText: (state) => {
      state.speechToTextResults = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.transactions;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          perPage: action.payload.perPage,
          totalItems: action.payload.total,
        };
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Transaction
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.transactions.push(action.payload);
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Delete Transaction
      .addCase(deleteTransactionApi.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTransactionApi.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = state.transactions.filter(
          (txn) => txn.id !== action.payload
        );
      })
      .addCase(deleteTransactionApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Searched Transactions
      .addCase(fetchSearchedTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSearchedTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.searchedTransactions = action.payload.transactions;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          perPage: action.payload.perPage,
          totalItems: action.payload.total,
        };
      })
      .addCase(fetchSearchedTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetTransactionState, updateSpeechToText, clearSpeechToText } =
  transactionSlice.actions;
export default transactionSlice.reducer;
