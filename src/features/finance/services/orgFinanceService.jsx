import axiosClient from '../../../api/axiosClient';

const orgFinanceService = {
    // Org Accounts Master
    getAccounts:        (params) => axiosClient.get('/org-accounts', { params }),
    getAccountSummary:  ()       => axiosClient.get('/org-accounts/summary'),
    getAccountById:     (id)     => axiosClient.get(`/org-accounts/${id}`),
    createAccount:      (data)   => axiosClient.post('/org-accounts', data),
    updateAccount:      (id, data) => axiosClient.put(`/org-accounts/${id}`, data),
    deleteAccount:      (id)     => axiosClient.delete(`/org-accounts/${id}`),

    // Org Transactions & Cash-Bank Book
    getTransactions:    (params) => axiosClient.get('/org-transactions', { params }),
    getCashflowSummary: (params) => axiosClient.get('/org-transactions/cashflow', { params }),
    createTransaction:  (data)   => axiosClient.post('/org-transactions', data),

    // Dynamic Categories Master
    getCategories:      (params) => axiosClient.get('/org-categories', { params }),
    createCategory:     (data)   => axiosClient.post('/org-categories', data),
    deleteCategory:     (id)     => axiosClient.delete(`/org-categories/${id}`),
};

export default orgFinanceService;