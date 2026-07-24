import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './AttentionTile.module.css';

interface AttentionTileProps {
  label: string;
  value: number;
  to: string;
}

export function AttentionTile({ label, value, to }: AttentionTileProps) {
  const { t } = useTranslation('admin');
  // Zero work means zero affordance: no link, no accent, nothing to click.
  if (value === 0) {
    return (
      <div className={`${styles.tile} ${styles.idle}`}>
        <span className={styles.value}>0</span>
        <span className={styles.label}>{label}</span>
      </div>
    );
  }

  return (
    <Link to={to} className={`${styles.tile} ${styles.active}`}>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.cta}>{t('overview.open')}</span>
    </Link>
  );
}
