import { useToastStore } from '../../store/toastStore';
import styles from './Toast.module.css';

export function ToastViewport() {
  const { toasts, dismissToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.viewport}>
      {toasts.map(toast => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`} onClick={() => dismissToast(toast.id)}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
