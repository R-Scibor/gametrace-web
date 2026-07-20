import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminRoute } from './components/AdminRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminReportsPlaceholder } from './pages/admin/AdminReportsPlaceholder';
import { Skeleton } from './components/ui';
import { LandingPage } from './pages/LandingPage';
import { DownloadPage } from './pages/DownloadPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { SessionFormPage } from './pages/SessionFormPage';
import { TrashPage } from './pages/TrashPage';
import { SettingsPage } from './pages/SettingsPage';

const GameDetailPage = lazy(() =>
  import('./pages/GameDetailPage').then(m => ({ default: m.GameDetailPage }))
);
const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage }))
);
const VoicePage = lazy(() =>
  import('./pages/VoicePage').then(m => ({ default: m.VoicePage }))
);
const AdminOverviewPage = lazy(() =>
  import('./pages/admin/AdminOverviewPage').then(m => ({ default: m.AdminOverviewPage }))
);
const AdminCatalogPage = lazy(() =>
  import('./pages/AdminCatalogPage').then(m => ({ default: m.AdminCatalogPage }))
);

function PageFallback() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton height={32} width="40%" />
      <Skeleton height={200} />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public — must stay outside ProtectedRoute (unauth → /welcome) */}
        <Route path="/welcome" element={<LandingPage />} />
        {/* Both forms: full-page /download is 302→/download/ in nginx; in-app links may use either */}
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/download/" element={<DownloadPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/library/:gameId" element={<GameDetailPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/sessions/new" element={<SessionFormPage />} />
            <Route path="/sessions/:id/edit" element={<SessionFormPage />} />
            <Route path="/voice" element={<VoicePage />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminOverviewPage />} />
                <Route path="/admin/reports" element={<AdminReportsPlaceholder />} />
                <Route path="/admin/catalog" element={<AdminCatalogPage />} />
              </Route>
            </Route>
          </Route>
        </Route>
        {/* Unmatched → home; ProtectedRoute sends unauth users to /welcome */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;