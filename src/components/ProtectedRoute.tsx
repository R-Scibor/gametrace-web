import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * The single authoritative gate. Order matters: an unauthenticated user goes to
 * /welcome even if a stale pendingDeletion is persisted. While pendingDeletion
 * is set, the app shell is unreachable — every authed route 403s during the
 * grace period, so rendering it would fire a storm of failing queries.
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pendingDeletion = useAuthStore((s) => s.pendingDeletion);

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  if (pendingDeletion) {
    return <Navigate to="/account/pending-deletion" replace />;
  }

  return <Outlet />;
}
