import { useMemo } from 'react';
import { useProfile } from './useProfile';
import * as format from '../lib/format';

export function useFormat() {
  const { data: profile } = useProfile();
  const timeZone = profile?.timezone;

  return useMemo(
    () => ({
      formatDate: (iso: string) => format.formatDate(iso, { timeZone }),
      formatTimeShort: (iso: string) => format.formatTimeShort(iso, { timeZone }),
      formatDateShort: (iso: string) => format.formatDateShort(iso, { timeZone }),
      formatHeaderDate: () => format.formatHeaderDate({ timeZone }),
      formatDuration: format.formatDuration,
      formatHours: format.formatHours,
      formatDaysUntil: format.formatDaysUntil,
      formatRecency: format.formatRecency,
    }),
    [timeZone],
  );
}