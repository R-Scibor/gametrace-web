import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  text?: string;
  message?: string;
  className?: string;
}

export function EmptyState({ text, message, className }: EmptyStateProps) {
  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')}>
      <div className={styles.text}>{message || text}</div>
    </div>
  );
}
