import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/**
 * Dark-theme text input. Mirrors the Select primitive, with one deliberate
 * difference: the label wrapper is only rendered when a visible `label` is
 * passed. Callers that label via `aria-label` get a bare <input>, so layout
 * properties they set on it (flex, width) keep applying to the element that is
 * actually the flex child.
 */
export function Input({ label, className, id, ...props }: InputProps) {
  const inputId = id ?? (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  const input = (
    <input
      id={inputId}
      className={[styles.input, className].filter(Boolean).join(' ')}
      {...props}
    />
  );

  if (!label) return input;

  return (
    <div className={styles.wrapper}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      {input}
    </div>
  );
}
