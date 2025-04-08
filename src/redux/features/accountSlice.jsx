import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

// ✅ Helper function to get token
const getToken = () => localStorage.getItem("token");

// ✅ Fetch Accounts (with Pagination)
export const getAccountAPI = createAsyncThunk(
    "accounts/fetch",
    async (page = 1, { rejectWithValue }) => {
        try {
            const token = getToken();
            const response = await axiosClient.get(`/accounts?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error?.message || error.message);
        }
    }
);

// ✅ Create Account
export const createAccountAPI = createAsyncThunk(
    "accounts/create",
    async (accountData, { rejectWithValue }) => {
        try {
            const token = getToken();
            const response = await axiosClient.post("/accounts/create", accountData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data.account;
        } catch (error) {
            const errorMessages = error.response?.data?.errors?.map(err => err.msg) || ["Something went wrong!"];
            return rejectWithValue(errorMessages);
        }
    }
);

// ✅ Update Account
export const updateAccountAPI = createAsyncThunk(
    "accounts/update",
    async ({ id, account_name, account_balance }, { rejectWithValue }) => {
        try {
            const token = getToken();
            await axiosClient.put(`/accounts/${id}`, 
                { account_name, account_balance },
                { headers: { Authorization: `Bearer ${token}` } }
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

// ✅ Delete Account
export const deleteAccountAPI = createAsyncThunk(
    "accounts/delete",
    async (id, { rejectWithValue }) => {
        try {
            const token = getToken();
            await axiosClient.delete(`/accounts/${id}`, {
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
        pagination: {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
        },
        loading: false,
        error: null,
    },
    reducers: {},

    extraReducers: (builder) => {
        builder
            // ✅ Fetch Accounts (Pagination Support)
            .addCase(getAccountAPI.pending, (state) => {
                state.loading = true;
            })
            .addCase(getAccountAPI.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    state.list = action.payload.data;
                    state.pagination = {
                        current_page: action.payload.current_page,
                        last_page: action.payload.last_page,
                        per_page: action.payload.per_page,
                        total: action.payload.total,
                    };
                }
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
                state.error = action.payload;
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
                state.error = action.payload;
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
