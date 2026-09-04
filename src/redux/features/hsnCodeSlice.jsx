import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getErrorMessage } from "../../utils/getErrorMessage";
import axiosClient from '../../api/axiosClient';

const initialState = {
  hsnCodes: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

export const getHsnCodes = createAsyncThunk(
  'hsnCodes/getAll',
  async (_, thunkAPI) => {
    try {
      const response = await axiosClient.get('/hsn-codes');
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createHsnCode = createAsyncThunk(
  'hsnCodes/create',
  async (data, thunkAPI) => {
    try {
      const response = await axiosClient.post('/hsn-codes', data);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateHsnCode = createAsyncThunk(
  'hsnCodes/update',
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await axiosClient.put(`/hsn-codes/${id}`, data);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteHsnCode = createAsyncThunk(
  'hsnCodes/delete',
  async (id, thunkAPI) => {
    try {
      await axiosClient.delete(`/hsn-codes/${id}`);
      return id;
    } catch (error) {
      const message = getErrorMessage(error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const hsnCodeSlice = createSlice({
  name: 'hsnCodes',
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
      .addCase(getHsnCodes.fulfilled, (state, action) => {
        state.hsnCodes = action.payload.data || action.payload;
      })
      .addCase(createHsnCode.fulfilled, (state, action) => {
        state.hsnCodes.push(action.payload.hsn_code);
      })
      .addCase(updateHsnCode.fulfilled, (state, action) => {
        const index = state.hsnCodes.findIndex(
          (hsn) => hsn.id === action.payload.hsn_code.id
        );
        if (index !== -1) {
          state.hsnCodes[index] = action.payload.hsn_code;
        }
      })
      .addCase(deleteHsnCode.fulfilled, (state, action) => {
        state.hsnCodes = state.hsnCodes.filter(
          (hsn) => hsn.id !== action.payload
        );
      });
  },
});

export const { reset } = hsnCodeSlice.actions;
export default hsnCodeSlice.reducer;