import axios from 'axios';
import toast from 'react-hot-toast';

const configuredApiUrl = import.meta.env.VITE_API_URL;
const apiBaseUrl = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/+$/, '')}${configuredApiUrl.replace(/\/+$/, '').endsWith('/api') ? '' : '/api'}`
  : (import.meta.env.DEV ? 'http://localhost:5001/api' : '/api');

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

// Request Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    if (['post', 'put', 'delete'].includes(response.config.method) && response.data.message) {
      toast.success(response.data.message);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Refresh Token Logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, {
            headers: { 'Authorization': `Bearer ${refreshToken}` }
          });
          const { access_token } = res.data;
          localStorage.setItem('token', access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (err) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }

    const errorMessage = error.response?.data?.message || error.message || "Server Error";
    if (error.response?.status === 429) {
      toast.error("Too many requests. Please wait.");
    } else if (error.response?.status !== 401) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api;
