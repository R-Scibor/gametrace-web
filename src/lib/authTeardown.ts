import { useAuthStore } from '../store/authStore';
import { queryClient } from './queryClient';

let suspended = false;

/**
 * Suspends automatic auth teardown until `resumeAuthTeardown`. For flows that
 * revoke the token server-side themselves and own the navigation that follows:
 * in that window every in-flight authed request 401s by design, and letting the
 * response interceptor tear down would redirect out of the flow mid-navigation.
 * The flow is responsible for resuming, and for tearing down itself.
 */
export function suspendAuthTeardown(): void {
  suspended = true;
}

export function resumeAuthTeardown(): void {
  suspended = false;
}

export function isAuthTeardownSuspended(): boolean {
  return suspended;
}

/** Clear auth state and wipe all cached server data (401, logout). */
export function teardownAuth() {
  useAuthStore.getState().logout();
  queryClient.clear();
}
