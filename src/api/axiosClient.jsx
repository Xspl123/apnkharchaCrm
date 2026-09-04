import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";
import { notifySessionExpired } from "./authSession";
import { getErrorMessage } from "../utils/getErrorMessage";

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        error.normalizedMessage = getErrorMessage(error);
        const status = error.response?.status;
        const requestUrl = error.config?.url || "";

        if (
            status === 401 &&
            !requestUrl.includes("/login") &&
            !requestUrl.includes("/register") &&
            !requestUrl.includes("/verify-otp")
        ) {
            notifySessionExpired();
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
