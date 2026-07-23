import { Link } from 'react-router-dom';
import styles from './SampleDataBanner.module.css';

export interface SampleDataBannerProps {
  className?: string;
}

export function SampleDataBanner({ className }: SampleDataBannerProps) {
  return (
    <div className={[styles.banner, className].filter(Boolean).join(' ')}>
      <div className={styles.bar} />
      <div className={styles.body}>
        <span className={styles.tag}>PODGLĄD</span>
        <span className={styles.text}>
          To są przykładowe dane — dodaj sesję, aby zobaczyć swoje statystyki.
        </span>
      </div>
      <Link to="/sessions/new" className={styles.cta}>
        <span>Dodaj sesję</span>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </Link>
    </div>
  );
}
