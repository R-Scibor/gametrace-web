import styles from './Switch.module.css';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, id, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={[styles.track, checked ? styles.checked : ''].filter(Boolean).join(' ')}
      onClick={() => {
        if (disabled) return;
        onChange(!checked);
      }}
    >
      <span className={styles.thumb} />
    </button>
  );
}
