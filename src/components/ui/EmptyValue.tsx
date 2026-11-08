import { EMPTY_VALUE } from '../../lib/format';
import styles from './EmptyValue.module.css';

export interface EmptyValueProps {
  className?: string;
  ariaLabel?: string;
}

export function EmptyValue({ className, ariaLabel = 'Brak danych' }: EmptyValueProps) {
  return (
    <span
      className={[styles.emptyValue, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
    >
      {EMPTY_VALUE}
    </span>
  );
}
