import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './SampleDataBanner.module.css';

export interface SampleDataBannerProps {
  className?: string;
  onDismiss?: () => void;
}

export function SampleDataBanner({ className, onDismiss }: SampleDataBannerProps) {
  const { t } = useTranslation('common');

  return (
    <div className={[styles.banner, className].filter(Boolean).join(' ')}>
      <div className={styles.bar} />
      <div className={styles.body}>
        <span className={styles.tag}>{t('sampleData.tag')}</span>
        <span className={styles.text}>{t('sampleData.text')}</span>
      </div>
      <Link to="/sessions/new" className={styles.cta}>
        <span>{t('sampleData.cta')}</span>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </Link>
      {onDismiss && (
        <button
          type="button"
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label={t('sampleData.dismissAria')}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}
