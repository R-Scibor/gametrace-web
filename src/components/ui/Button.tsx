import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export function Button({ variant = 'primary', loading, disabled, children, className, ...props }: ButtonProps) {
  const { t } = useTranslation('common');
  const cn = [
    styles.button,
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={cn} disabled={disabled || loading} {...props}>
      {loading ? t('actions.loading') : children}
    </button>
  );
}
