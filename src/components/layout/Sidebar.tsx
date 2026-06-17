import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const navItems = [
  { path: '/', label: 'Pulpit', icon: <div className={styles.icon}>▣</div> },
  { path: '/library', label: 'Biblioteka', icon: <div className={styles.icon}>▤</div> },
  { path: '/analytics', label: 'Statystyki', icon: <div className={styles.icon}>▦</div> },
  { path: '/sessions/new', label: 'Dodaj sesję', icon: <div className={styles.icon}>＋</div> },
  { path: '/voice', label: 'Sesja głosowa', icon: <div className={styles.icon}>◉</div> },
  { path: '/trash', label: 'Kosz', icon: <div className={styles.icon}>🗑</div> },
  { path: '/settings', label: 'Ustawienia', icon: <div className={styles.icon}>⚙</div> },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.wordmark}>◈ GAMETRACE</div>
      <nav className={styles.nav}>
        {navItems.map(item => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
