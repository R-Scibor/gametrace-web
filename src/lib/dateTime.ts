import i18n from '../i18n';
import { intlLocale } from '../i18n/resolve';

/** Wall-clock parts of a `YYYY-MM-DDTHH:mm` value. `month` is 0-based like `Date`. */
export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
}

const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

const pad2 = (n: number) => String(n).padStart(2, '0');

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Parses the same `YYYY-MM-DDTHH:mm` string a native datetime-local input uses. */
export function parseLocalValue(value: string): LocalParts | null {
  const m = LOCAL_RE.exec(value);
  if (!m) return null;
  const parts = {
    year: Number(m[1]),
    month: Number(m[2]) - 1,
    day: Number(m[3]),
    hours: Number(m[4]),
    minutes: Number(m[5]),
  };
  if (parts.month < 0 || parts.month > 11) return null;
  if (parts.day < 1 || parts.day > daysInMonth(parts.year, parts.month)) return null;
  if (parts.hours > 23 || parts.minutes > 59) return null;
  return parts;
}

export function toLocalValue(p: LocalParts): string {
  return `${p.year}-${pad2(p.month + 1)}-${pad2(p.day)}T${pad2(p.hours)}:${pad2(p.minutes)}`;
}

export function partsFromDate(d: Date): LocalParts {
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
  };
}

/** `YYYY-MM-DD` key for one calendar day. */
export function dayKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

/**
 * Monday-first weeks for one month. Each row has 7 cells, `null` outside the
 * month. Same shape as the mobile sheet's grid.
 */
export function buildMonthMatrix(year: number, month: number): (number | null)[][] {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = daysInMonth(year, month);
  const cells: (number | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/** Moves a day by `delta` days, crossing month and year edges. */
export function shiftDay(year: number, month: number, day: number, delta: number) {
  const d = new Date(year, month, day + delta);
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

/** The field label, in the app language rather than the browser's, e.g. "17 lis 2026, 20:54". */
export function formatLocalValue(value: string): string | null {
  const p = parseLocalValue(value);
  if (!p) return null;
  return new Date(p.year, p.month, p.day, p.hours, p.minutes).toLocaleString(intlLocale(i18n.language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Full spoken date for a day button, e.g. "17 listopada 2026". */
export function formatDayLabel(year: number, month: number, day: number): string {
  return new Date(year, month, day).toLocaleDateString(intlLocale(i18n.language), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
