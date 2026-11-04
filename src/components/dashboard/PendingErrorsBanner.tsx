import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PendingErrorEntry } from '../../types/api';
import styles from './PendingErrorsBanner.module.css';

interface PendingErrorsBannerProps {
  errors: PendingErrorEntry[];
}

const AlertIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export function PendingErrorsBanner({ errors }: PendingErrorsBannerProps) {
  const { t } = useTranslation('dashboard');
  const first = errors[0];
  const count = errors.length;
  const title = t('errors.count', { count });

  return (
    <Link to={`/sessions/${first.id}/edit`} className={styles.banner}>
      <span className={styles.icon}>
        <AlertIcon />
      </span>
      <div className={styles.body}>
        <span className={styles.title}>{title}</span>
        <span className={styles.sub}>{t('errors.sub')}</span>
      </div>
      <span className={styles.action}>{t('errors.fix')}</span>
    </Link>
  );
}