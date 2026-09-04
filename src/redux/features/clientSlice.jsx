// src/redux/features/clientSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getErrorMessage } from "../../utils/getErrorMessage";
import axiosClient from '../../api/axiosClient';

const initialState = {
  clients: [],
  client: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
  
  // ========== NEW LEDGER STATE ==========
  ledger: {
    data: null,
    isLoading: false,
    isError: false,
    message: '',
    openClientId: null  // Track which client's ledger is open
  }
};

// ========== EXISTING THUNKS ==========

// Get all clients
export const getClients = createAsyncThunk(
  'clients/getAll',
  async (_, thunkAPI) => {
    try {
      const response = await axiosClient.get('/clients');
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single client
export const getClient = createAsyncThunk(
  'clients/getById',
  async (id, thunkAPI) => {
    try {
      const response = await axiosClient.get(`/clients/${id}`);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create client
export const createClient = createAsyncThunk(
  'clients/create',
  async (data, thunkAPI) => {
    try {
      const response = await axiosClient.post('/clients', data);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update client
export const updateClient = createAsyncThunk(
  'clients/update',
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await axiosClient.put(`/clients/${id}`, data);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete client
export const deleteClient = createAsyncThunk(
  'clients/delete',
  async (id, thunkAPI) => {
    try {
      await axiosClient.delete(`/clients/${id}`);
      return id;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ========== NEW LEDGER THUNK ==========

// Get client ledger
export const getClientLedger = createAsyncThunk(
  'clients/getLedger',
  async (clientId, thunkAPI) => {
    try {
      const response = await axiosClient.get(`/clients/${clientId}/ledger`);
      return {
        clientId,
        data: response.data
      };
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const clientSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    
    // ========== NEW LEDGER REDUCERS ==========
    clearClientLedger: (state) => {
      state.ledger.data = null;
      state.ledger.isError = false;
      state.ledger.message = '';
      state.ledger.openClientId = null;
    },
    
    setLedgerOpen: (state, action) => {
      state.ledger.openClientId = action.payload;
    },
    
    setLedgerClose: (state) => {
      state.ledger.openClientId = null;
      state.ledger.data = null;
      state.ledger.isError = false;
      state.ledger.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== EXISTING CASES ==========
      
      // Get all clients
      .addCase(getClients.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.clients = action.payload.data || action.payload;
      })
      .addCase(getClients.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Get single client
      .addCase(getClient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.client = action.payload.data || action.payload;
      })
      .addCase(getClient.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Create client
      .addCase(createClient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.clients.push(action.payload.client);
        state.message = action.payload.message;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Update client
      .addCase(updateClient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.clients.findIndex(
          (client) => client.id === action.payload.client.id
        );
        if (index !== -1) {
          state.clients[index] = action.payload.client;
        }
        state.message = action.payload.message;
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Delete client
      .addCase(deleteClient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.clients = state.clients.filter(
          (client) => client.id !== action.payload
        );
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // ========== NEW LEDGER CASES ==========
      
      // Get client ledger
      .addCase(getClientLedger.pending, (state) => {
        state.ledger.isLoading = true;
        state.ledger.isError = false;
        state.ledger.message = '';
      })
      .addCase(getClientLedger.fulfilled, (state, action) => {
        state.ledger.isLoading = false;
        state.ledger.data = action.payload.data;
        state.ledger.openClientId = action.payload.clientId;
      })
      .addCase(getClientLedger.rejected, (state, action) => {
        state.ledger.isLoading = false;
        state.ledger.isError = true;
        state.ledger.message = action.payload;
        state.ledger.data = null;
      });
  },
});

export const { 
  reset, 
  clearClientLedger, 
  setLedgerOpen, 
  setLedgerClose 
} = clientSlice.actions;

export default clientSlice.reducer;