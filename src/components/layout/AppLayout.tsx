import { Outlet } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useLanguageSync } from '../../hooks/useLanguageSync';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastViewport } from '../ui/Toast';
import styles from './AppLayout.module.css';

export function AppLayout() {
  useProfile();
  useLanguageSync();

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          {/* Shared full-bleed top wash — every authenticated page. */}
          <div className={styles.ambient} aria-hidden />
          <div className={styles.contentBody}>
            <Outlet />
          </div>
        </main>
      </div>
      <ToastViewport />
    </div>
  );
}