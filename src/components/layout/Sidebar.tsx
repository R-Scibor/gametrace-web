import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { useIsAccountEmpty } from '../../hooks/useIsAccountEmpty';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Switch } from '../ui/Switch';
import styles from './Sidebar.module.css';

const icon = (paths: ReactNode) => (
  <span className={styles.icon}>
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths}
    </svg>
  </span>
);

const DashboardIcon = icon(
  <>
    <rect x="3" y="3" width="7" height="18" rx="1" />
    <rect x="14" y="3" width="7" height="8" rx="1" />
    <rect x="14" y="15" width="7" height="6" rx="1" />
  </>,
);

const LibraryIcon = icon(
  <>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </>,
);

const AnalyticsIcon = icon(
  <>
    <path d="M4 4v15a1 1 0 0 0 1 1h15" />
    <path d="M8 16v-4" />
    <path d="M12 16V8" />
    <path d="M16 16v-6" />
  </>,
);

const AddIcon = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </>,
);

const VoiceIcon = icon(
  <>
    <rect x="9" y="3" width="6" height="10" rx="3" />
    <path d="M6 11a6 6 0 0 0 12 0" />
    <line x1="12" y1="17" x2="12" y2="20.5" />
    <line x1="9" y1="20.5" x2="15" y2="20.5" />
  </>,
);

const TrashIcon = icon(
  <>
    <path d="M4 7h16" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
  </>,
);

const AdminIcon = icon(
  <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3Z" />,
);

const SettingsIcon = icon(
  <>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H2a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.4-1.1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H8a1.6 1.6 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z" />
  </>,
);

const LogoutIcon = icon(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </>,
);

const mainNavDefs = [
  { path: '/', labelKey: 'nav.dashboard' as const, icon: DashboardIcon },
  { path: '/library', labelKey: 'nav.library' as const, icon: LibraryIcon },
  { path: '/analytics', labelKey: 'nav.analytics' as const, icon: AnalyticsIcon },
  { path: '/sessions/new', labelKey: 'nav.addSession' as const, icon: AddIcon },
  { path: '/voice', labelKey: 'nav.voice' as const, icon: VoiceIcon },
  { path: '/trash', labelKey: 'nav.trash' as const, icon: TrashIcon },
];

const bottomNavDefs = [{ path: '/settings', labelKey: 'nav.settings' as const, icon: SettingsIcon }];

function NavItem({ path, label, icon }: { path: string; label: string; icon: ReactNode }) {
  return (
    <NavLink
      to={path}
      end={path === '/'}
      className={({ isActive }) => [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')}
    >
      {icon}
      <span className={styles.label}>{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const { t } = useTranslation('common');
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const previewDismissed = useAuthStore((s) => s.previewDismissed);
  const setPreviewDismissed = useAuthStore((s) => s.setPreviewDismissed);
  const { isEmpty: showPreviewToggle } = useIsAccountEmpty();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLogoutLoading(false);
      setLogoutOpen(false);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <Link to="/welcome" className={styles.brand} aria-label={t('nav.homeAria')}>
        <img src="/splash-icon.png" alt="" className={styles.logoMark} width={64} height={64} />
        <span className={styles.wordmark}>GAMETRACE</span>
      </Link>
      <nav className={styles.nav}>
        {mainNavDefs.map((item) => (
          <NavItem key={item.path} path={item.path} label={t(item.labelKey)} icon={item.icon} />
        ))}
        <div className={styles.divider} />
        {isAdmin && <NavItem path="/admin" label={t('nav.admin')} icon={AdminIcon} />}
        {bottomNavDefs.map((item) => (
          <NavItem key={item.path} path={item.path} label={t(item.labelKey)} icon={item.icon} />
        ))}
      </nav>
      <div className={styles.footer}>
        {showPreviewToggle && (
          <div className={styles.previewRow}>
            <span className={styles.label}>{t('nav.preview')}</span>
            <Switch
              id="preview-toggle"
              checked={!previewDismissed}
              label={t('nav.preview')}
              onChange={(checked) => setPreviewDismissed(!checked)}
            />
          </div>
        )}
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={() => setLogoutOpen(true)}
          aria-label={t('nav.logoutAria')}
        >
          {LogoutIcon}
          <span className={styles.label}>{t('nav.logout')}</span>
        </button>
      </div>
      <ConfirmDialog
        open={logoutOpen}
        title={t('actions.logoutTitle')}
        message={t('logout.message')}
        confirmLabel={t('actions.logoutConfirm')}
        variant="danger"
        loading={logoutLoading}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutOpen(false)}
      />
    </aside>
  );
}
