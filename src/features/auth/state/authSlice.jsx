import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../../api/axiosClient";

const tokenFromStorage = localStorage.getItem("token") || null;
let userFromStorage = null;
try {
    const userStr = localStorage.getItem("user");
    userFromStorage = userStr ? JSON.parse(userStr) : null;
} catch {
    userFromStorage = null;
}

const saveUser = (user, token) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
};

// ── Thunks — unchanged ────────────────────────────────────

export const getUserAPI = createAsyncThunk(
    "users/list/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get("/users/list");
            return (
                response.data?.users ||
                response.data?.data ||
                response.data?.members ||
                response.data?.results ||
                []
            );
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to fetch users");
        }
    }
);

export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async (userData, thunkAPI) => {
        try {
            const response = await axiosClient.post("/login", userData);
            return {
                user: response.data?.user,
                token: response.data?.token || null,
            };
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Login failed";
            const validationErrors = error.response?.data?.errors || null;
            return thunkAPI.rejectWithValue({ message: errorMessage, errors: validationErrors });
        }
    }
);

export const registerUser = createAsyncThunk(
    "auth/registerUser",
    async (userData, thunkAPI) => {
        try {
            const response = await axiosClient.post("/register", userData);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Registration failed";
            const validationErrors = error.response?.data?.errors || null;
            return thunkAPI.rejectWithValue({ message: errorMessage, errors: validationErrors });
        }
    }
);

export const verifyOtp = createAsyncThunk(
    "auth/verifyOtp",
    async (data, thunkAPI) => {
        try {
            const response = await axiosClient.post("/verify-otp", data);
            return {
                user: response.data?.user,
                token: response.data?.token || null,
            };
        } catch (error) {
            const message = error.response?.data?.message || "OTP verification failed";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const resetPassword = createAsyncThunk(
    "auth/resetPassword",
    async (userData, thunkAPI) => {
        try {
            const { email, password, password_confirmation } = userData;
            const response = await axiosClient.post("/reset-password", {
                email, password, password_confirmation,
            });
            return response.data.message;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message || "Reset password failed"
            );
        }
    }
);

export const fetchMe = createAsyncThunk(
    "auth/fetchMe",
    async (_, { rejectWithValue }) => {
        try {
            if (!localStorage.getItem("token")) {
                return rejectWithValue("No token");
            }
            const response = await axiosClient.get("/me");
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed");
        }
    }
);

// ── NEW — org create hone ke baad user refresh karo ───────
export const updateAuthOrg = createAsyncThunk(
    "auth/updateOrg",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get("/me");
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed");
        }
    }
);

export const logoutUser = createAsyncThunk(
    "auth/logoutUser",
    async (_, { rejectWithValue }) => {
        try {
            await axiosClient.post("/logout");
            return true;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Logout failed");
        }
    }
);

// ── Slice ─────────────────────────────────────────────────
const authSlice = createSlice({
    name: "auth",
    initialState: {
        user:                 userFromStorage,
        token:                tokenFromStorage,
        role:                 userFromStorage?.role         || null,
        permissions:          userFromStorage?.permissions  || [],
        organisation:         userFromStorage?.organisation || null,  // ← NEW
        list:                 [],
        loading:              false,
        error:                null,
        resetPasswordMessage: null,
        registrationEmail:    null,
        validationErrors:     null,
        otpVerified:          false,
    },
    reducers: {
        logout: (state) => {
            state.user               = null;
            state.token              = null;
            state.role               = null;
            state.permissions        = [];
            state.organisation       = null;  // ← NEW
            state.registrationEmail  = null;
            state.otpVerified        = false;
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("session");
        },
        clearRegistrationData: (state) => {
            state.registrationEmail = null;
            state.error             = null;
            state.validationErrors  = null;
            state.otpVerified       = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // ── Login ─────────────────────────────────────
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading       = false;
                state.user          = action.payload?.user || null;
                state.token         = action.payload?.token || null;
                state.role          = action.payload?.user?.role         || null;
                state.permissions   = action.payload?.user?.permissions  || [];
                state.organisation  = action.payload?.user?.organisation || null;  // ← NEW
                if (action.payload?.user && action.payload?.token) saveUser(action.payload.user, action.payload.token);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading       = false;
                state.error         = action.payload?.message || "An error occurred";
                state.user          = null;
                state.token         = null;
                state.role          = null;
                state.permissions   = [];
                state.organisation  = null;
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("session");
            })

            // ── Register ──────────────────────────────────
            .addCase(registerUser.pending, (state) => {
                state.loading          = true;
                state.error            = null;
                state.validationErrors = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading           = false;
                state.registrationEmail = action.payload?.email ||
                                          action.payload?.user?.email ||
                                          action.meta?.arg?.email || null;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading          = false;
                state.error            = action.payload?.message || "An error occurred";
                state.validationErrors = action.payload?.errors || null;
            })

            // ── Verify OTP ────────────────────────────────
            .addCase(verifyOtp.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(verifyOtp.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload?.user) {
                    state.user            = action.payload.user;
                    state.token           = action.payload.token || null;
                    state.role            = action.payload.user?.role         || null;
                    state.permissions     = action.payload.user?.permissions  || [];
                    state.organisation    = action.payload.user?.organisation || null;  // ← NEW
                    state.registrationEmail = null;
                    if (action.payload?.token) saveUser(action.payload.user, action.payload.token);
                }
            })
            .addCase(verifyOtp.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload || "OTP verification failed";
            })

            // ── Fetch Users List ──────────────────────────
            .addCase(getUserAPI.pending,   (state) => { state.loading = true; })
            .addCase(getUserAPI.fulfilled,  (state, action) => {
                state.loading = false;
                state.list    = action.payload;
            })
            .addCase(getUserAPI.rejected,   (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            })

            // ── Reset Password ────────────────────────────
            .addCase(resetPassword.pending, (state) => {
                state.loading              = true;
                state.error                = null;
                state.resetPasswordMessage = null;
            })
            .addCase(resetPassword.fulfilled, (state, action) => {
                state.loading              = false;
                state.resetPasswordMessage = action.payload;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            })

            // ── Fetch Me ──────────────────────────────────
            .addCase(fetchMe.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(fetchMe.fulfilled, (state, action) => {
                state.loading      = false;
                state.user         = action.payload;
                state.token        = localStorage.getItem("token") || null;
                state.role         = action.payload?.role         || null;
                state.permissions  = action.payload?.permissions  || [];
                state.organisation = action.payload?.organisation || null;  // ← NEW
                if (state.token) saveUser(action.payload, state.token);
            })
            .addCase(fetchMe.rejected, (state) => {
                state.loading      = false;
                state.user         = null;
                state.token        = null;
                state.role         = null;
                state.permissions  = [];
                state.organisation = null;
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("session");
            })

            // ── Update Auth Org (NEW) ─────────────────────
            .addCase(updateAuthOrg.fulfilled, (state, action) => {
                state.user         = action.payload;
                state.token        = localStorage.getItem("token") || null;
                state.role         = action.payload?.role         || null;
                state.permissions  = action.payload?.permissions  || [];
                state.organisation = action.payload?.organisation || null;
                if (state.token) saveUser(action.payload, state.token);
            })

            .addCase(logoutUser.fulfilled, (state) => {
                state.user               = null;
                state.token              = null;
                state.role               = null;
                state.permissions        = [];
                state.organisation       = null;
                state.registrationEmail  = null;
                state.otpVerified        = false;
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("session");
            });
    },
});

export const { logout, clearRegistrationData } = authSlice.actions;
export default authSlice.reducer;
