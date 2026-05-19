import axios from 'axios';
import { authRef } from './auth-ref';

export const obeApi = axios.create({
  baseURL: import.meta.env.VITE_API_OBE_URL || 'http://localhost:3014/api',
  headers: { 'Content-Type': 'application/json' },
});

export const akademikApi = axios.create({
  baseURL: import.meta.env.VITE_API_AKADEMIK_URL || 'http://localhost:3015/api',
  headers: { 'Content-Type': 'application/json' },
});

const attachInterceptors = (instance: axios.AxiosInstance) => {
  instance.interceptors.request.use((config) => {
    const token = authRef.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        authRef.logout().catch(() => {});
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );
};

attachInterceptors(obeApi);
attachInterceptors(akademikApi);
