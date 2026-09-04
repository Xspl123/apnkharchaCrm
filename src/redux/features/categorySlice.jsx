import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getErrorMessage } from "../../utils/getErrorMessage";
import axiosClient from "../../api/axiosClient";

// ✅ Create Category
export const createCategoryAPI = createAsyncThunk(
    "categories/create",
    async (categoryData, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post("/categories/create", categoryData);
            return response.data;
        } catch (error) {
            return rejectWithValue(getErrorMessage(error));
        }
    }
);

// ✅ Fetch Categories API
export const getCategoryAPI = createAsyncThunk(
    "categories/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get("/categories");
            return response.data;
        } catch (error) {
            return rejectWithValue(getErrorMessage(error));
        }
    }
);

// ✅ Update Category API
export const updateCategoryAPI = createAsyncThunk(
    "categories/update",
    async ({ id, name, type }, { rejectWithValue }) => {
        try {
            const response = await axiosClient.put(`/categories/${id}`, { name, type });
            return response.data;
        } catch (error) {
            return rejectWithValue(getErrorMessage(error));
        }
    }
);

// ✅ Delete Category API
export const deleteCategoryAPI = createAsyncThunk(
    "categories/delete",
    async (id, { rejectWithValue }) => {
        try {
            await axiosClient.delete(`/categories/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(getErrorMessage(error));
        }
    }
);

const categorySlice = createSlice({
    name: "categories",
    initialState: {
        list: [], // ✅ `list` me categories store ho rahi hai
        pagination: {}, // ✅ Pagination Data Store Karne Ke Liye
        loading: false,
        error: null,
    },
    reducers: {},

    extraReducers: (builder) => {
        builder
            .addCase(getCategoryAPI.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getCategoryAPI.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload.data; // ✅ Yaha `list` me categories assign karni thi
                state.pagination = {
                    currentPage: action.payload.current_page,
                    lastPage: action.payload.last_page,
                    total: action.payload.total,
                    perPage: action.payload.per_page,
                };
            })
            .addCase(getCategoryAPI.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default categorySlice.reducer;
