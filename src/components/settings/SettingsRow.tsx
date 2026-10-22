import styles from './SettingsRow.module.css';

interface SettingsRowProps {
  label: string;
  subtext?: string;
  /** Small status chip beside the label, e.g. a feature that is not live yet. */
  badge?: string;
  /** Escape hatch for rows that tint their label (e.g. the destructive one). */
  labelClassName?: string;
  children: React.ReactNode;
}

/** One label/subtext + control line inside a settings panel. */
export function SettingsRow({ label, subtext, badge, labelClassName, children }: SettingsRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.info}>
        <span className={styles.labelLine}>
          <span className={[styles.label, labelClassName].filter(Boolean).join(' ')}>{label}</span>
          {badge && <span className={styles.badge}>{badge}</span>}
        </span>
        {subtext && <span className={styles.subtext}>{subtext}</span>}
      </div>
      <div className={styles.control}>{children}</div>
    </div>
  );
}
