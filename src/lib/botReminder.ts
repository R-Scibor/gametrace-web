const PREFIX = 'gt.botReminder.shownOn.';

export function reminderStorageKey(discordId: string): string {
  return `${PREFIX}${discordId}`;
}

export function clearReminderDayKeys(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
}

/** YYYY-MM-DD in the given IANA zone. Falls back to the browser zone. */
export function todayInZone(timeZone: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  }
}

export function markReminderShown(discordId: string, timeZone: string, now = new Date()): void {
  localStorage.setItem(reminderStorageKey(discordId), todayInZone(timeZone, now));
}

export function reminderAlreadyShown(discordId: string, timeZone: string, now = new Date()): boolean {
  return localStorage.getItem(reminderStorageKey(discordId)) === todayInZone(timeZone, now);
}

export function snoozeUntilIso(now = Date.now()): string {
  return new Date(now + 7 * 86_400_000).toISOString().replace('Z', '+00:00');
}

export function shouldShowBotReminder(input: {
  botCanSeeUser: boolean | null;
  enabled: boolean;
  snoozedUntil: string | null;
  discordId: string;
  timeZone: string;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  if (input.botCanSeeUser !== false) return false;
  if (!input.enabled) return false;
  if (input.snoozedUntil) {
    const until = Date.parse(input.snoozedUntil);
    if (!Number.isNaN(until) && until > now.getTime()) return false;
  }
  if (reminderAlreadyShown(input.discordId, input.timeZone, now)) return false;
  return true;
}
