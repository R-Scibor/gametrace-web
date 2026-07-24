import { useCallback } from 'react';
import i18n, { setActiveLanguage } from '../i18n';
import { isLanguage, type Language } from '../i18n/resolve';
import { useUpdateSettings } from './useProfile';

export function useLanguage() {
  const updateSettings = useUpdateSettings();

  const select = useCallback(
    (lng: Language) => {
      const previous: Language = isLanguage(i18n.language) ? i18n.language : 'pl';
      if (lng === previous) return;
      setActiveLanguage(lng);
      updateSettings.mutate(
        { language: lng },
        { onError: () => setActiveLanguage(previous) },
      );
    },
    [updateSettings],
  );

  return { select, isPending: updateSettings.isPending };
}
