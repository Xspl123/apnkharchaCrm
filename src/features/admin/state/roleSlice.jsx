import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../../api/axiosClient';

// ── Thunks ────────────────────────────────────────────────

export const getRoles = createAsyncThunk(
    'roles/getAll',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/roles');
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const getRoleById = createAsyncThunk(
    'roles/getById',
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get(`/roles/${id}`);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const getPermissions = createAsyncThunk(
    'roles/getPermissions',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/permissions');
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const updateRolePermissions = createAsyncThunk(
    'roles/updatePermissions',
    async ({ id, permission_ids }, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.put(`/roles/${id}/permissions`, {
                permission_ids,
            });
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

// ── Slice ─────────────────────────────────────────────────
const roleSlice = createSlice({
    name: 'roles',
    initialState: {
        roles:       [],
        permissions: [],  // all permissions grouped by module
        isLoading:   false,
        error:       null,
    },
    reducers: {
        resetRoleError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getRoles.pending,   (s) => { s.isLoading = true; s.error = null; })
            .addCase(getRoles.fulfilled,  (s, a) => { s.isLoading = false; s.roles = a.payload; })
            .addCase(getRoles.rejected,   (s, a) => { s.isLoading = false; s.error = a.payload; })

            .addCase(getPermissions.fulfilled, (s, a) => { s.permissions = a.payload; })

            .addCase(updateRolePermissions.fulfilled, (s, a) => {
                const i = s.roles.findIndex((r) => r.id === a.payload.id);
                if (i !== -1) s.roles[i] = a.payload;
            })
            .addCase(updateRolePermissions.rejected, (s, a) => { s.error = a.payload; });
    },
});

export const { resetRoleError } = roleSlice.actions;
export default roleSlice.reducer;
