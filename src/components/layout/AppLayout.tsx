import { Outlet } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastViewport } from '../ui/Toast';
import styles from './AppLayout.module.css';

export function AppLayout() {
  useProfile();

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <ToastViewport />
    </div>
  );
}