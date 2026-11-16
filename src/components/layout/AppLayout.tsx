import type React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProfile } from '../../hooks/useProfile';
import { useLanguageSync } from '../../hooks/useLanguageSync';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastViewport } from '../ui/Toast';
import { BotVisibilityReminder } from '../auth/BotVisibilityReminder';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const { t } = useTranslation('common');
  useProfile();
  useLanguageSync();

  const handleSkipToContent = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = document.getElementById('main-content');
    if (main) {
      main.focus();
      main.scrollIntoView?.();
    }
  };

  return (
    <div className={styles.layout}>
      <a
        href="#main-content"
        className={styles.skipLink}
        onClick={handleSkipToContent}
      >
        {t('a11y.skipToContent')}
      </a>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main id="main-content" tabIndex={-1} className={styles.content}>
          {/* Shared full-bleed top wash — every authenticated page. */}
          <div className={styles.ambient} aria-hidden />
          <div className={styles.contentBody}>
            <Outlet />
          </div>
        </main>
      </div>
      <ToastViewport />
      <BotVisibilityReminder />
    </div>
  );
}