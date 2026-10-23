import {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
  useId,
  type KeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import styles from './TimezoneSelect.module.css';

const FALLBACK_ZONES = [
  'UTC',
  'Europe/Warsaw', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Madrid', 'Europe/Rome', 'Europe/Moscow', 'Europe/Istanbul',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'America/Mexico_City', 'America/Sao_Paulo', 'America/Buenos_Aires',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore', 'Asia/Seoul', 'Asia/Bangkok', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Jakarta',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth',
  'Pacific/Auckland',
  'Africa/Cairo', 'Africa/Johannesburg',
];

function getAllTimezones(): string[] {
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    if (typeof fn === 'function') {
      return fn('timeZone').slice().sort();
    }
  } catch {
    // Intl unavailable or throws
  }
  return FALLBACK_ZONES.slice().sort();
}

const ALL_TIMEZONES = getAllTimezones();

function zoneLabel(zone: string): string {
  return zone.replace(/_/g, ' ');
}

function matches(zone: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return zone.toLowerCase().includes(needle) || zoneLabel(zone).toLowerCase().includes(needle);
}

interface TimezoneSelectProps {
  value: string;
  onChange: (tz: string) => void;
  disabled?: boolean;
  'aria-label'?: string;
  id?: string;
}

export function TimezoneSelect({
  value,
  onChange,
  disabled,
  'aria-label': ariaLabel,
  id: propId,
}: TimezoneSelectProps) {
  const { t } = useTranslation(['settings', 'common']);
  const autoId = useId();
  const baseId = propId ?? autoId;
  const listId = `${baseId}-listbox`;
  const optionDomId = useCallback(
    (zone: string) => `${baseId}-opt-${zone.replace(/\//g, '-')}`,
    [baseId]
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const wasOpenRef = useRef(false);

  const trimmed = query.trim();

  const zones = useMemo(() => {
    if (!trimmed) {
      if (value && !FALLBACK_ZONES.includes(value)) {
        return [value, ...FALLBACK_ZONES];
      }
      return FALLBACK_ZONES;
    }
    return ALL_TIMEZONES.filter((zone) => matches(zone, trimmed));
  }, [trimmed, value]);

  // Focus chip on close
  useEffect(() => {
    if (wasOpenRef.current && !open) {
      chipRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  // Click outside listener
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
        setActiveKey(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // Scroll active keyboard item into view
  useEffect(() => {
    if (!activeKey) return;
    const domId = optionDomId(activeKey);
    const el = document.getElementById(domId);
    if (!el || !listRef.current?.contains(el)) return;
    el.scrollIntoView?.({ block: 'nearest' });
  }, [activeKey, optionDomId]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setActiveKey(null);
  };

  const choose = (zone: string) => {
    if (zone !== value) {
      onChange(zone);
    }
    close();
  };

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setActiveKey(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = zones.findIndex((z) => z === activeKey);
      const nextIndex = Math.min(currentIndex + 1, zones.length - 1);
      setActiveKey(zones[nextIndex] ?? null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = zones.findIndex((z) => z === activeKey);
      const nextIndex = Math.max(currentIndex - 1, -1);
      setActiveKey(nextIndex >= 0 ? zones[nextIndex] ?? null : null);
    } else if (e.key === 'Enter') {
      if (activeKey) {
        e.preventDefault();
        choose(activeKey);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      close();
    }
  };

  const displayAriaLabel = ariaLabel ?? t('common:timezone.ariaLabel');

  if (!open) {
    return (
      <div className={styles.root} ref={rootRef}>
        <button
          type="button"
          id={baseId}
          ref={chipRef}
          className={styles.chip}
          onClick={handleOpen}
          disabled={disabled}
          aria-label={displayAriaLabel}
        >
          <span className={styles.chipRule} aria-hidden />
          <span className={styles.chipName}>{zoneLabel(value)}</span>
          <span className={styles.chipAction}>{t('settings:timezonePicker.change')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.searchWrapper}>
        <input
          ref={inputRef}
          autoFocus
          type="text"
          className={styles.input}
          placeholder={t('settings:timezonePicker.search')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveKey(null);
          }}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            if (rootRef.current?.contains(e.relatedTarget as Node)) return;
            close();
          }}
          role="combobox"
          aria-expanded={true}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeKey ? optionDomId(activeKey) : undefined}
          aria-label={displayAriaLabel}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>

      <div className={styles.dropdown}>
        <ul id={listId} ref={listRef} className={styles.list} role="listbox" aria-label={displayAriaLabel}>
          {!trimmed && (
            <li role="presentation">
              <span
                role="group"
                aria-label={t('settings:timezonePicker.groupCommon')}
                className={styles.groupHeader}
              >
                {t('settings:timezonePicker.groupCommon')}
              </span>
            </li>
          )}
          {zones.map((zone) => {
            const isSelected = zone === value;
            const isActive = zone === activeKey;
            return (
              <li
                key={zone}
                id={optionDomId(zone)}
                role="option"
                aria-selected={isSelected}
                className={[
                  styles.row,
                  isActive && styles.rowActive,
                  isSelected && styles.rowSelected,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(zone);
                }}
                onMouseEnter={() => setActiveKey(zone)}
              >
                <span className={styles.rowText}>{zoneLabel(zone)}</span>
                {isSelected && (
                  <span className={styles.check} aria-hidden>
                    ✓
                  </span>
                )}
              </li>
            );
          })}
          {trimmed.length > 0 && zones.length === 0 && (
            <li role="status" aria-live="polite" className={styles.empty}>
              {t('settings:timezonePicker.noResults')}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
