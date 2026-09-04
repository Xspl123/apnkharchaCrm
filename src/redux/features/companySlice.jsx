import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getErrorMessage } from "../../utils/getErrorMessage";
import axiosClient from '../../api/axiosClient';

const initialState = {
  companies: [],
  company: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Get all companies
export const getCompanies = createAsyncThunk(
  'companies/getAll',
  async (_, thunkAPI) => {
    try {
      const response = await axiosClient.get('/companies');
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create company
export const createCompany = createAsyncThunk(
  'companies/create',
  async (formData, thunkAPI) => {
    try {
      const response = await axiosClient.post('/companies', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update company
export const updateCompany = createAsyncThunk(
  'companies/update',
  async ({ id, formData }, thunkAPI) => {
    try {
      const response = await axiosClient.post(`/companies/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete company
export const deleteCompany = createAsyncThunk(
  'companies/delete',
  async (id, thunkAPI) => {
    try {
      await axiosClient.delete(`/companies/${id}`);
      return id;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const companySlice = createSlice({
  name: 'companies',
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
      .addCase(getCompanies.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCompanies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.companies = action.payload.data || action.payload;
      })
      .addCase(getCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.companies.push(action.payload.company);
        state.message = action.payload.message;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        const index = state.companies.findIndex(
          (company) => company.id === action.payload.company.id
        );
        if (index !== -1) {
          state.companies[index] = action.payload.company;
        }
        state.message = action.payload.message;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.companies = state.companies.filter(
          (company) => company.id !== action.payload
        );
      });
  },
});

export const { reset } = companySlice.actions;
export default companySlice.reducer;