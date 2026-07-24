import type { ReportStatus } from '../types/api';
import i18n from '../i18n';

/**
 * Runtime labels for report statuses so language switches re-resolve.
 * The API speaks English status codes; every rendered surface must go through
 * these helpers so the list rows and the filter dropdown cannot drift apart.
 */
export function reportStatusLabel(status: ReportStatus): string {
  return i18n.t(`admin:reports.status.${status}`);
}

/** Runtime map so existing `REPORT_STATUS_LABELS[status]` call sites re-resolve. */
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  get open() {
    return reportStatusLabel('open');
  },
  get triaged() {
    return reportStatusLabel('triaged');
  },
  get closed() {
    return reportStatusLabel('closed');
  },
};

export function getReportStatusOptions(): { value: ReportStatus; label: string }[] {
  return (['open', 'triaged', 'closed'] as ReportStatus[]).map((value) => ({
    value,
    label: reportStatusLabel(value),
  }));
}
