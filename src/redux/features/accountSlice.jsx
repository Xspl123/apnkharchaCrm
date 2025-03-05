import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

// ✅ Helper function to get token
const getToken = () => localStorage.getItem("token");

// ✅ Fetch Accounts (Avoid Duplicate Calls)
export const getAccountAPI = createAsyncThunk(
    "accounts/fetch",
    async (_, { getState, rejectWithValue }) => {
        const { accounts } = getState();
        if (accounts.list.length > 0) return; // 🚀 Prevent unnecessary API call if data exists

        try {
            const token = getToken();
            const response = await axiosClient.get("/accounts", {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error?.message || error.message);
        }
    }
);

// ✅ Create Account (Handles Multiple Errors)
export const createAccountAPI = createAsyncThunk(
    "accounts/create",
    async (accountData, { rejectWithValue }) => {
        try {
            const token = getToken();
            const response = await axiosClient.post("/account-create", accountData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data.account;
        } catch (error) {
            const errorMessages = error.response?.data?.errors?.map(err => err.msg) || ["Something went wrong!"];
            return rejectWithValue(errorMessages);
        }
    }
);

// ✅ Update Account (Handles Multiple Errors)
export const updateAccountAPI = createAsyncThunk(
    "accounts/update",
    async ({ id, account_name, account_balance }, { rejectWithValue }) => {
        try {
            const token = getToken();
            await axiosClient.put(`/accounts-update/${id}`, 
                { account_name, account_balance },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return { id, account_name, account_balance };
        } catch (error) {
            const errorMessages = error.response?.data?.errors?.map(err => err.msg) || ["Something went wrong!"];
            return rejectWithValue(errorMessages);
        }
    }
);

// ✅ Delete Account
export const deleteAccountAPI = createAsyncThunk(
    "accounts/delete",
    async (id, { rejectWithValue }) => {
        try {
            const token = getToken();
            await axiosClient.delete(`/accounts-delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);

// ✅ Redux Slice
const accountSlice = createSlice({
    name: "accounts",
    initialState: {
        list: [],
        loading: false,
        error: null,
    },
    reducers: {},

    extraReducers: (builder) => {
        builder
            // ✅ Fetch Accounts
            .addCase(getAccountAPI.pending, (state) => {
                state.loading = true;
            })
            .addCase(getAccountAPI.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) state.list = action.payload.accounts;
            })
            .addCase(getAccountAPI.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ✅ Create Account
            .addCase(createAccountAPI.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createAccountAPI.fulfilled, (state, action) => {
                state.loading = false;
                state.list = [...state.list, action.payload];
            })
            .addCase(createAccountAPI.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload; // Array of errors
            })

            // ✅ Update Account
            .addCase(updateAccountAPI.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateAccountAPI.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                
                const updatedIndex = state.list.findIndex(acc => acc.id === action.payload.id);
                if (updatedIndex !== -1) {
                    state.list[updatedIndex] = action.payload;
                }
            })
            .addCase(updateAccountAPI.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload; // Array of errors
            })

            // ✅ Delete Account
            .addCase(deleteAccountAPI.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteAccountAPI.fulfilled, (state, action) => {
                state.loading = false;
                state.list = state.list.filter((account) => account.id !== action.payload);
            })
            .addCase(deleteAccountAPI.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default accountSlice.reducer;
