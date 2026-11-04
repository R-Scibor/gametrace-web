import { useTranslation } from 'react-i18next';
import type { Language } from '../../i18n/resolve';
import styles from './LanguageSelect.module.css';

export interface LanguageSelectProps {
  value: Language;
  onChange: (lng: Language) => void;
  disabled?: boolean;
  'aria-label'?: string;
  variant?: 'select' | 'segmented';
  className?: string;
}

// Native language names are shown in their own language, so they are not translated.
const OPTIONS: { value: Language; label: string }[] = [
  { value: 'pl', label: 'Polski' },
  { value: 'en', label: 'English' },
];

const SEGMENTS: { value: Language; label: string; fullLabel: string }[] = [
  { value: 'pl', label: 'PL', fullLabel: 'Polski' },
  { value: 'en', label: 'EN', fullLabel: 'English' },
];

export function LanguageSelect({
  value,
  onChange,
  disabled,
  'aria-label': ariaLabel,
  variant = 'select',
  className,
}: LanguageSelectProps) {
  const { t } = useTranslation('common');
  const label = ariaLabel ?? t('language.label');

  if (variant === 'segmented') {
    return (
      <div
        role="group"
        aria-label={label}
        className={[styles.segmented, className].filter(Boolean).join(' ')}
      >
        {SEGMENTS.map((seg) => {
          const isActive = value === seg.value;
          return (
            <button
              key={seg.value}
              type="button"
              className={[
                styles.segmentBtn,
                isActive ? styles.segmentBtnActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={isActive}
              aria-label={seg.fullLabel}
              onClick={() => onChange(seg.value)}
              disabled={disabled}
            >
              {seg.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Language)}
      className={[styles.select, className].filter(Boolean).join(' ')}
      disabled={disabled}
      aria-label={label}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
