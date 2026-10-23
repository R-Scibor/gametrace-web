import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { getMergeCandidates } from '../api/games';
import { submitReport } from '../api/reports';
import { qk } from '../lib/queryKeys';
import type { SubmitReportPayload } from '../types/api';

export const MERGE_CANDIDATES_DEBOUNCE_MS = 300;

/** Debounce non-empty values; an empty value applies immediately (initial load / cleared search). */
function useDebouncedQuery(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), value ? delay : 0);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Games that could be a duplicate of `sourceId`, searched by `query` (trimmed, debounced). */
export function useMergeCandidates(
  sourceId: number,
  query: string,
  locale: string,
  options?: { enabled?: boolean },
) {
  const q = useDebouncedQuery(query.trim(), MERGE_CANDIDATES_DEBOUNCE_MS);
  return useQuery({
    queryKey: qk.mergeCandidates(sourceId, q, locale),
    queryFn: () => getMergeCandidates(sourceId, locale, q || undefined),
    enabled: options?.enabled,
    placeholderData: keepPreviousData,
  });
}

export function useSubmitReport() {
  return useMutation({
    mutationFn: ({ message, context }: SubmitReportPayload) => submitReport(message, context),
  });
}
