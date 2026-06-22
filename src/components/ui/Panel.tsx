import React from 'react';
import styles from './Panel.module.css';

export interface PanelProps {
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Panel({ title, eyebrow, headerExtra, children, className }: PanelProps) {
  const hasHeader = title || eyebrow || headerExtra;

  return (
    <div className={[styles.panel, className].filter(Boolean).join(' ')}>
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
            {title && <h3 className={styles.title}>{title}</h3>}
          </div>
          {headerExtra && <div className={styles.headerExtra}>{headerExtra}</div>}
        </div>
      )}
      {children}
    </div>
  );
}