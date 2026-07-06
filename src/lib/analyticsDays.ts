export const ANALYTICS_DAY_PRESETS = [7, 30, 90, 365] as const;
export type AnalyticsDays = (typeof ANALYTICS_DAY_PRESETS)[number];

export const DEFAULT_ANALYTICS_DAYS: AnalyticsDays = 7;

export function parseAnalyticsDays(value: string | null): AnalyticsDays {
  const n = Number(value);
  return (ANALYTICS_DAY_PRESETS as readonly number[]).includes(n) ? (n as AnalyticsDays) : DEFAULT_ANALYTICS_DAYS;
}