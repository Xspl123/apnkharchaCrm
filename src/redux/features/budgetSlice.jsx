import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

// ✅ Get token from localStorage
const getToken = () => localStorage.getItem("token");

// ✅ Fetch Budgets API
export const getBudgetAPI = createAsyncThunk(
    "budgets/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const token = getToken();
            const response = await axiosClient.get("/budgets", {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ✅ Create or Update Budget API
export const createBudgetAPI = createAsyncThunk(
    "budgets/create",
    async (budgetData, { rejectWithValue }) => {
        try {
            const token = getToken();
            const response = await axiosClient.post("/create-budget", budgetData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ✅ Budget Slice
const budgetSlice = createSlice({
    name: "budgets",
    initialState: {
        budget: [],
        loading: false,
        error: null,
    },
    reducers: {},

    extraReducers: (builder) => {
        builder
            // 🚀 Get Budgets API
            .addCase(getBudgetAPI.pending, (state) => {
                state.loading = true;
            })
            .addCase(getBudgetAPI.fulfilled, (state, action) => {
                state.loading = false;
                state.budget = action.payload.budgets || []; // ✅ Ensure budgets exist
            })
            .addCase(getBudgetAPI.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch budgets";
            })

            // 🚀 Create Budget API
            .addCase(createBudgetAPI.pending, (state) => {
                state.loading = true;
            })
            .addCase(createBudgetAPI.fulfilled, (state, action) => {
                state.loading = false;
                state.budget.push(action.payload.budget); // ✅ Add new budget to state
            })
            .addCase(createBudgetAPI.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to create budget";
            });
    }
});

export default budgetSlice.reducer;
