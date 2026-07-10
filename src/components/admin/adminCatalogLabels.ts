import type { EnrichmentStatus } from '../../types/api';

export const ADMIN_STATUS_LABELS: Record<EnrichmentStatus, string> = {
  ENRICHED: 'Wzbogacona',
  NEEDS_REVIEW: 'Do sprawdzenia',
  PENDING: 'Oczekuje',
};

export const ADMIN_STATUS_OPTIONS: { value: EnrichmentStatus; label: string }[] = [
  { value: 'NEEDS_REVIEW', label: 'Do sprawdzenia' },
  { value: 'PENDING', label: 'Oczekuje' },
  { value: 'ENRICHED', label: 'Wzbogacona' },
];