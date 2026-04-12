/**
 * ============================================================
 * API Utility — Axios Instance with JWT Auto-Attach
 * ============================================================
 *
 * Creates a pre-configured Axios instance that:
 *   1. Bases all requests to /api (proxied to Express backend)
 *   2. Automatically attaches the JWT from localStorage
 *   3. Intercepts 401 responses to trigger logout
 * ============================================================
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

/**
 * Request interceptor:
 * Attaches the Bearer token to every outgoing request
 * if one exists in localStorage.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor:
 * If the server returns 401 (expired/invalid token),
 * clear stored auth data and redirect to login.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if not already on login/register page
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
