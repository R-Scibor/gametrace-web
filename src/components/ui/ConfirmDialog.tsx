import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'POTWIERDŹ',
  cancelLabel = 'ANULUJ',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} labelledBy="confirm-title" role="alertdialog">
      <h2 id="confirm-title" className={styles.title}>
        {title}
      </h2>
      <div className={styles.message}>{message}</div>
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="primary"
          className={variant === 'danger' ? styles.dangerConfirm : undefined}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}