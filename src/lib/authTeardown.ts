import { useAuthStore } from '../store/authStore';
import { queryClient } from './queryClient';

/** Clear auth state and wipe all cached server data (401, logout). */
export function teardownAuth() {
  useAuthStore.getState().logout();
  queryClient.clear();
}