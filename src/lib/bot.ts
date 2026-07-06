export function formatUptime(s: number | null): string {
  if (s == null) return '—';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const BOT_STATUS_LABEL: Record<string, string> = {
  online: 'ONLINE',
  offline: 'OFFLINE',
  unknown: 'NIEZNANY',
};

export function formatBotStatus(status: string): string {
  return BOT_STATUS_LABEL[status] ?? status.toUpperCase();
}

export function botColor(status: string) {
  if (status === 'online') return 'var(--orange)';
  if (status === 'offline') return 'var(--warn)';
  return 'var(--text3)';
}
