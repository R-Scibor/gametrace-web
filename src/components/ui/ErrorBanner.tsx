import { useTranslation } from 'react-i18next';
import styles from './ErrorBanner.module.css';

export interface ErrorBannerProps {
  message?: string;
  label?: string;
  className?: string;
}

export function ErrorBanner({
  message,
  label,
  className
}: ErrorBannerProps) {
  const { t } = useTranslation('common');
  const resolvedLabel = label ?? t('errors.connectionLabel');
  const resolvedMessage = message ?? t('errors.connectionMessage');

  return (
    <div role="alert" className={[styles.container, className].filter(Boolean).join(' ')}>
      <div className={styles.bar} />
      <div className={styles.body}>
        <div className={styles.label}>{resolvedLabel}</div>
        <div className={styles.message}>{resolvedMessage}</div>
      </div>
    </div>
  );
}
