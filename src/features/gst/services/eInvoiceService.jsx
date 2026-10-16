import axiosClient from '../../../api/axiosClient';

const eInvoiceService = {
    downloadEWayBillJson: (invoiceId, params = {}) =>
        axiosClient.get(`/invoices/${invoiceId}/eway-bill/json`, {
            params,
            responseType: 'blob',
        }),

    saveEWayBill: (invoiceId, data) =>
        axiosClient.post(`/invoices/${invoiceId}/eway-bill`, data),

    downloadEInvoiceJson: (invoiceId) =>
        axiosClient.get(`/invoices/${invoiceId}/einvoice/json`, {
            responseType: 'blob',
        }),

    generateIrn: (invoiceId) =>
        axiosClient.post(`/invoices/${invoiceId}/einvoice/generate-irn`),

    cancelIrn: (invoiceId, reason = '1') =>
        axiosClient.post(`/invoices/${invoiceId}/einvoice/cancel-irn`, { reason }),
};

export default eInvoiceService;