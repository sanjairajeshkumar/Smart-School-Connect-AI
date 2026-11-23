import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://smart-school-connect-ai.onrender.com' : '');

const api = axios.create({
  baseURL: backendUrl ? `${backendUrl.replace(/\/$/, '')}/api` : '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('schoolconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      // localStorage.removeItem('schoolconnect_token');
      // localStorage.removeItem('schoolconnect_user');
    }
    return Promise.reject(error);
  }
);

export default api;
