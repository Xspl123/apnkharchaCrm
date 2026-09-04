import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../../api/axiosClient';

// ── Thunks ────────────────────────────────────────────────

export const getCampaigns = createAsyncThunk(
    'campaigns/getAll',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/campaigns');
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const getCampaignById = createAsyncThunk(
    'campaigns/getById',
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get(`/campaigns/${id}`);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const createCampaign = createAsyncThunk(
    'campaigns/create',
    async (campaignData, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.post('/campaigns', campaignData);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const updateCampaign = createAsyncThunk(
    'campaigns/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await axiosClient.put(`/campaigns/${id}`, data);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const deleteCampaign = createAsyncThunk(
    'campaigns/delete',
    async (id, { rejectWithValue }) => {
        try {
            await axiosClient.delete(`/campaigns/${id}`);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const attachLeadsToCampaign = createAsyncThunk(
    'campaigns/attachLeads',
    async ({ id, lead_ids }, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.post(`/campaigns/${id}/leads`, { lead_ids });
            return { id, leads_count: data.leads_count };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const detachLeadFromCampaign = createAsyncThunk(
    'campaigns/detachLead',
    async ({ id, leadId }, { rejectWithValue }) => {
        try {
            await axiosClient.delete(`/campaigns/${id}/leads/${leadId}`);
            return { id, leadId };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

// ── Slice ─────────────────────────────────────────────────
const campaignSlice = createSlice({
    name: 'campaigns',
    initialState: {
        campaigns:      [],
        selectedCampaign: null,
        isLoading:      false,
        actionLoading:  false,
        error:          null,
    },
    reducers: {
        clearCampaignError:    (state) => { state.error = null; },
        clearSelectedCampaign: (state) => { state.selectedCampaign = null; },
    },
    extraReducers: (builder) => {
        builder
            // ── Get All ───────────────────────────────────
            .addCase(getCampaigns.pending,   (s) => { s.isLoading = true; s.error = null; })
            .addCase(getCampaigns.fulfilled,  (s, a) => { s.isLoading = false; s.campaigns = a.payload; })
            .addCase(getCampaigns.rejected,   (s, a) => { s.isLoading = false; s.error = a.payload; })

            // ── Get By ID ─────────────────────────────────
            .addCase(getCampaignById.fulfilled, (s, a) => { s.selectedCampaign = a.payload; })

            // ── Create ────────────────────────────────────
            .addCase(createCampaign.pending,   (s) => { s.actionLoading = true; })
            .addCase(createCampaign.fulfilled,  (s, a) => {
                s.actionLoading = false;
                s.campaigns.unshift(a.payload);
            })
            .addCase(createCampaign.rejected,   (s, a) => { s.actionLoading = false; s.error = a.payload; })

            // ── Update ────────────────────────────────────
            .addCase(updateCampaign.pending,   (s) => { s.actionLoading = true; })
            .addCase(updateCampaign.fulfilled,  (s, a) => {
                s.actionLoading = false;
                const i = s.campaigns.findIndex((c) => c.id === a.payload.id);
                if (i !== -1) s.campaigns[i] = a.payload;
            })
            .addCase(updateCampaign.rejected,   (s, a) => { s.actionLoading = false; s.error = a.payload; })

            // ── Delete ────────────────────────────────────
            .addCase(deleteCampaign.fulfilled, (s, a) => {
                s.campaigns = s.campaigns.filter((c) => c.id !== a.payload);
            })

            // ── Attach Leads ──────────────────────────────
            .addCase(attachLeadsToCampaign.fulfilled, (s, a) => {
                const i = s.campaigns.findIndex((c) => c.id === a.payload.id);
                if (i !== -1) s.campaigns[i].leads_count = a.payload.leads_count;
            })

            // ── Detach Lead ───────────────────────────────
            .addCase(detachLeadFromCampaign.fulfilled, (s, a) => {
                const i = s.campaigns.findIndex((c) => c.id === a.payload.id);
                if (i !== -1 && s.campaigns[i].leads_count > 0) {
                    s.campaigns[i].leads_count -= 1;
                }
            });
    },
});

export const { clearCampaignError, clearSelectedCampaign } = campaignSlice.actions;
export default campaignSlice.reducer;
