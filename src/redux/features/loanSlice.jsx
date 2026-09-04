import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

// Loan List API Call
export const fetchLoans = createAsyncThunk("loans/fetchLoans", async (_, thunkAPI) => {
  try {
    const response = await axiosClient.get("/my-loans");
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || "Something went wrong");
  }
});

const loanSlice = createSlice({
  name: "loans",
  initialState: {
    loans: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLoans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLoans.fulfilled, (state, action) => {
        state.loading = false;
        state.loans = action.payload;
      })
      .addCase(fetchLoans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default loanSlice.reducer;
