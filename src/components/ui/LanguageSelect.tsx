import type { Language } from '../../i18n/resolve';
import styles from './LanguageSelect.module.css';

interface LanguageSelectProps {
  value: Language;
  onChange: (lng: Language) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

// Native language names are shown in their own language, so they are not translated.
const OPTIONS: { value: Language; label: string }[] = [
  { value: 'pl', label: 'Polski' },
  { value: 'en', label: 'English' },
];

export function LanguageSelect({
  value,
  onChange,
  disabled,
  'aria-label': ariaLabel = 'Język',
}: LanguageSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Language)}
      className={styles.select}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
