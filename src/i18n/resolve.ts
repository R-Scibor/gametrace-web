export type Language = 'pl' | 'en';

export const SUPPORTED_LANGUAGES: Language[] = ['pl', 'en'];

/**
 * BCP-47 tags for `Intl` (dates, times, collation).
 *
 * English maps to `en-GB` rather than `en-US` so the day-first date order and
 * 24-hour clock match the Polish layout — the UI is built around fixed-width
 * terse labels, and `en-US` would flip these to `MM/DD` and 12-hour `AM/PM`.
 */
const INTL_LOCALE: Record<Language, string> = {
  pl: 'pl-PL',
  en: 'en-GB',
};

export function isLanguage(value: unknown): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

/** BCP-47 tag for a language, falling back to English for unknown input. */
export function intlLocale(language: unknown): string {
  return INTL_LOCALE[isLanguage(language) ? language : 'en'];
}

export function resolveLanguage(input: {
  profileLanguage?: string | null;
  cached?: string | null;
  navigatorLanguage?: string | null;
}): Language {
  const { profileLanguage, cached, navigatorLanguage } = input;
  if (isLanguage(profileLanguage)) return profileLanguage;
  if (isLanguage(cached)) return cached;
  if ((navigatorLanguage ?? '').toLowerCase().startsWith('pl')) return 'pl';
  return 'en';
}
