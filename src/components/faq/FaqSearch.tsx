import { useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './FaqSearch.module.css';

interface FaqSearchProps {
  value: string;
  onChange: (value: string) => void;
  matchesCount?: number;
  totalCount?: number;
}

export function FaqSearch({
  value,
  onChange,
  matchesCount,
  totalCount,
}: FaqSearchProps) {
  const { t } = useTranslation('faq');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  const isSearching = Boolean(value.trim());

  return (
    <div className={styles.wrapper} role="search">
      <div className={styles.inputContainer}>
        <span className={styles.searchIcon} aria-hidden>
          <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchAria')}
          className={styles.input}
        />

        {value && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label={t('clearSearchAria')}
            title={t('clearSearchAria')}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {isSearching && matchesCount !== undefined && totalCount !== undefined && (
        <div className={styles.searchStatus} aria-live="polite">
          <span className={styles.statusBadge}>
            {t('searchMatches', { count: matchesCount, total: totalCount })}
          </span>
        </div>
      )}
    </div>
  );
}
