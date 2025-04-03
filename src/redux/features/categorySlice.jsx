import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

// ✅ Get token from localStorage
const getToken = () => localStorage.getItem("token");

// ✅ Create Category
export const createCategoryAPI = createAsyncThunk(
    "categories/create",
    async (categoryData, { rejectWithValue }) => {
        try {
            const token = getToken();
            const response = await axiosClient.post("/categories/create", categoryData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ✅ Fetch Categories API
export const getCategoryAPI = createAsyncThunk(
    "categories/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const token = getToken();
            const response = await axiosClient.get("/categories", {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("API Response testing:", response.data.data); // ✅ Debugging ke liye console log
            return response.data;
        } catch (error) {
            console.error("API Fetch Error:", error);
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ✅ Update Category API
export const updateCategoryAPI = createAsyncThunk(
    "categories/update",
    async ({ id, name, type }, { rejectWithValue }) => {
        try {
            const token = getToken();
            const response = await axiosClient.put(`/categories/${id}`, { name, type }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ✅ Delete Category API
export const deleteCategoryAPI = createAsyncThunk(
    "categories/delete",
    async (id, { rejectWithValue }) => {
        try {
            const token = getToken();
            await axiosClient.delete(`/categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
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
                console.log("Fetched Categories:", action.payload?.data); // ✅ Debugging ke liye log
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
