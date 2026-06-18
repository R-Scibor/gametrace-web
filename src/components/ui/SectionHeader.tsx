import styles from './SectionHeader.module.css';

export interface SectionHeaderProps {
  label?: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function SectionHeader({ label, title, className, style }: SectionHeaderProps) {
  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')} style={style}>
      <div className={styles.label}>{title || label}</div>
      <div className={styles.rule} />
    </div>
  );
}
