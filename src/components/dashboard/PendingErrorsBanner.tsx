import { Link } from 'react-router-dom';
import type { PendingErrorEntry } from '../../types/api';
import styles from './PendingErrorsBanner.module.css';

interface PendingErrorsBannerProps {
  errors: PendingErrorEntry[];
}

export function PendingErrorsBanner({ errors }: PendingErrorsBannerProps) {
  const first = errors[0];
  const count = errors.length;
  const title =
    count === 1
      ? '1 nieudana sesja wymaga uwagi'
      : `${count} nieudane sesje wymagają uwagi`;

  return (
    <Link to={`/sessions/${first.id}/edit`} className={styles.banner}>
      <span className={styles.icon}>⚠</span>
      <div className={styles.body}>
        <span className={styles.title}>{title}</span>
        <span className={styles.sub}>Bot mógł zostawić otwarte sesje</span>
      </div>
      <span className={styles.action}>NAPRAW →</span>
    </Link>
  );
}