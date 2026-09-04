import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../../api/axiosClient';

// ── Thunks ────────────────────────────────────────────────

export const getUsers = createAsyncThunk(
    'users/getAll',
    async (params = {}, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/users', { params });
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const createUser = createAsyncThunk(
    'users/create',
    async (userData, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.post('/users', userData);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const updateUser = createAsyncThunk(
    'users/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await axiosClient.put(`/users/${id}`, data);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const toggleUserActive = createAsyncThunk(
    'users/toggleActive',
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.patch(`/users/${id}/toggle-active`);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const deleteUser = createAsyncThunk(
    'users/delete',
    async (id, { rejectWithValue }) => {
        try {
            await axiosClient.delete(`/users/${id}`);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

// ── Slice ─────────────────────────────────────────────────
const userSlice = createSlice({
    name: 'users',
    initialState: {
        users:     [],
        isLoading: false,
        error:     null,
    },
    reducers: {
        resetUserError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getUsers.pending,   (s) => { s.isLoading = true; s.error = null; })
            .addCase(getUsers.fulfilled,  (s, a) => { s.isLoading = false; s.users = a.payload; })
            .addCase(getUsers.rejected,   (s, a) => { s.isLoading = false; s.error = a.payload; })

            .addCase(createUser.fulfilled, (s, a) => { s.users.unshift(a.payload); })
            .addCase(createUser.rejected,  (s, a) => { s.error = a.payload; })

            .addCase(updateUser.fulfilled, (s, a) => {
                const i = s.users.findIndex((u) => u.id === a.payload.id);
                if (i !== -1) s.users[i] = a.payload;
            })

            .addCase(toggleUserActive.fulfilled, (s, a) => {
                const i = s.users.findIndex((u) => u.id === a.payload.id);
                if (i !== -1) s.users[i] = a.payload;
            })

            .addCase(deleteUser.fulfilled, (s, a) => {
                s.users = s.users.filter((u) => u.id !== a.payload);
            });
    },
});

export const { resetUserError } = userSlice.actions;
export default userSlice.reducer;
