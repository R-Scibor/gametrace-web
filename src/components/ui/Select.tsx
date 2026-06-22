import styles from './Select.module.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className, children, id, ...props }: SelectProps) {
  const selectId = id ?? (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={[styles.select, className].filter(Boolean).join(' ')}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}