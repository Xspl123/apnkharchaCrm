import axios from "axios";
import { API_BASE_URL } from "../../../config/apiConfig";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const gstService = {
  getSummary:    (period) => API.get(`/gst/summary/${period}`),
  getGstr1:      (period) => API.get(`/gst/gstr1/${period}`),
  getGstr3b:     (period) => API.get(`/gst/gstr3b/${period}`),
  getHsnSummary: (period) => API.get(`/gst/hsn-summary/${period}`),
  getStates:     ()       => API.get("/gst/states"),
  getReturns:    (params) => API.get("/gst/returns", { params }),
  saveDraft:     (data)   => API.post("/gst/returns/draft", data),
  fileReturn:    (id)     => API.post(`/gst/returns/${id}/file`),
};

export default gstService;
