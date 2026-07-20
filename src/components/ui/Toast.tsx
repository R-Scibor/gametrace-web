import { Link } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import styles from './Toast.module.css';

export function ToastViewport() {
  const { toasts, dismissToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.viewport} aria-live="polite" aria-atomic="true">
      {toasts.map(toast => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`} onClick={() => dismissToast(toast.id)}>
          <span>{toast.message}</span>
          {toast.action && (
            <Link
              to={toast.action.to}
              className={styles.action}
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
            >
              {toast.action.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
