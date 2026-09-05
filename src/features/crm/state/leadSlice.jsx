import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../../api/axiosClient';

// ── Thunks ────────────────────────────────────────────────

export const getLeads = createAsyncThunk(
    'leads/getAll',
    async (params = {}, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/leads', { params });
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const getLeadSummary = createAsyncThunk(
    'leads/getSummary',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/leads/summary');
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const getLeadPipeline = createAsyncThunk(
    'leads/getPipeline',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/leads/pipeline');
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

// Lightweight endpoint (does NOT return full lead objects) used by the
// global reminder bell in the Navbar — powers it on every CRM page, not
// just the Leads list. Backend: GET /leads/due-followups should return
// { data: [{ follow_up_id, lead_id, company_name, due_date, note, is_overdue }] }
// scoped to the current user the same way getAll() is (sales_agent sees
// only their own leads).
export const getDueFollowUps = createAsyncThunk(
    'leads/getDueFollowUps',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/leads/due-followups');
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

// Server-side "next N days" follow-up look-ahead. Backend: GET
// /leads/upcoming-followups?days=7 (LeadController::upcomingFollowUps).
// Note: LeadDashboard currently computes its own upcoming-follow-ups list
// client-side via useMemo over the already-loaded `leads` state, so this
// thunk isn't required for that view to work — it's here so any screen
// that wants the server-scoped version (rather than recomputing from
// whatever leads happen to be loaded) can dispatch it directly.
export const getUpcomingFollowUps = createAsyncThunk(
    'leads/getUpcomingFollowUps',
    async (days = 7, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/leads/upcoming-followups', { params: { days } });
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

// New, unactioned web-form leads (source=website, status still 'new').
// Powers the "new web lead" alert in the same Navbar reminder bell.
export const getNewWebLeads = createAsyncThunk(
    'leads/getNewWebLeads',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/leads/new-web-leads');
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

// Lead scoring rules — org-scoped (one shared set of rules per org, so the
// whole sales team scores leads the same way, not per-browser localStorage).
export const getScoreRules = createAsyncThunk(
    'leads/getScoreRules',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/leads/score-rules');
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const saveScoreRules = createAsyncThunk(
    'leads/saveScoreRules',
    async (rules, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.put('/leads/score-rules', rules);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

// ── Custom Field Definitions (org/user-scoped "Manage Custom Fields") ──
export const getCustomFields = createAsyncThunk(
    'leads/getCustomFields',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/leads/custom-fields');
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const createCustomField = createAsyncThunk(
    'leads/createCustomField',
    async (fieldData, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.post('/leads/custom-fields', fieldData);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const updateCustomField = createAsyncThunk(
    'leads/updateCustomField',
    async ({ id, data: fieldData }, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.put(`/leads/custom-fields/${id}`, fieldData);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const deleteCustomField = createAsyncThunk(
    'leads/deleteCustomField',
    async (id, { rejectWithValue }) => {
        try {
            await axiosClient.delete(`/leads/custom-fields/${id}`);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const getLeadById = createAsyncThunk(
    'leads/getById',
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get(`/leads/${id}`);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const createLead = createAsyncThunk(
    'leads/create',
    async (leadData, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.post('/leads', leadData);
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const updateLead = createAsyncThunk(
    'leads/update',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await axiosClient.put(`/leads/${id}`, data);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const deleteLead = createAsyncThunk(
    'leads/delete',
    async (id, { rejectWithValue }) => {
        try {
            await axiosClient.delete(`/leads/${id}`);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const updateLeadStatus = createAsyncThunk(
    'leads/updateStatus',
    async ({ id, status, lost_reason }, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.patch(`/leads/${id}/status`, {
                status, lost_reason,
            });
            return data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const addLeadActivity = createAsyncThunk(
    'leads/addActivity',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await axiosClient.post(`/leads/${id}/activities`, data);
            return { leadId: id, activity: res.data.data };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const addLeadFollowUp = createAsyncThunk(
    'leads/addFollowUp',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await axiosClient.post(`/leads/${id}/follow-ups`, data);
            return { leadId: id, followUp: res.data.data };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

export const markFollowUpDone = createAsyncThunk(
    'leads/markFollowUpDone',
    async ({ followUpId, leadId }, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.patch(`/follow-ups/${followUpId}/done`);
            return { leadId, followUp: data.data };
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed');
        }
    }
);

// ── Helpers ───────────────────────────────────────────────
const updateLeadInList = (state, updatedLead) => {
    const i = state.leads.findIndex((l) => l.id === updatedLead.id);
    if (i !== -1) state.leads[i] = updatedLead;
    if (state.selectedLead?.id === updatedLead.id) {
        state.selectedLead = updatedLead;
    }
};

// Backend list endpoint (/leads) doesn't send activities/follow_ups per lead
// (only /leads/:id does). So we keep a local cache, keyed by lead id, of the
// latest known activities/follow_ups and merge it into every lead — both when
// the list is freshly fetched, and immediately when an activity/follow-up is
// logged from the detail page — so LeadList's table always has the latest data
// without needing a backend change.
const getCachedActivityData = (cache, leadId) =>
    cache[leadId] || { activities: [], follow_ups: [] };

const mergeActivityCacheIntoLead = (lead, cache) => {
    const cached = cache[lead.id];
    if (!cached) return lead;
    return {
        ...lead,
        activities: cached.activities?.length ? cached.activities : lead.activities,
        follow_ups: cached.follow_ups?.length ? cached.follow_ups : lead.follow_ups,
    };
};

const patchLeadInListWithCache = (state, leadId) => {
    const cached = getCachedActivityData(state.activityCache, leadId);
    const i = state.leads.findIndex((l) => l.id === leadId);
    if (i !== -1) {
        state.leads[i] = {
            ...state.leads[i],
            activities: cached.activities,
            follow_ups: cached.follow_ups,
        };
    }
};

// ── Slice ─────────────────────────────────────────────────
const leadSlice = createSlice({
    name: 'leads',
    initialState: {
        leads:        [],
        selectedLead: null,
        summary:      null,
        pipeline:     null,
        dueFollowUps: [],
        upcomingFollowUps: [],
        scoreRules:   null, // null until fetched; LeadList falls back to DEFAULT_SCORE_RULES while this is null
        customFields: [], // [{ id, field_key, label, field_type, options, is_required, sort_order }]
        customFieldsLoading: false,
        isLoading:    false,
        actionLoading: false,
        error:        null,
        activityCache: {}, // { [leadId]: { activities: [], follow_ups: [] } }
    },
    reducers: {
        clearSelectedLead: (state) => { state.selectedLead = null; },
        clearLeadError:    (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            // ── Get All ───────────────────────────────────
            .addCase(getLeads.pending,   (s) => { s.isLoading = true; s.error = null; })
            .addCase(getLeads.fulfilled,  (s, a) => {
                s.isLoading = false;
                s.leads = a.payload.map((lead) => mergeActivityCacheIntoLead(lead, s.activityCache));
            })
            .addCase(getLeads.rejected,   (s, a) => { s.isLoading = false; s.error = a.payload; })

            // ── Summary ───────────────────────────────────
            .addCase(getLeadSummary.fulfilled, (s, a) => { s.summary = a.payload; })

            // ── Pipeline ──────────────────────────────────
            .addCase(getLeadPipeline.fulfilled, (s, a) => { s.pipeline = a.payload; })

            // ── Due Follow-ups (global reminder bell) ─────
            .addCase(getDueFollowUps.fulfilled, (s, a) => { s.dueFollowUps = a.payload; })
            .addCase(getUpcomingFollowUps.fulfilled, (s, a) => { s.upcomingFollowUps = a.payload; })
            .addCase(getNewWebLeads.fulfilled, (s, a) => { s.newWebLeads = a.payload; })

            // ── Lead Scoring Rules (org-shared) ────────────
            .addCase(getScoreRules.fulfilled, (s, a) => { s.scoreRules = a.payload; })
            .addCase(saveScoreRules.fulfilled, (s, a) => { s.scoreRules = a.payload; })

            // ── Custom Field Definitions ──────────────────
            .addCase(getCustomFields.pending, (s) => { s.customFieldsLoading = true; })
            .addCase(getCustomFields.fulfilled, (s, a) => {
                s.customFieldsLoading = false;
                s.customFields = a.payload || [];
            })
            .addCase(getCustomFields.rejected, (s, a) => { s.customFieldsLoading = false; s.error = a.payload; })
            .addCase(createCustomField.fulfilled, (s, a) => {
                s.customFields = [...s.customFields, a.payload]
                    .sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0) || x.id - y.id);
            })
            .addCase(updateCustomField.fulfilled, (s, a) => {
                const i = s.customFields.findIndex((f) => f.id === a.payload.id);
                if (i !== -1) s.customFields[i] = a.payload;
            })
            .addCase(deleteCustomField.fulfilled, (s, a) => {
                s.customFields = s.customFields.filter((f) => f.id !== a.payload);
            })

            // ── Get By ID ─────────────────────────────────
            .addCase(getLeadById.pending,   (s) => { s.isLoading = true; })
            .addCase(getLeadById.fulfilled,  (s, a) => {
                s.isLoading = false;
                s.selectedLead = a.payload;
                // Detail endpoint is the source of truth for activities/follow_ups,
                // cache it so the list table can reuse it.
                s.activityCache[a.payload.id] = {
                    activities: a.payload.activities || [],
                    follow_ups: a.payload.follow_ups || [],
                };
                patchLeadInListWithCache(s, a.payload.id);
            })
            .addCase(getLeadById.rejected,   (s, a) => { s.isLoading = false; s.error = a.payload; })

            // ── Create ────────────────────────────────────
            .addCase(createLead.pending,   (s) => { s.actionLoading = true; })
            .addCase(createLead.fulfilled,  (s, a) => {
                s.actionLoading = false;
                s.leads.unshift(a.payload);
            })
            .addCase(createLead.rejected,   (s, a) => { s.actionLoading = false; s.error = a.payload; })

            // ── Update ────────────────────────────────────
            .addCase(updateLead.pending,   (s) => { s.actionLoading = true; })
            .addCase(updateLead.fulfilled,  (s, a) => {
                s.actionLoading = false;
                updateLeadInList(s, a.payload);
                patchLeadInListWithCache(s, a.payload.id);
            })
            .addCase(updateLead.rejected,   (s, a) => { s.actionLoading = false; s.error = a.payload; })

            // ── Delete ────────────────────────────────────
            .addCase(deleteLead.fulfilled, (s, a) => {
                s.leads = s.leads.filter((l) => l.id !== a.payload);
                if (s.selectedLead?.id === a.payload) s.selectedLead = null;
                delete s.activityCache[a.payload];
            })

            // ── Update Status ─────────────────────────────
            .addCase(updateLeadStatus.pending,   (s) => { s.actionLoading = true; })
            .addCase(updateLeadStatus.fulfilled,  (s, a) => {
                s.actionLoading = false;
                updateLeadInList(s, a.payload);
                patchLeadInListWithCache(s, a.payload.id);
            })
            .addCase(updateLeadStatus.rejected,   (s, a) => { s.actionLoading = false; s.error = a.payload; })

            // ── Add Activity ──────────────────────────────
            .addCase(addLeadActivity.fulfilled, (s, a) => {
                const { leadId, activity } = a.payload;

                if (s.selectedLead?.id === leadId) {
                    s.selectedLead.activities = [
                        activity,
                        ...(s.selectedLead.activities || []),
                    ];
                }

                const cached = getCachedActivityData(s.activityCache, leadId);
                s.activityCache[leadId] = {
                    activities: [activity, ...(cached.activities || [])],
                    follow_ups: cached.follow_ups || [],
                };

                patchLeadInListWithCache(s, leadId);
            })

            // ── Add Follow-up ─────────────────────────────
            .addCase(addLeadFollowUp.fulfilled, (s, a) => {
                const { leadId, followUp } = a.payload;

                if (s.selectedLead?.id === leadId) {
                    s.selectedLead.follow_ups = [
                        ...(s.selectedLead.follow_ups || []),
                        followUp,
                    ];
                }

                const cached = getCachedActivityData(s.activityCache, leadId);
                s.activityCache[leadId] = {
                    activities: cached.activities || [],
                    follow_ups: [...(cached.follow_ups || []), followUp],
                };

                patchLeadInListWithCache(s, leadId);
            })

            // ── Mark Follow-up Done ───────────────────────
            .addCase(markFollowUpDone.fulfilled, (s, a) => {
                const { leadId, followUp } = a.payload;

                if (s.selectedLead?.id === leadId) {
                    const i = s.selectedLead.follow_ups?.findIndex(
                        (f) => f.id === followUp.id
                    );
                    if (i !== undefined && i !== -1) {
                        s.selectedLead.follow_ups[i] = followUp;
                    }
                }

                const cached = getCachedActivityData(s.activityCache, leadId);
                const followUps = cached.follow_ups || [];
                const idx = followUps.findIndex((f) => f.id === followUp.id);
                const nextFollowUps = idx !== -1
                    ? followUps.map((f) => (f.id === followUp.id ? followUp : f))
                    : [...followUps, followUp];

                s.activityCache[leadId] = {
                    activities: cached.activities || [],
                    follow_ups: nextFollowUps,
                };

                patchLeadInListWithCache(s, leadId);
            });
    },
});

export const { clearSelectedLead, clearLeadError } = leadSlice.actions;
export default leadSlice.reducer;