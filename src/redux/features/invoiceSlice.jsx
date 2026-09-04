// src/redux/features/invoiceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getErrorMessage } from "../../utils/getErrorMessage";
import axiosClient from '../../api/axiosClient';

const initialState = {
  invoices: [],
  invoice: null,
  nextInvoiceNumber: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Get all invoices
export const getInvoices = createAsyncThunk(
  'invoices/getAll',
  async (filters = {}, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `/invoices?${queryParams}` : '/invoices';
      const response = await axiosClient.get(url);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single invoice
export const getInvoice = createAsyncThunk(
  'invoices/getById',
  async (id, thunkAPI) => {
    try {
      const response = await axiosClient.get(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get next invoice number
export const getNextInvoiceNumber = createAsyncThunk(
  'invoices/getNextNumber',
  async (_, thunkAPI) => {
    try {
      const response = await axiosClient.get('/invoices/next-number/generate');
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create invoice
export const createInvoice = createAsyncThunk(
  'invoices/create',
  async (data, thunkAPI) => {
    try {
      const response = await axiosClient.post('/invoices', data);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update invoice
export const updateInvoice = createAsyncThunk(
  'invoices/update',
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await axiosClient.put(`/invoices/${id}`, data);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete invoice
export const deleteInvoice = createAsyncThunk(
  'invoices/delete',
  async (id, thunkAPI) => {
    try {
      await axiosClient.delete(`/invoices/${id}`);
      return id;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const invoiceSlice = createSlice({
  name: 'invoices',
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
      // Get all invoices
      .addCase(getInvoices.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.invoices = action.payload.data || action.payload;
      })
      .addCase(getInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Get single invoice
      .addCase(getInvoice.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.invoice = action.payload.data || action.payload;
      })
      .addCase(getInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Get next invoice number
      .addCase(getNextInvoiceNumber.fulfilled, (state, action) => {
        state.nextInvoiceNumber = action.payload.invoice_no;
      })
      
      // Create invoice
      .addCase(createInvoice.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.invoices.push(action.payload.invoice);
        state.message = action.payload.message;
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Update invoice
      .addCase(updateInvoice.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.invoices.findIndex(
          (invoice) => invoice.id === action.payload.invoice.id
        );
        if (index !== -1) {
          state.invoices[index] = action.payload.invoice;
        }
        state.message = action.payload.message;
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Delete invoice
      .addCase(deleteInvoice.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.invoices = state.invoices.filter(
          (invoice) => invoice.id !== action.payload
        );
      })
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = invoiceSlice.actions;
export default invoiceSlice.reducer;