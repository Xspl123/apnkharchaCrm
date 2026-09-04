import axiosClient from '../../../api/axiosClient';

const inventoryService = {
    // Categories
    getCategories:      ()          => axiosClient.get('/product-categories'),
    createCategory:     (data)      => axiosClient.post('/product-categories', data),
    updateCategory:     (id, data)  => axiosClient.put(`/product-categories/${id}`, data),
    deleteCategory:     (id)        => axiosClient.delete(`/product-categories/${id}`),

    // Products
    getProducts:        (params)    => axiosClient.get('/products', { params }),
    getProductById:     (id)        => axiosClient.get(`/products/${id}`),
    getProductSummary:  ()          => axiosClient.get('/products/summary'),
    getLowStock:        ()          => axiosClient.get('/products/low-stock'),
    createProduct:      (data)      => axiosClient.post('/products', data),
    updateProduct:      (id, data)  => axiosClient.put(`/products/${id}`, data),
    deleteProduct:      (id)        => axiosClient.delete(`/products/${id}`),

    // Stock Movements
    getMovements:       (params)    => axiosClient.get('/stock-movements', { params }),
    getMovementsByProduct: (id, params) => axiosClient.get(`/stock-movements/by-product/${id}`, { params }),
    getReport:          (params)    => axiosClient.get('/stock-movements/report', { params }),
    createMovement:     (data)      => axiosClient.post('/stock-movements', data),
    deleteMovement:     (id)        => axiosClient.delete(`/stock-movements/${id}`),
};

export default inventoryService;
