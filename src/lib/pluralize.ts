import i18n from '../i18n';

/**
 * Plural label for sessions via i18next (`common:sessions`).
 *
 * Count forms live in the catalogs (`sessions_one` / `_few` / `_many` for Polish,
 * `_one` / `_other` for English); i18next selects between them with `Intl.PluralRules`.
 */
export function sessionsLabel(count: number): string {
  return i18n.t('common:sessions', { count });
}
