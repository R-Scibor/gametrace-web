import type { EnrichmentStatus } from '../types/api';

/**
 * Polish labels for catalog enrichment statuses. The API speaks English status
 * codes; every rendered surface must go through this map so the table, the
 * filter dropdown, and the inspector cannot drift apart.
 */
export const ENRICHMENT_STATUS_LABELS: Record<EnrichmentStatus, string> = {
  NEEDS_REVIEW: 'Do sprawdzenia',
  PENDING: 'Oczekuje',
  ENRICHED: 'Wzbogacona',
};

export const ENRICHMENT_STATUS_OPTIONS: { value: EnrichmentStatus | ''; label: string }[] = [
  { value: '', label: 'Wszystkie' },
  ...(Object.keys(ENRICHMENT_STATUS_LABELS) as EnrichmentStatus[]).map((value) => ({
    value,
    label: ENRICHMENT_STATUS_LABELS[value],
  })),
];
