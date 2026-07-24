import type { EnrichmentStatus } from '../types/api';
import i18n from '../i18n';

/**
 * Runtime labels for catalog enrichment statuses so language switches re-resolve.
 * The API speaks English status codes; every rendered surface must go through
 * these helpers so the table, the filter dropdown, and the inspector cannot drift apart.
 */
export function enrichmentStatusLabel(status: EnrichmentStatus): string {
  return i18n.t(`admin:catalog.enrichment.${status}`);
}

/** Runtime map so existing `ENRICHMENT_STATUS_LABELS[status]` call sites re-resolve. */
export const ENRICHMENT_STATUS_LABELS: Record<EnrichmentStatus, string> = {
  get NEEDS_REVIEW() {
    return enrichmentStatusLabel('NEEDS_REVIEW');
  },
  get PENDING() {
    return enrichmentStatusLabel('PENDING');
  },
  get ENRICHED() {
    return enrichmentStatusLabel('ENRICHED');
  },
};

export function getEnrichmentStatusOptions(): { value: EnrichmentStatus | ''; label: string }[] {
  return [
    { value: '', label: i18n.t('admin:catalog.enrichment.all') },
    ...(Object.keys(ENRICHMENT_STATUS_LABELS) as EnrichmentStatus[]).map((value) => ({
      value,
      label: enrichmentStatusLabel(value),
    })),
  ];
}
