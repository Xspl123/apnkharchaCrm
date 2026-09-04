import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getErrorMessage } from "../../utils/getErrorMessage";
import axiosClient from "../../api/axiosClient";


export const getAttributeGroups = createAsyncThunk(
    'attributes/getGroups',
    async (params = {}, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get('/attribute-groups', { params });
            return data.data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

export const createAttributeGroup = createAsyncThunk(
    'attributes/createGroup',
    async (data, { rejectWithValue }) => {
        try {
            const res = await axiosClient.post('/attribute-groups', data);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

export const updateAttributeGroup = createAsyncThunk(
    'attributes/updateGroup',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await axiosClient.put(`/attribute-groups/${id}`, data);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

export const deleteAttributeGroup = createAsyncThunk(
    'attributes/deleteGroup',
    async (id, { rejectWithValue }) => {
        try {
            await axiosClient.delete(`/attribute-groups/${id}`);
            return id;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);


export const addAttribute = createAsyncThunk(
    'attributes/addAttribute',
    async ({ groupId, data }, { rejectWithValue }) => {
        try {
            const res = await axiosClient.post(`/attribute-groups/${groupId}/attributes`, data);
            return { groupId, attribute: res.data.data };
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

export const updateAttribute = createAsyncThunk(
    'attributes/updateAttribute',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await axiosClient.put(`/attributes/${id}`, data);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

export const deleteAttribute = createAsyncThunk(
    'attributes/deleteAttribute',
    async ({ id, groupId }, { rejectWithValue }) => {
        try {
            await axiosClient.delete(`/attributes/${id}`);
            return { id, groupId };
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);


export const getProductAttributes = createAsyncThunk(
    'attributes/getProductAttributes',
    async (productId, { rejectWithValue }) => {
        try {
            const { data } = await axiosClient.get(`/products/${productId}/attributes`);
            return { productId, values: data.data };
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);

export const saveProductAttributes = createAsyncThunk(
    'attributes/saveProductAttributes',
    async ({ productId, attributes }, { rejectWithValue }) => {
        try {
            await axiosClient.post(`/products/${productId}/attributes`, { attributes });
            return { productId, attributes };
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    }
);


const attributeSlice = createSlice({
    name: 'attributes',
    initialState: {
        groups:            [],
        productAttributes: {},
        isLoading:         false,
        error:             null,
    },
    reducers: {
        resetAttributes: (state) => {
            state.groups            = [];
            state.productAttributes = {};
            state.error             = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAttributeGroups.pending,   (s)    => { s.isLoading = true; s.error = null; })
            .addCase(getAttributeGroups.fulfilled,  (s, a) => { s.isLoading = false; s.groups = a.payload; })
            .addCase(getAttributeGroups.rejected,   (s, a) => { s.isLoading = false; s.error = a.payload; })

            .addCase(createAttributeGroup.fulfilled, (s, a) => { s.groups.push(a.payload); })

            .addCase(updateAttributeGroup.fulfilled, (s, a) => {
                const i = s.groups.findIndex((g) => g.id === a.payload.id);
                if (i !== -1) s.groups[i] = a.payload;
            })

            .addCase(deleteAttributeGroup.fulfilled, (s, a) => {
                s.groups = s.groups.filter((g) => g.id !== a.payload);
            })

            .addCase(addAttribute.fulfilled, (s, a) => {
                const group = s.groups.find((g) => g.id === a.payload.groupId);
                if (group) group.attributes = [...(group.attributes || []), a.payload.attribute];
            })

            .addCase(updateAttribute.fulfilled, (s, a) => {
                for (const group of s.groups) {
                    const i = group.attributes?.findIndex((attr) => attr.id === a.payload.id);
                    if (i !== undefined && i !== -1) { group.attributes[i] = a.payload; break; }
                }
            })

            .addCase(deleteAttribute.fulfilled, (s, a) => {
                const group = s.groups.find((g) => g.id === a.payload.groupId);
                if (group) group.attributes = group.attributes.filter((attr) => attr.id !== a.payload.id);
            })

            .addCase(getProductAttributes.fulfilled, (s, a) => {
                s.productAttributes[a.payload.productId] = a.payload.values;
            })

            .addCase(saveProductAttributes.fulfilled, (s, a) => {
                s.productAttributes[a.payload.productId] = a.payload.attributes;
            });
    },
});

export const { resetAttributes } = attributeSlice.actions;
export default attributeSlice.reducer;