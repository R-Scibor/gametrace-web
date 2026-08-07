import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { teardownAuth } from '../lib/authTeardown';
import { pendingDeletionFromError } from '../lib/accountDeletion';

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

const isAuthEndpoint = (url?: string) =>
  !!url && /^\/auth\/(?:link|login|logout|discord)(?:\?|$)/.test(url);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuthEndpoint(error.config?.url)) {
      teardownAuth();
    }

    // Safety net for a grace-period token whose pendingDeletion flag was never
    // written or was cleared (stale persisted store, tab open across a failed
    // cancel). Not the multi-device path — that one is a 401, handled above.
    const pending = pendingDeletionFromError(error);
    if (pending) {
      useAuthStore.getState().setPendingDeletion(pending);
    }

    return Promise.reject(error);
  },
);

export default client;