import { NavLink } from 'react-router-dom';
import styles from './AdminSubNav.module.css';

export function AdminSubNav() {
  return (
    <nav className={styles.nav} aria-label="Sekcje administracji">
      <NavLink
        to="/admin"
        end
        className={({ isActive }) => [styles.tab, isActive ? styles.active : ''].filter(Boolean).join(' ')}
      >
        Operacje
      </NavLink>
      <NavLink
        to="/admin/catalog"
        className={({ isActive }) => [styles.tab, isActive ? styles.active : ''].filter(Boolean).join(' ')}
      >
        Katalog
      </NavLink>
    </nav>
  );
}