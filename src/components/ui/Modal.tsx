import type { ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  role?: 'dialog' | 'alertdialog';
  children: ReactNode;
  /**
   * Extra class applied to the dialog box, appended after the base `.dialog`
   * styles. Use it to override `max-width` (the default is 420px) for
   * dialogs whose body needs more room, e.g. a scrollable candidate list.
   */
  className?: string;
}

export function Modal({ open, onClose, labelledBy, role = 'dialog', children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={[styles.dialog, className].filter(Boolean).join(' ')}
        onClick={(e) => e.stopPropagation()}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>
  );
}
