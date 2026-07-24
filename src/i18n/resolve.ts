export type Language = 'pl' | 'en';

export const SUPPORTED_LANGUAGES: Language[] = ['pl', 'en'];

export function isLanguage(value: unknown): value is Language {
  return value === 'pl' || value === 'en';
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
