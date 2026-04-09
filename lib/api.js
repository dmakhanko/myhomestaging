import axios from "axios";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://fursova-staging-production.up.railway.app";

const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API_BASE });

export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
};

export const admin = {
  status: () => api.get("/admin/status"),
  bootstrap: (payload) => api.post("/admin/bootstrap", payload),
  login: (payload) => api.post("/admin/login", payload),
  changePassword: (payload) => api.post("/admin/change-password", payload),
  getContent: () => api.get("/admin/content"),
  putContent: (payload) => api.put("/admin/content", payload),
  patchContent: (payload) => api.patch("/admin/content", payload),
  uploadHero: (file) => {
    const fd = new FormData(); fd.append("file", file);
    return api.post("/admin/upload/hero", fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  uploadPortfolioBefore: (index, file) => {
    const fd = new FormData(); fd.append("file", file);
    return api.post(`/admin/upload/portfolio/${index}/before`, fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  uploadPortfolioAfter: (index, file) => {
    const fd = new FormData(); fd.append("file", file);
    return api.post(`/admin/upload/portfolio/${index}/after`, fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  uploadMedia: (file) => {
    const fd = new FormData(); fd.append("file", file);
    return api.post("/admin/upload/media", fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
};

export const leadsApi = {
  create: (data) => api.post("/leads", data),
  getAll: () => api.get("/leads"),
};
