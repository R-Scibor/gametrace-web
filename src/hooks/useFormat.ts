import { useMemo } from 'react';
import * as format from '../lib/format';

export function useFormat() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return useMemo(
    () => ({
      formatDate: (iso: string) => format.formatDate(iso, { timeZone }),
      formatTimeShort: (iso: string) => format.formatTimeShort(iso, { timeZone }),
      formatDateShort: (iso: string) => format.formatDateShort(iso, { timeZone }),
      formatHeaderDate: () => format.formatHeaderDate({ timeZone }),
      formatDuration: format.formatDuration,
      formatHours: format.formatHours,
      formatDaysUntil: format.formatDaysUntil,
    }),
    [timeZone],
  );
}