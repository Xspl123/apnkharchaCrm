// src/redux/features/invoicePaymentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getErrorMessage } from "../../utils/getErrorMessage";
import axiosClient from '../../api/axiosClient';

const initialState = {
  payments: [],
  payment: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Get all payments
export const getPayments = createAsyncThunk(
  'invoicePayments/getAll',
  async (_, thunkAPI) => {
    try {
      const response = await axiosClient.get('/invoice-payments');
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get payments by invoice
export const getPaymentsByInvoice = createAsyncThunk(
  'invoicePayments/getByInvoice',
  async (invoiceId, thunkAPI) => {
    try {
      const response = await axiosClient.get(`/invoice-payments/invoice/${invoiceId}`);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create payment
export const createPayment = createAsyncThunk(
  'invoicePayments/create',
  async (data, thunkAPI) => {
    try {
      const response = await axiosClient.post('/invoice-payments', data);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update payment
export const updatePayment = createAsyncThunk(
  'invoicePayments/update',
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await axiosClient.put(`/invoice-payments/${id}`, data);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete payment
export const deletePayment = createAsyncThunk(
  'invoicePayments/delete',
  async (id, thunkAPI) => {
    try {
      await axiosClient.delete(`/invoice-payments/${id}`);
      return id;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const invoicePaymentSlice = createSlice({
  name: 'invoicePayments',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all payments
      .addCase(getPayments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments = action.payload.data || action.payload;
      })
      .addCase(getPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Get payments by invoice
      .addCase(getPaymentsByInvoice.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPaymentsByInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments = action.payload.data || action.payload;
      })
      .addCase(getPaymentsByInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Create payment
      .addCase(createPayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments.push(action.payload.payment);
        state.message = action.payload.message;
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Update payment
      .addCase(updatePayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updatePayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.payments.findIndex(
          (payment) => payment.id === action.payload.payment.id
        );
        if (index !== -1) {
          state.payments[index] = action.payload.payment;
        }
        state.message = action.payload.message;
      })
      .addCase(updatePayment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Delete payment
      .addCase(deletePayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments = state.payments.filter(
          (payment) => payment.id !== action.payload
        );
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = invoicePaymentSlice.actions;
export default invoicePaymentSlice.reducer;