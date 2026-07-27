import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfile } from './useProfile';
import * as format from '../lib/format';

export function useFormat() {
  const { data: profile } = useProfile();
  const timeZone = profile?.timezone;
  // Subscribe to language changes so consumers re-render on a switch. The memo needs
  // no language dependency: `lib/format` resolves the active locale on every call, so
  // re-invoking these functions after a re-render is enough to re-format.
  useTranslation();

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
      formatSessionWindow: (startIso: string, endIso: string | null) =>
        format.formatSessionWindow(startIso, endIso, { timeZone }),
    }),
    [timeZone],
  );
}