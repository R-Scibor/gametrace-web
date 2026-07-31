import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './AttentionTile.module.css';

interface AttentionTileProps {
  label: string;
  value: number;
  to: string;
  /** Shown under the label when value is zero (empty-queue copy). */
  idleMessage?: string;
  /** Larger control-room tiles for the overview hero. */
  size?: 'default' | 'hero';
}

export function AttentionTile({
  label,
  value,
  to,
  idleMessage,
  size = 'default',
}: AttentionTileProps) {
  const { t } = useTranslation('admin');
  const sizeClass = size === 'hero' ? styles.hero : '';

  // Zero work means zero affordance: no link, no accent, nothing to click.
  if (value === 0) {
    return (
      <div className={`${styles.tile} ${styles.idle} ${sizeClass}`.trim()}>
        <span className={styles.value}>0</span>
        <span className={styles.label}>{label}</span>
        {idleMessage && <span className={styles.idleMessage}>{idleMessage}</span>}
      </div>
    );
  }

  return (
    <Link to={to} className={`${styles.tile} ${styles.active} ${sizeClass}`.trim()}>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.cta}>{t('overview.open')}</span>
    </Link>
  );
}
