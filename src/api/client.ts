import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { teardownAuth } from '../lib/authTeardown';

const client = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: {
    indexes: null,
  },
});

client.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      teardownAuth();
    }
    return Promise.reject(error);
  },
);

export default client;