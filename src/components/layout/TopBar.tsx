import { useLocation } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { BotStatusPill } from './BotStatusPill';
import { ActiveSessionPill } from './ActiveSessionPill';
import styles from './TopBar.module.css';

export function TopBar() {
  const { pathname } = useLocation();
  const page = usePageTitle(pathname);

  return (
    <header className={styles.topbar}>
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