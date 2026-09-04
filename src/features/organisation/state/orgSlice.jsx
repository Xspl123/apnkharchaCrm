import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../../api/axiosClient';

// ── Thunks ────────────────────────────────────────────────

export const createOrganisation = createAsyncThunk(
    'org/create',
    async (data, { rejectWithValue }) => {
        try {
            const res = await axiosClient.post('/organisation/create', data);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const getOrganisation = createAsyncThunk(
    'org/get',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/organisation');
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const updateOrganisation = createAsyncThunk(
    'org/update',
    async (data, { rejectWithValue }) => {
        try {
            const res = await axiosClient.put('/organisation', data);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const getOrgMembers = createAsyncThunk(
    'org/getMembers',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/organisation/members');
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const addOrgMember = createAsyncThunk(
    'org/addMember',
    async (data, { rejectWithValue }) => {
        try {
            const res = await axiosClient.post('/organisation/members', data);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const updateMemberRole = createAsyncThunk(
    'org/updateMemberRole',
    async ({ userId, role_id }, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.put(`/organisation/members/${userId}/role`, { role_id });
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const toggleOrgMember = createAsyncThunk(
    'org/toggleMember',
    async (userId, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.patch(`/organisation/members/${userId}/toggle`);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const removeOrgMember = createAsyncThunk(
    'org/removeMember',
    async (userId, { rejectWithValue }) => {
        try {
            await axiosClient.delete(`/organisation/members/${userId}`);
            return userId;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

// ── Slice ─────────────────────────────────────────────────
const orgSlice = createSlice({
    name: 'org',
    initialState: {
        organisation:  null,
        members:       [],
        isLoading:     false,
        actionLoading: false,
        error:         null,
    },
    reducers: {
        clearOrgError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createOrganisation.pending,   (s) => { s.actionLoading = true; s.error = null; })
            .addCase(createOrganisation.fulfilled,  (s, a) => { s.actionLoading = false; s.organisation = a.payload; })
            .addCase(createOrganisation.rejected,   (s, a) => { s.actionLoading = false; s.error = a.payload; })

            .addCase(getOrganisation.pending,   (s) => { s.isLoading = true; })
            .addCase(getOrganisation.fulfilled,  (s, a) => { s.isLoading = false; s.organisation = a.payload; })
            .addCase(getOrganisation.rejected,   (s, a) => { s.isLoading = false; s.error = a.payload; })

            .addCase(updateOrganisation.fulfilled, (s, a) => { s.organisation = a.payload; })

            .addCase(getOrgMembers.pending,   (s) => { s.isLoading = true; })
            .addCase(getOrgMembers.fulfilled,  (s, a) => { s.isLoading = false; s.members = a.payload; })
            .addCase(getOrgMembers.rejected,   (s, a) => { s.isLoading = false; s.error = a.payload; })

            .addCase(addOrgMember.pending,    (s) => { s.actionLoading = true; })
            .addCase(addOrgMember.fulfilled,   (s) => { s.actionLoading = false; })
            .addCase(addOrgMember.rejected,    (s, a) => { s.actionLoading = false; s.error = a.payload; })

            .addCase(toggleOrgMember.fulfilled, (s, a) => {
                const ou = a.payload;
                const i  = s.members.findIndex((m) => m.user?.id === ou.user_id || m.user_id === ou.user_id);
                if (i !== -1) s.members[i] = { ...s.members[i], is_active: ou.is_active };
            })

            .addCase(removeOrgMember.fulfilled, (s, a) => {
                s.members = s.members.filter((m) => m.user?.id !== a.payload && m.user_id !== a.payload);
            });
    },
});

export const { clearOrgError } = orgSlice.actions;
export default orgSlice.reducer;
