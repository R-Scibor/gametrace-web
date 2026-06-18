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