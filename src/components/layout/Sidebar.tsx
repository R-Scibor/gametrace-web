import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import styles from './Sidebar.module.css';

const mainNavItems = [
  { path: '/', label: 'Pulpit', icon: <div className={styles.icon}>▣</div> },
  { path: '/library', label: 'Biblioteka', icon: <div className={styles.icon}>▤</div> },
  { path: '/analytics', label: 'Statystyki', icon: <div className={styles.icon}>▦</div> },
  { path: '/sessions/new', label: 'Dodaj sesję', icon: <div className={styles.icon}>＋</div> },
  { path: '/voice', label: 'Sesja głosowa', icon: <div className={styles.icon}>◉</div> },
  { path: '/trash', label: 'Kosz', icon: <div className={styles.icon}>🗑</div> },
];

const bottomNavItems = [
  { path: '/settings', label: 'Ustawienia', icon: <div className={styles.icon}>⚙</div> },
];

function NavItem({ path, label, icon }: { path: string; label: string; icon: ReactNode }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) => [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const isAdmin = useAuthStore((s) => s.isAdmin);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.wordmark}>◈ GAMETRACE</div>
      <nav className={styles.nav}>
        {mainNavItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
        <div className={styles.divider} />
        {isAdmin && (
          <NavItem
            path="/admin"
            label="Administracja"
            icon={<div className={styles.icon}>◆</div>}
          />
        )}
        {bottomNavItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </nav>
    </aside>
  );
}
