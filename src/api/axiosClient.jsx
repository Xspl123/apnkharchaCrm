import axios from "axios";

const axiosClient = axios.create({
<<<<<<< HEAD
    baseURL: "http://localhost/api/",
=======
    baseURL: "https://apnakharcha.in/ExpTlaravel-main/public/api/",
>>>>>>> f81c650 (Initial commit)
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor (For adding auth token if needed)
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor (For handling errors globally)
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default axiosClient;
