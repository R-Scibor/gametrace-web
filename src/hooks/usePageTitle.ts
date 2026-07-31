import { useTranslation } from 'react-i18next';

export interface PageTitle {
  eyebrow?: string;
  title: string;
}

const TITLE_KEYS: [test: (pathname: string) => boolean, key: string][] = [
  [(p) => p === '/', 'dashboard'],
  [(p) => p === '/library', 'library'],
  [(p) => p.startsWith('/library/'), 'gameDetail'],
  [(p) => p === '/analytics', 'analytics'],
  [(p) => p === '/sessions/new', 'addSession'],
  [(p) => p.startsWith('/sessions/') && p.endsWith('/edit'), 'editSession'],
  [(p) => p === '/voice', 'voice'],
  [(p) => p === '/trash', 'trash'],
  [(p) => p === '/admin', 'admin'],
  [(p) => p === '/admin/reports', 'adminReports'],
  [(p) => p === '/admin/catalog', 'adminCatalog'],
  [(p) => p === '/settings', 'settings'],
];

/**
 * A hook rather than a plain helper so the caller subscribes to language
 * changes: read through the i18n singleton instead and the heading keeps the
 * old language until some unrelated re-render happens to refresh it.
 */
export function usePageTitle(pathname: string): PageTitle | null {
  const { t } = useTranslation('common');
  const match = TITLE_KEYS.find(([test]) => test(pathname));
  if (!match) return null;
  return { title: t(`pageTitle.${match[1]}`) };
}
