import axios from 'axios';
import { tokenStorage } from '../lib/token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Global Axios instance configured with base URL and interceptors.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach Bearer token to outgoing /api/* requests
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch HTTP 401 Unauthorized (expired/invalid JWT) -> clear token & redirect
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      tokenStorage.clear();
      // Only redirect if not already on /login or /signup
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);
