import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

// ✅ Load token & user from localStorage
const tokenFromStorage = localStorage.getItem("token");
const userFromStorage = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

// ✅ Fetch Users API
export const getUserAPI = createAsyncThunk(
    "users/list/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axiosClient.get("/users/list", {
                headers: { Authorization: `Bearer ${token}` },
            });

            return response.data.users;
        } catch (error) {
            console.log("Error fetching users:", error.response?.data || error.message);
            return rejectWithValue(error.response?.data || "Failed to fetch users");
        }
    }
);


// ✅ Async Thunk for Login
export const loginUser = createAsyncThunk("auth/loginUser", async (userData, thunkAPI) => {
    try {
        const response = await axiosClient.post("/login", userData);
        return response.data;
    } catch (error) {
<<<<<<< HEAD
        return thunkAPI.rejectWithValue(error.response?.data || "Login failed");
=======
        const errorMessage = error.response?.data?.message || "Login failed";
        const validationErrors = error.response?.data?.errors || null;
        return thunkAPI.rejectWithValue({ message: errorMessage, errors: validationErrors });
>>>>>>> f81c650 (Initial commit)
    }
});

// ✅ Async Thunk for Register
export const registerUser = createAsyncThunk("auth/registerUser", async (userData, thunkAPI) => {
    try {
        const response = await axiosClient.post("/register", userData);
        return response.data;
    } catch (error) {
<<<<<<< HEAD
        return thunkAPI.rejectWithValue(error.response?.data || "Registration failed");
=======
        const errorMessage = error.response?.data?.message || "Registration failed";
        const validationErrors = error.response?.data?.errors || null;
        return thunkAPI.rejectWithValue({ message: errorMessage, errors: validationErrors });
>>>>>>> f81c650 (Initial commit)
    }
});

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: userFromStorage,
        token: tokenFromStorage,
        list: [], // ✅ Users list added
        loading: false,
        error: null,
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            localStorage.removeItem("token"); // ✅ Clear token from storage
            localStorage.removeItem("user");  // ✅ Clear user from storage
        },
    },
    extraReducers: (builder) => {
        builder
            // ✅ Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                localStorage.setItem("token", action.payload.token); // ✅ Save token
                localStorage.setItem("user", JSON.stringify(action.payload.user)); // ✅ Save user
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
<<<<<<< HEAD
                state.error = action.payload;
=======
                state.error = action.payload?.message || "An error occurred"; // ✅ Properly handle error message
>>>>>>> f81c650 (Initial commit)
            })
            // ✅ Register
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                localStorage.setItem("token", action.payload.token);
                localStorage.setItem("user", JSON.stringify(action.payload.user));
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
<<<<<<< HEAD
                state.error = action.payload;
=======
                state.error = action.payload?.message || "An error occurred";
                if (action.payload?.errors) {
                    state.validationErrors = action.payload.errors; // Store validation errors if present
                }
>>>>>>> f81c650 (Initial commit)
            })
            // ✅ Fetch Users List
            .addCase(getUserAPI.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUserAPI.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(getUserAPI.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
