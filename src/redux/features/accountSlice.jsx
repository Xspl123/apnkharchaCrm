import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

// ✅ Token helper function
const getToken = () => localStorage.getItem("token");

// ✅ Fetch Accounts (Prevent Unnecessary Calls)
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
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ✅ Create Account (Optimized UI Update)
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
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ✅ Update Account (Only Update in State)
export const updateAccountAPI = createAsyncThunk(
    "accounts/update",
    async ({ id, account_name, account_balance }, { rejectWithValue }) => {
        try {
            const token = getToken();
            await axiosClient.put(`/accounts-update/${id}`, 
                { account_name, account_balance },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return { id, account_name, account_balance }; // Return only updated data
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ✅ Delete Account (Remove from Redux Store)
export const deleteAccountAPI = createAsyncThunk(
    "accounts/delete",
    async (id, { rejectWithValue }) => {
        try {
            const token = getToken();
            await axiosClient.delete(`/accounts-delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return id; // Return deleted account ID to remove from state
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
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
                if (action.payload) state.list = action.payload.accounts; // ✅ Update state only if data exists
            })
            .addCase(getAccountAPI.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ✅ Create Account
            .addCase(createAccountAPI.pending, (state) => {
                state.loading = true;
            })
            .addCase(createAccountAPI.fulfilled, (state, action) => {
                state.loading = false;
                state.list = [...state.list, action.payload]; // ✅ Push new account in list without re-fetching all
            })
            .addCase(createAccountAPI.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ✅ Update Account (Prevent Full Re-render)
            .addCase(updateAccountAPI.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateAccountAPI.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.list.findIndex((acc) => acc.id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = { ...state.list[index], ...action.payload };
                }
            })
            .addCase(updateAccountAPI.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // ✅ Delete Account (Remove from State)
            .addCase(deleteAccountAPI.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteAccountAPI.fulfilled, (state, action) => {
                state.loading = false;
                state.list = state.list.filter((account) => account.id !== action.meta.arg);
            });
            
    },
});

export default accountSlice.reducer;
