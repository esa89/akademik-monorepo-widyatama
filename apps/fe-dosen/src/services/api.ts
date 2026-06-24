import axios from 'axios';

export const akademikApi = axios.create({
  baseURL: import.meta.env.VITE_API_AKADEMIK_URL || 'http://localhost:3015/api',
  headers: { 'Content-Type': 'application/json' },
});

export const obeApi = axios.create({
  baseURL: import.meta.env.VITE_API_OBE_URL || 'http://localhost:3014/api',
  headers: { 'Content-Type': 'application/json' },
});
