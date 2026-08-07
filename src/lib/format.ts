import i18n from '../i18n';
import { intlLocale } from '../i18n/resolve';

export interface FormatOptions {
  timeZone?: string;
}

/**
 * Resolved per call rather than captured at module load, so a language switch
 * applies to dates already on screen without reloading.
 */
const locale = () => intlLocale(i18n.language);

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatHours(seconds: number): string {
  return (seconds / 3600).toFixed(1);
}

export function formatDate(iso: string, options?: FormatOptions): string {
  return new Date(iso).toLocaleString(locale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: options?.timeZone,
  });
}

/** Date without time — for purge dates, where the exact minute is misleading
 *  (the purge sweep runs nightly, so deletion lands on or shortly after). */
export function formatDateOnly(iso: string, options?: FormatOptions): string {
  return new Date(iso).toLocaleDateString(locale(), {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: options?.timeZone,
  });
}

export function formatTimeShort(iso: string, options?: FormatOptions): string {
  return new Date(iso).toLocaleTimeString(locale(), {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: options?.timeZone,
  });
}

export function formatDateShort(iso: string, options?: FormatOptions): string {
  return new Date(iso).toLocaleDateString(locale(), {
    day: '2-digit',
    month: 'short',
    timeZone: options?.timeZone,
  });
}

export function formatHeaderDate(options?: FormatOptions): string {
  return new Date()
    .toLocaleDateString(locale(), {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      timeZone: options?.timeZone,
    })
    .toUpperCase();
}

/** Whole days from now until `iso`, rounded up (NaN for an unparseable date).
 *  Shared by the countdown label below and by `daysLeftUntil` in accountDeletion. */
export function daysUntil(iso: string): number {
  return Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000);
}

export function formatDaysUntil(iso: string): string {
  const days = daysUntil(iso);
  if (days <= 0) return i18n.t('common:relative.soon');
  if (days === 1) return i18n.t('common:relative.oneDay');
  return i18n.t('common:relative.days', { days });
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function formatRecency(iso: string): string {
  const then = new Date(iso);
  const days = Math.round((startOfDay(new Date()) - startOfDay(then)) / 86_400_000);
  if (days <= 0) return i18n.t('common:recency.today');
  if (days === 1) return i18n.t('common:recency.yesterday');
  if (days < 7) return i18n.t('common:recency.daysAgo', { days });
  return i18n.t('common:recency.onDate', {
    date: then.toLocaleDateString(locale(), { day: '2-digit', month: 'short' }),
  });
}

export function formatSessionWindow(
  startIso: string,
  endIso: string | null,
  options?: FormatOptions,
): string {
  const startDate = formatDateShort(startIso, options);
  const startTime = formatTimeShort(startIso, options);
  if (!endIso) return `${startDate}, ${startTime} → —`;
  const endDate = formatDateShort(endIso, options);
  const endTime = formatTimeShort(endIso, options);
  if (startDate === endDate) return `${startDate}, ${startTime} → ${endTime}`;
  return `${startDate}, ${startTime} → ${endDate}, ${endTime}`;
}

export function formatPeriodDelta(total: number, previous: number): string | null {
  if (previous <= 0) return null;
  const delta = (total - previous) / previous;
  const up = delta >= 0;
  return `${up ? '↑' : '↓'}${Math.abs(Math.round(delta * 100))}%`;
}

export function formatAnalyticsPeriodSubtitle(days: number): string {
  return days === 0
    ? i18n.t('analytics:period.subtitleAll')
    : i18n.t('analytics:period.subtitleDays', { days });
}
