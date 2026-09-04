import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getErrorMessage } from "../../utils/getErrorMessage";
import axiosClient from "../../api/axiosClient";

// Fetch Budgets API
export const getBudgetAPI = createAsyncThunk(
    "budgets/fetch",
    async (_, { rejectWithValue }) => {
      try {
        const response = await axiosClient.get("/budgets");
        return response.data.data; // पूरी प्रतिक्रिया लौटाएं
      } catch (error) {
        return rejectWithValue(getErrorMessage(error));
      }
    }
  );
  
export const createBudgetAPI = createAsyncThunk(
  "budget/update",
  async ({ category_id, budget_amount }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(
        `/budgets/${category_id}`,  // API URL me category_id bhej rahe hain
        { budget_amount }          // Sirf budget_amount update hoga
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);


// Budget Slice
const budgetSlice = createSlice({
    name: "budgets slice",
    initialState: {
        budgets: [],
        loading: false,
        error: null,
        pagination: {
            total: 0,
            totalPages: 1,
            currentPage: 1,
        },
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
          .addCase(getBudgetAPI.pending, (state) => {
            state.loading = true;
            state.error = null;
          })
          .addCase(getBudgetAPI.fulfilled, (state, action) => {
            state.loading = false;
            state.budgets = action.payload.data; // बजट डेटा को असाइन करें
            state.pagination = {
              total: action.payload.data.total,
              totalPages: action.payload.data.total_pages,
              currentPage: action.payload.data.current_page,
            };
          })
          .addCase(getBudgetAPI.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload || "Failed to fetch budgets";
          });
      }
      
      
});

export default budgetSlice.reducer;
