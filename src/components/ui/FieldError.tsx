import type { ReactNode } from 'react';
import styles from './FieldError.module.css';

export interface FieldErrorProps {
  id?: string;
  className?: string;
  children: ReactNode;
}

export function FieldError({ id, className, children }: FieldErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className={[styles.fieldError, className].filter(Boolean).join(' ')}
    >
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.icon}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {children}
    </p>
  );
}
