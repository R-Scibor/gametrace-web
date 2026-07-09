export const ANALYTICS_DAY_PRESETS = [7, 30, 90, 365, 0] as const;
export type AnalyticsDays = (typeof ANALYTICS_DAY_PRESETS)[number];

export const DEFAULT_ANALYTICS_DAYS: AnalyticsDays = 7;

export function parseAnalyticsDays(value: string | null): AnalyticsDays {
  if (value == null || value === '') return DEFAULT_ANALYTICS_DAYS;
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_ANALYTICS_DAYS;
  return (ANALYTICS_DAY_PRESETS as readonly number[]).includes(n) ? (n as AnalyticsDays) : DEFAULT_ANALYTICS_DAYS;
}

export function analyticsPeriodPillLabel(days: AnalyticsDays): string {
  return days === 0 ? 'MAX' : `${days} DNI`;
}