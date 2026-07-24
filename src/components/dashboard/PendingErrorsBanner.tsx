import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PendingErrorEntry } from '../../types/api';
import styles from './PendingErrorsBanner.module.css';

interface PendingErrorsBannerProps {
  errors: PendingErrorEntry[];
}

export function PendingErrorsBanner({ errors }: PendingErrorsBannerProps) {
  const { t } = useTranslation('dashboard');
  const first = errors[0];
  const count = errors.length;
  const title =
    count === 1 ? t('errors.one') : t('errors.many', { count });

  return (
    <Link to={`/sessions/${first.id}/edit`} className={styles.banner}>
      <span className={styles.icon}>⚠</span>
      <div className={styles.body}>
        <span className={styles.title}>{title}</span>
        <span className={styles.sub}>{t('errors.sub')}</span>
      </div>
      <span className={styles.action}>{t('errors.fix')}</span>
    </Link>
  );
}