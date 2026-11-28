import { useEffect, type Ref } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../hooks/usePageTitle';
import { BotStatusPill } from './BotStatusPill';
import { ActiveSessionPill } from './ActiveSessionPill';
import styles from './TopBar.module.css';

interface TopBarProps {
  /** Burger button for the mobile nav drawer. Not rendered when `onMenuClick` is absent. */
  onMenuClick?: () => void;
  menuOpen?: boolean;
  menuControls?: string;
  menuButtonRef?: Ref<HTMLButtonElement>;
}

const BurgerIcon = (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden
  >
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);

export function TopBar({
  onMenuClick,
  menuOpen = false,
  menuControls,
  menuButtonRef,
}: TopBarProps = {}) {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  const page = usePageTitle(pathname);
  const title = page?.title;

  // The browser tab names the current view, e.g. "Library | GameTrace".
  useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = `${title} | GameTrace`;
    return () => {
      document.title = prev;
    };
  }, [title]);

  return (
    <header className={styles.topbar}>
      {onMenuClick && (
        <button
          type="button"
          ref={menuButtonRef}
          className={styles.menuBtn}
          onClick={onMenuClick}
          aria-label={t('nav.openMenu')}
          aria-expanded={menuOpen}
          aria-controls={menuControls}
        >
          {BurgerIcon}
        </button>
      )}
      <div className={styles.titleBlock}>
        {page?.eyebrow && <span className={styles.eyebrow}>{page.eyebrow}</span>}
        {page?.title && <h1 className={styles.title}>{page.title}</h1>}
      </div>
      <div className={styles.right}>
        <ActiveSessionPill />
        <BotStatusPill />
      </div>
    </header>
  );
}