import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './SampleDataBanner.module.css';

export interface SampleDataBannerProps {
  className?: string;
  onDismiss?: () => void;
}

export function SampleDataBanner({ className, onDismiss }: SampleDataBannerProps) {
  const { t } = useTranslation('common');
  const tag = t('sampleData.tag');

  return (
    <div className={[styles.banner, className].filter(Boolean).join(' ')}>
      <div className={styles.bar} />
      <div className={styles.body}>
        <span className={styles.tag} aria-label={tag}>
          <span className={styles.tagTrack}>
            <span className={styles.tagSegment}>
              <span className={styles.tagText}>{tag}</span>
              <span className={styles.tagSep} aria-hidden="true">
                ◆
              </span>
            </span>
            <span className={styles.tagSegment} aria-hidden="true">
              <span className={styles.tagText}>{tag}</span>
              <span className={styles.tagSep}>◆</span>
            </span>
            <span className={styles.tagSegment} aria-hidden="true">
              <span className={styles.tagText}>{tag}</span>
              <span className={styles.tagSep}>◆</span>
            </span>
            <span className={styles.tagSegment} aria-hidden="true">
              <span className={styles.tagText}>{tag}</span>
              <span className={styles.tagSep}>◆</span>
            </span>
          </span>
        </span>
        <span className={styles.text}>{t('sampleData.text')}</span>
      </div>
      <div className={styles.actions}>
        <Link to="/sessions/new" className={styles.cta}>
          <span>{t('sampleData.cta')}</span>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
        </Link>
        {onDismiss && (
          <button type="button" className={styles.dismiss} onClick={onDismiss}>
            {t('sampleData.dismiss')}
          </button>
        )}
      </div>
    </div>
  );
}
