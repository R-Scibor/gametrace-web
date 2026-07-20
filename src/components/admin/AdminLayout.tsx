import { NavLink, Outlet } from 'react-router-dom';
import { useAdminOverview } from '../../hooks/useAdminOverview';
import styles from './AdminLayout.module.css';

function tabClass({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.tab} ${styles.active}` : styles.tab;
}

export function AdminLayout() {
  const { data } = useAdminOverview();

  const reviewCount = data?.needs_review_count ?? 0;
  const reportsCount = data?.open_reports_count ?? 0;

  return (
    <div className={styles.container}>
      <nav className={styles.tabs}>
        <NavLink to="/admin" end className={tabClass}>
          Przegląd
        </NavLink>
        <NavLink to="/admin/reports" className={tabClass}>
          Zgłoszenia
          {reportsCount > 0 && <span className={styles.count}>{reportsCount}</span>}
        </NavLink>
        <NavLink to="/admin/catalog" className={tabClass}>
          Katalog
          {reviewCount > 0 && <span className={styles.count}>{reviewCount}</span>}
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
