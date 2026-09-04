import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getErrorMessage } from "../../utils/getErrorMessage";
import axiosClient from '../../api/axiosClient';

// ── Thunks ────────────────────────────────────────────────

export const fetchAllOrgs = createAsyncThunk(
    'superAdmin/fetchOrgs',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/super-admin/organisations');
            return data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

export const fetchOrgUsers = createAsyncThunk(
    'superAdmin/fetchOrgUsers',
    async (orgId, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get(`/super-admin/organisations/${orgId}/users`);
            return data.data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

export const fetchAllUsers = createAsyncThunk(
    'superAdmin/fetchAllUsers',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/super-admin/users');
            return data.data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

export const toggleOrgStatus = createAsyncThunk(
    'superAdmin/toggleOrg',
    async (orgId, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.patch(`/super-admin/organisations/${orgId}/toggle`);
            return { orgId, is_active: data.is_active };
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

export const changeOrgPlan = createAsyncThunk(
    'superAdmin/changePlan',
    async ({ orgId, plan }, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.patch(`/super-admin/organisations/${orgId}/plan`, { plan });
            return { orgId, plan: data.plan };
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

// ── Slice ─────────────────────────────────────────────────
const superAdminSlice = createSlice({
    name: 'superAdmin',
    initialState: {
        orgs:      [],
        users:     [],
        orgUsers:  [],
        stats:     null,
        isLoading: false,
        orgUsersLoading: false,
        error:     null,
    },
    reducers: {
        clearSuperAdminError: (state) => { state.error = null; },
        clearOrgUsers:        (state) => { state.orgUsers = []; },
    },
    extraReducers: (builder) => {
        builder
            // ── Fetch Orgs ────────────────────────────────
            .addCase(fetchAllOrgs.pending,   (s) => { s.isLoading = true; s.error = null; })
            .addCase(fetchAllOrgs.fulfilled,  (s, a) => {
                s.isLoading = false;
                s.orgs      = a.payload.data  || [];
                s.stats     = a.payload.stats || null;
            })
            .addCase(fetchAllOrgs.rejected,   (s, a) => { s.isLoading = false; s.error = a.payload; })

            // ── Fetch All Users ───────────────────────────
            .addCase(fetchAllUsers.pending,   (s) => { s.isLoading = true; })
            .addCase(fetchAllUsers.fulfilled,  (s, a) => { s.isLoading = false; s.users = a.payload; })
            .addCase(fetchAllUsers.rejected,   (s, a) => { s.isLoading = false; s.error = a.payload; })

            // ── Fetch Org Users ───────────────────────────
            .addCase(fetchOrgUsers.pending,   (s) => { s.orgUsersLoading = true; })
            .addCase(fetchOrgUsers.fulfilled,  (s, a) => { s.orgUsersLoading = false; s.orgUsers = a.payload; })
            .addCase(fetchOrgUsers.rejected,   (s) => { s.orgUsersLoading = false; })

            // ── Toggle Org ────────────────────────────────
            .addCase(toggleOrgStatus.fulfilled, (s, a) => {
                const org = s.orgs.find((o) => o.id === a.payload.orgId);
                if (org) org.is_active = a.payload.is_active;
            })

            // ── Change Plan ───────────────────────────────
            .addCase(changeOrgPlan.fulfilled, (s, a) => {
                const org = s.orgs.find((o) => o.id === a.payload.orgId);
                if (org) org.plan = a.payload.plan;
            });
    },
});

export const { clearSuperAdminError, clearOrgUsers } = superAdminSlice.actions;
export default superAdminSlice.reducer;
