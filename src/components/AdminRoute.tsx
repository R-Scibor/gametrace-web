import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProfile } from '../hooks/useProfile';

export function AdminRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: profile, isPending } = useProfile();

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  // isAdmin is never persisted, so after a refresh it is unknown until the
  // profile lands. Redirecting before then would bounce admins off their page.
  if (isPending) {
    return null;
  }

  if (!profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}