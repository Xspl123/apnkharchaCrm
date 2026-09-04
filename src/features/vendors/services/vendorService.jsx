import axiosClient from '../../../api/axiosClient';

const vendorService = {
    // Vendors
    getAll:      (params) => axiosClient.get('/vendors', { params }),
    getSummary:  ()       => axiosClient.get('/vendors/summary'),
    getById:     (id)     => axiosClient.get(`/vendors/${id}`),
    create:      (data)   => axiosClient.post('/vendors', data),
    update:      (id, data) => axiosClient.put(`/vendors/${id}`, data),
    remove:      (id)     => axiosClient.delete(`/vendors/${id}`),

    // Purchase Orders
    getAllPOs:       (params)     => axiosClient.get('/purchase-orders', { params }),
    getPOSummary:   ()           => axiosClient.get('/purchase-orders/summary'),
    getPOById:      (id)         => axiosClient.get(`/purchase-orders/${id}`),
    createPO:       (data)       => axiosClient.post('/purchase-orders', data),
    updatePO:       (id, data)   => axiosClient.put(`/purchase-orders/${id}`, data),
    deletePO:       (id)         => axiosClient.delete(`/purchase-orders/${id}`),
    updatePOStatus: (id, status) => axiosClient.post(`/purchase-orders/${id}/status`, { status }),

    // Vendor Payments
    getPayments:   (params) => axiosClient.get('/vendor-payments', { params }),
    createPayment: (data)   => axiosClient.post('/vendor-payments', data),
    deletePayment: (id)     => axiosClient.delete(`/vendor-payments/${id}`),
};

export default vendorService;
