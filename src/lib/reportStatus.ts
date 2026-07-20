import type { ReportStatus } from '../types/api';

/**
 * Polish labels for report statuses. The API speaks English status codes; every
 * rendered surface must go through this map so the list rows and the filter
 * dropdown cannot drift apart.
 */
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Otwarte',
  triaged: 'Obsłużone',
  closed: 'Zamknięte',
};

export const REPORT_STATUS_OPTIONS: { value: ReportStatus; label: string }[] = (
  Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]
).map((value) => ({ value, label: REPORT_STATUS_LABELS[value] }));
