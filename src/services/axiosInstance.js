import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY, REFRESH_KEY, USER_KEY } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  // The backend wraps every payload in an ApiResponse envelope:
  //   { success, message, data, timestamp }
  // Unwrap to `data` so callers receive the bare payload.
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      return body.data;
    }
    return body;
  },
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    const payload = error.response?.data;
    const message = payload?.message || error.message || 'Request failed';
    return Promise.reject(Object.assign(new Error(message), { status, payload }));
  }
);

export default api;
