import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

// ✅ Fetch Transactions
export const fetchTransactions = createAsyncThunk(
    "transactions/fetchTransactions",
    async (_, thunkAPI) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axiosClient.get("/transactions/get-transactions", {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data.transactions;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || "Failed to fetch transactions");
        }
    }
);

// ✅ Create Transaction
export const createTransaction = createAsyncThunk(
    "transactions/createTransaction",
    async (transactionData, thunkAPI) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axiosClient.post("/transactions/create-transaction", transactionData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data.transaction;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || "Failed to create transaction");
        }
    }
);

// ✅ Delete Transaction
export const deleteTransactionApi = createAsyncThunk(
    "transactions/deleteTransaction",
    async (id, thunkAPI) => {
        try {
            const token = localStorage.getItem("token");
            await axiosClient.delete(`/transactions-delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return id; // Returning deleted transaction ID
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || "Failed to delete transaction");
        }
    }
);

const transactionSlice = createSlice({
    name: "transactions",
    initialState: {
        transactions: [],
        loading: false,
        error: null,
        success: false,
    },
    reducers: {
        resetTransactionState: (state) => {
            state.success = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // ✅ Fetch Transactions Cases
            .addCase(fetchTransactions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTransactions.fulfilled, (state, action) => {
                state.loading = false;
                state.transactions = action.payload;
            })
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ✅ Create Transaction Cases
            .addCase(createTransaction.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createTransaction.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.transactions.push(action.payload); // ✅ Add new transaction to list
            })
            .addCase(createTransaction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })

            // ✅ Delete Transaction Cases
            .addCase(deleteTransactionApi.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteTransactionApi.fulfilled, (state, action) => {
                state.loading = false;
                state.transactions = state.transactions.filter(txn => txn.id !== action.payload); // ✅ Remove deleted transaction
            })
            .addCase(deleteTransactionApi.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { resetTransactionState } = transactionSlice.actions;
export default transactionSlice.reducer;
