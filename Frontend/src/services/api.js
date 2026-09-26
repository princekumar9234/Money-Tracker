import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('moneytrace_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const customError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'A network error occurred. Please try again.',
      errors: error.response?.data?.errors || [],
      isEmailVerified: error.response?.data?.isEmailVerified ?? true,
      email: error.response?.data?.email || null,
    };

    // If session expired (401), clear local auth state
    if (error.response?.status === 401) {
      localStorage.removeItem('moneytrace_token');
      localStorage.removeItem('moneytrace_user');
      // Only redirect if not already on an auth page
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login?expired=true';
      }
    }

    return Promise.reject(customError);
  }
);

export default api;
