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
            const response = await axiosClient.post("/category-create", categoryData, {
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
            return response.data;
        } catch (error) {
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
            const response = await axiosClient.put(`/category-update/${id}`, { name, type }, {
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
            await axiosClient.delete(`/category-delete/${id}`, {
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
        list: [],
        loading: false,
        error: null,
    },
    reducers: {},

    extraReducers: (builder) => {
        builder
            // 🚀 Get Categories API
            .addCase(getCategoryAPI.pending, (state) => {
                state.loading = true;
            })
            .addCase(getCategoryAPI.fulfilled, (state, action) => {
                state.loading = false;
                
                state.list = action.payload.categories || []; // ✅ Ensure categories exist
            })
            .addCase(getCategoryAPI.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch categories";
            })
    
            // 🚀 Create Category API
            .addCase(createCategoryAPI.fulfilled, (state, action) => {
                if (action.payload && action.payload.category) {
                    state.list.push(action.payload.category);
                } else {
                    console.error("Invalid response for createCategoryAPI:", action.payload);
                }
            })
    
            // 🚀 Update Category API
            .addCase(updateCategoryAPI.fulfilled, (state, action) => {
                if (!action.payload || !action.payload.category) {
                    console.error("Invalid update response:", action.payload);
                    return;
                }

                state.list = state.list.map((cat) =>
                    cat.id === action.payload.category.id ? action.payload.category : cat
                );
            })
    
            // 🚀 Delete Category API
            .addCase(deleteCategoryAPI.fulfilled, (state, action) => {
                state.list = state.list.filter((cat) => cat.id !== action.payload);
            });
    } // ❌ Removed incorrect semicolon here
});

export default categorySlice.reducer;
