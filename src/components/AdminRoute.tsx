import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProfile } from '../hooks/useProfile';

export function AdminRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: profile, isPending } = useProfile();

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  // The persisted isAdmin flag is only an optimistic hint for the sidebar, so
  // access is gated on the profile query instead. Redirecting before it lands
  // would bounce admins off their page.
  if (isPending) {
    return null;
  }

  if (!profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}