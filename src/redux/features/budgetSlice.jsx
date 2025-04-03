import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

// Helper function to retrieve the token from localStorage
const getToken = () => localStorage.getItem("token");

// Fetch Budgets API
export const getBudgetAPI = createAsyncThunk(
    "budgets/fetch",
    async (_, { rejectWithValue }) => {
      try {
        const token = getToken();
        const response = await axiosClient.get("/budgets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.data; // पूरी प्रतिक्रिया लौटाएं
      } catch (error) {
        return rejectWithValue(error.response?.data || error.message);
      }
    }
  );
  


// Create or Update Budget API
// export const createBudgetAPI = createAsyncThunk(
//     "budgets/create",
//     async (budgetData, { rejectWithValue }) => {
//         try {
//             const token = getToken();
//             const response = await axiosClient.post("/budgets-create", budgetData, {
//                 headers: { Authorization: `Bearer ${token}` },
//             });
//             console.log("Create Budget API Response:", response.data.data);
//             return response.data.data; 
//         } catch (error) {
//             return rejectWithValue(error.response?.data || error.message);
//         }
//     }
// );

export const createBudgetAPI = createAsyncThunk(
  "budget/update",
  async ({ category_id, budget_amount }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const response = await axiosClient.put(
        `/budgets/${category_id}`,  // API URL me category_id bhej rahe hain
        { budget_amount },          // Sirf budget_amount update hoga
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
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
