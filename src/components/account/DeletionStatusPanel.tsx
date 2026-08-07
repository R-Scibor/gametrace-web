import { useTranslation } from 'react-i18next';
import { formatDateOnly } from '../../lib/format';
import type { DeletionStatus } from '../../types/api';
import styles from './DeletionStatusPanel.module.css';

/**
 * Shared by the post-request landing and the blocking cancel screen. Both are
 * reachable without a loaded profile, so this formats with the browser locale
 * rather than `useFormat` — that hook depends on `useProfile`, which would fire
 * an authed request these screens must not make.
 */
export function DeletionStatusPanel({ status }: { status: DeletionStatus }) {
  const { t } = useTranslation('account');

  return (
    <div className={styles.panel}>
      <div className={styles.item}>
        <p className={styles.label}>{t('status.purgeLabel')}</p>
        <p className={styles.value}>
          {t('status.purgeValue', { date: formatDateOnly(status.purge_at) })}
        </p>
      </div>
      <div className={styles.item}>
        <p className={styles.label}>{t('status.daysLeftLabel')}</p>
        <p className={styles.value}>{t('status.daysLeft', { count: status.days_left })}</p>
      </div>
      <p className={styles.note}>{t('status.purgeNote')}</p>
    </div>
  );
}
