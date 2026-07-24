import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resolveLanguage, type Language } from './resolve';

export const LANG_STORAGE_KEY = 'gt.lang';

export function getCachedLanguage(): string | null {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY);
  } catch {
    return null;
  }
}

// Auto-register every locale JSON so new namespaces need no edit here.
const localeModules = import.meta.glob<{ default: Record<string, unknown> }>(
  './locales/*/*.json',
  { eager: true },
);

const resources: Record<string, Record<string, Record<string, unknown>>> = {};
for (const path in localeModules) {
  const match = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
  if (!match) continue;
  const [, lng, ns] = match;
  resources[lng] ??= {};
  resources[lng][ns] = localeModules[path].default;
}

function setDocumentLang(lng: Language): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
}

const initialLanguage = resolveLanguage({
  cached: getCachedLanguage(),
  navigatorLanguage: typeof navigator !== 'undefined' ? navigator.language : null,
});

i18n.use(initReactI18next).init({
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: ['pl', 'en'],
  defaultNS: 'common',
  resources,
  interpolation: { escapeValue: false },
});

setDocumentLang(initialLanguage);

export function setActiveLanguage(lng: Language): void {
  void i18n.changeLanguage(lng);
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lng);
  } catch {
    /* ignore quota/availability errors */
  }
  setDocumentLang(lng);
}

export default i18n;
