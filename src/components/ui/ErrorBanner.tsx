import styles from './ErrorBanner.module.css';

export interface ErrorBannerProps {
  message?: string;
  label?: string;
  className?: string;
}

export function ErrorBanner({
  message = 'Nie udało się pobrać danych. Sprawdź połączenie.',
  label = 'BŁĄD POŁĄCZENIA',
  className
}: ErrorBannerProps) {
  return (
    <div role="alert" className={[styles.container, className].filter(Boolean).join(' ')}>
      <div className={styles.bar} />
      <div className={styles.body}>
        <div className={styles.label}>{label}</div>
        <div className={styles.message}>{message}</div>
      </div>
    </div>
  );
}
