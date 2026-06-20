import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { GameDetailPage } from './pages/GameDetailPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/:gameId" element={<GameDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;