import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import styles from './ErrorBanner.module.css';

export interface ErrorBannerProps {
  message?: string;
  label?: string;
  className?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorBanner({
  message,
  label,
  className,
  onRetry,
  retryLabel,
}: ErrorBannerProps) {
  const { t } = useTranslation('common');
  const resolvedLabel = label ?? t('errors.connectionLabel');
  const resolvedMessage = message ?? t('errors.connectionMessage');
  const resolvedRetryLabel = retryLabel ?? t('errors.retry');

  return (
    <div role="alert" className={[styles.container, className].filter(Boolean).join(' ')}>
      <div className={styles.bar} />
      <div className={styles.body}>
        <div className={styles.label}>{resolvedLabel}</div>
        <div className={styles.message}>{resolvedMessage}</div>
      </div>
      {onRetry && (
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onRetry}
            className={styles.retryButton}
          >
            {resolvedRetryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
