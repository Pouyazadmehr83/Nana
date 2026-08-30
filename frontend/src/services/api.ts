import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT Access Token ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401 ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/v1/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem('access_token', data.access);
          if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth Endpoints ──
export const authApi = {
  register: (data: { phone_number: string; password: string; password2: string; first_name?: string; last_name?: string; email?: string }) =>
    api.post('/auth/register/', data),

  login: (phone_number: string, password: string) =>
    api.post('/auth/token/', { phone_number, password }),

  logout: (refresh: string) =>
    api.post('/auth/token/blacklist/', { refresh }),

  getProfile: () => api.get('/auth/me/'),

  updateProfile: (data: Partial<{ first_name: string; last_name: string; email: string }>) =>
    api.patch('/auth/me/', data),
};

// ── Pet Report Endpoints ──
export const petsApi = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get('/pets/reports/', { params }),

  detail: (id: number) => api.get(`/pets/reports/${id}/`),

  create: (data: FormData) =>
    api.post('/pets/reports/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  update: (id: number, data: FormData) =>
    api.patch(`/pets/reports/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  delete: (id: number) => api.delete(`/pets/reports/${id}/`),

  myReports: (params?: Record<string, string | number>) =>
    api.get('/pets/reports/my_reports/', { params }),

  toggleResolved: (id: number) =>
    api.post(`/pets/reports/${id}/toggle_resolved/`),

  uploadImage: (id: number, formData: FormData) =>
    api.post(`/pets/reports/${id}/upload_image/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ── Sightings Endpoints ──
export const sightingsApi = {
  list: (reportId?: number) =>
    api.get('/pets/sightings/', { params: reportId ? { report: reportId } : {} }),

  create: (data: FormData) =>
    api.post('/pets/sightings/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
