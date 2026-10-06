import axiosClient from "../../../api/axiosClient";

const gstService = {
  getSummary:    (period) => axiosClient.get(`/gst/summary/${period}`),
  getGstr1:      (period) => axiosClient.get(`/gst/gstr1/${period}`),
  getGstr3b:     (period) => axiosClient.get(`/gst/gstr3b/${period}`),
  getHsnSummary: (period) => axiosClient.get(`/gst/hsn-summary/${period}`),
  getStates:     ()       => axiosClient.get("/gst/states"),
  getReturns:    (params) => axiosClient.get("/gst/returns", { params }),
  saveDraft:     (data)   => axiosClient.post("/gst/returns/draft", data),
  fileReturn:    (id)     => axiosClient.post(`/gst/returns/${id}/file`),
};

export default gstService;
