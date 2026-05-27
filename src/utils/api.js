import axios from 'axios';

const normalizeBaseUrl = (value) => {
  const fallback = 'http://localhost:5000/api';
  const rawValue = (value || '').trim();

  if (!rawValue) {
    return fallback;
  }

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue.replace(/\/+$/, '');
  }

  if (rawValue.startsWith('//')) {
    return `${window.location.protocol}${rawValue}`.replace(/\/+$/, '');
  }

  if (rawValue.startsWith(':')) {
    return `${window.location.protocol}//${window.location.hostname}${rawValue}`.replace(/\/+$/, '');
  }

  if (rawValue.startsWith('/')) {
    return `${window.location.origin}${rawValue}`.replace(/\/+$/, '');
  }

  return `https://${rawValue}`.replace(/\/+$/, '');
};

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL),
  timeout: 30000,
  withCredentials: true,
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Add interceptor to inject adminToken into every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || config.__isRetryRequest) {
      return Promise.reject(error);
    }

    const shouldRetry = !error.response &&
      ['ECONNABORTED', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ERR_NETWORK'].includes(error.code);

    if (shouldRetry) {
      config.__retryCount = config.__retryCount || 0;
      if (config.__retryCount < 2) {
        config.__retryCount += 1;
        config.__isRetryRequest = true;
        await delay(500 * config.__retryCount);
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
