import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export function Button({ variant = 'primary', loading, disabled, children, className, ...props }: ButtonProps) {
  const cn = [
    styles.button,
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={cn} disabled={disabled || loading} {...props}>
      {loading ? 'ŁADOWANIE...' : children}
    </button>
  );
}
