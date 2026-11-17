import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';
import {
  buildMonthMatrix,
  dayKey,
  daysInMonth,
  formatDayLabel,
  formatLocalValue,
  parseLocalValue,
  partsFromDate,
  shiftDay,
  toLocalValue,
  type LocalParts,
} from '../../lib/dateTime';
import styles from './DateTimePicker.module.css';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const pad2 = (n: number) => String(n).padStart(2, '0');

export interface DateTimePickerProps {
  /** Lands on the trigger button, so a `<label htmlFor>` names it. */
  id: string;
  /** `YYYY-MM-DDTHH:mm` wall-clock value, the same string a datetime-local input uses. Empty for none. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

/**
 * Date and time field that formats in the app language. The native
 * datetime-local input follows the browser locale instead, so an English
 * browser showed US month-first dates and AM/PM. Mirrors the mobile
 * DateTimeSheet: a Monday-first month grid plus hour and minute columns.
 */
export function DateTimePicker({ id, value, onChange, disabled, invalid, describedBy }: DateTimePickerProps) {
  const { t } = useTranslation('datetime');
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const label = formatLocalValue(value);

  return (
    <>
      <button
        type="button"
        id={id}
        className={styles.trigger}
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        data-value={value}
      >
        <span className={label ? undefined : styles.placeholder}>{label ?? t('placeholder')}</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} labelledBy={titleId} className={styles.dialog}>
        <h2 id={titleId} className={styles.title}>
          {t('title')}
        </h2>
        {/* Mounted fresh on each open so the draft re-seeds from the current value. */}
        <PickerBody
          value={value}
          onConfirm={(next) => {
            onChange(next);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}

function PickerBody({
  value,
  onConfirm,
  onCancel,
}: {
  value: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation('datetime');
  const seed = useMemo(() => parseLocalValue(value) ?? partsFromDate(new Date()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [draft, setDraft] = useState<LocalParts>(seed);
  const gridRef = useRef<HTMLDivElement>(null);
  const focusDay = useRef(false);

  const set = (patch: Partial<LocalParts>) =>
    setDraft((d) => {
      const next = { ...d, ...patch };
      next.day = Math.min(next.day, daysInMonth(next.year, next.month));
      return next;
    });

  const goMonth = (delta: number) => {
    const d = new Date(draft.year, draft.month + delta, 1);
    set({ year: d.getFullYear(), month: d.getMonth() });
  };

  // Modal focuses its first control on open. Hand focus to the picked day
  // instead, and keep it on the day while arrow keys move it.
  useEffect(() => {
    const id = setTimeout(() => gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus(), 0);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    if (!focusDay.current) return;
    focusDay.current = false;
    gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }, [draft.year, draft.month, draft.day]);

  const onGridKey = (e: KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    focusDay.current = true;
    set(shiftDay(draft.year, draft.month, draft.day, step));
  };

  const matrix = useMemo(() => buildMonthMatrix(draft.year, draft.month), [draft.year, draft.month]);
  const now = new Date();
  const todayKey = dayKey(now.getFullYear(), now.getMonth(), now.getDate());

  return (
    <>
      <div className={styles.monthNav}>
        <button type="button" className={styles.navButton} onClick={() => goMonth(-1)} aria-label={t('prevMonth')}>
          ‹
        </button>
        <span className={styles.monthLabel} aria-live="polite">
          {`${t(`months.${draft.month}`)} ${draft.year}`}
        </span>
        <button type="button" className={styles.navButton} onClick={() => goMonth(1)} aria-label={t('nextMonth')}>
          ›
        </button>
      </div>

      <div className={styles.grid} role="group" aria-label={t('dayLabel')} ref={gridRef} onKeyDown={onGridKey}>
        {WEEKDAY_KEYS.map((key) => (
          <span key={key} className={styles.weekday} aria-hidden="true">
            {t(`weekdays.${key}`)}
          </span>
        ))}
        {matrix.flat().map((d, i) => {
          if (d === null) return <span key={`e${i}`} />;
          const key = dayKey(draft.year, draft.month, d);
          const selected = d === draft.day;
          const cls = [styles.day, selected && styles.daySelected, !selected && key === todayKey && styles.dayToday]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={key}
              type="button"
              className={cls}
              data-date={key}
              tabIndex={selected ? 0 : -1}
              aria-pressed={selected}
              aria-label={formatDayLabel(draft.year, draft.month, d)}
              onClick={() => set({ day: d })}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div className={styles.divider} />
      <span className={styles.sectionLabel}>{t('timeLabel')}</span>
      <div className={styles.timeRow}>
        <TimeColumn label={t('hours')} values={HOURS} selected={draft.hours} onSelect={(hours) => set({ hours })} />
        <span className={styles.colon} aria-hidden="true">
          :
        </span>
        <TimeColumn
          label={t('minutes')}
          values={MINUTES}
          selected={draft.minutes}
          onSelect={(minutes) => set({ minutes })}
        />
      </div>
      <div className={styles.divider} />

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="button" onClick={() => onConfirm(toLocalValue(draft))}>
          {t('confirm')}
        </Button>
      </div>
    </>
  );
}

function TimeColumn({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const optionId = (v: number) => `${baseId}-${v}`;

  // Keep the picked value in the middle of the visible window.
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !item) return;
    list.scrollTop = item.offsetTop - list.clientHeight / 2 + item.clientHeight / 2;
  }, [selected]);

  const onKey = (e: KeyboardEvent) => {
    const last = values.length - 1;
    const i = values.indexOf(selected);
    const next = { ArrowUp: i - 1, ArrowDown: i + 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onSelect(values[Math.max(0, Math.min(last, next))]);
  };

  return (
    <ul
      ref={listRef}
      className={styles.column}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      aria-activedescendant={optionId(selected)}
      onKeyDown={onKey}
    >
      {values.map((v) => (
        <li
          key={v}
          id={optionId(v)}
          role="option"
          aria-selected={v === selected}
          className={v === selected ? `${styles.option} ${styles.optionSelected}` : styles.option}
          onClick={() => onSelect(v)}
        >
          {pad2(v)}
        </li>
      ))}
    </ul>
  );
}
