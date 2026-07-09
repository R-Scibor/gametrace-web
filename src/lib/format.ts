export interface FormatOptions {
  timeZone?: string;
}

const LOCALE = 'pl-PL';

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
  return new Date(iso).toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: options?.timeZone,
  });
}

export function formatTimeShort(iso: string, options?: FormatOptions): string {
  return new Date(iso).toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: options?.timeZone,
  });
}

export function formatDateShort(iso: string, options?: FormatOptions): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: 'short',
    timeZone: options?.timeZone,
  });
}

export function formatHeaderDate(options?: FormatOptions): string {
  return new Date()
    .toLocaleDateString(LOCALE, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      timeZone: options?.timeZone,
    })
    .toUpperCase();
}

export function formatDaysUntil(iso: string): string {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return 'wkrótce';
  if (days === 1) return '1 dzień';
  return `${days} dni`;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function formatRecency(iso: string): string {
  const then = new Date(iso);
  const days = Math.round((startOfDay(new Date()) - startOfDay(then)) / 86_400_000);
  if (days <= 0) return 'grano dziś';
  if (days === 1) return 'grano wczoraj';
  if (days < 7) return `grano ${days} dni temu`;
  return `grano ${then.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' })}`;
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
  return days === 0 ? 'w całym okresie' : `w ciągu ostatnich ${days} dni`;
}

export function analyticsPeriodLabel(days: number): string {
  return days === 0 ? 'Cały okres' : `Ostatnie ${days} dni`;
}