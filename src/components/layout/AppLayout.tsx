import { useEffect, useId, useRef, useState } from 'react';
import type React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProfile } from '../../hooks/useProfile';
import { useLanguageSync } from '../../hooks/useLanguageSync';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastViewport } from '../ui/Toast';
import { BotVisibilityReminder } from '../auth/BotVisibilityReminder';
import styles from './AppLayout.module.css';

// Matches the narrow-screen breakpoint used by the other layouts (768px).
const DESKTOP_QUERY = '(min-width: 769px)';

export function AppLayout() {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  const navId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  // The drawer is open for the path it was opened on, so any route change closes it.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const navOpen = openedAt === pathname;
  useProfile();
  useLanguageSync();

  const closeNav = () => setOpenedAt(null);

  // Esc closes the drawer, unless a dialog (for example the logout confirm) is
  // open on top of it: that dialog handles Esc itself.
  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      setOpenedAt(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);

  // Lock page scroll behind the drawer.
  useEffect(() => {
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [navOpen]);

  // Growing past the breakpoint (rotating a tablet) shows the permanent sidebar, so drop the drawer state.
  useEffect(() => {
    if (!navOpen || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpenedAt(null);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [navOpen]);

  // Hand focus back to the burger after the drawer closes.
  useEffect(() => {
    if (wasOpenRef.current && !navOpen) menuButtonRef.current?.focus();
    wasOpenRef.current = navOpen;
  }, [navOpen]);

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
      <Sidebar id={navId} open={navOpen} onClose={closeNav} />
      {navOpen && <div className={styles.backdrop} onClick={closeNav} aria-hidden />}
      <div
        className={navOpen ? `${styles.main} ${styles.mainLocked}` : styles.main}
        inert={navOpen}
      >
        <TopBar
          onMenuClick={() => setOpenedAt(pathname)}
          menuOpen={navOpen}
          menuControls={navId}
          menuButtonRef={menuButtonRef}
        />
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