import i18n from '../i18n';

export interface PageTitle {
  eyebrow?: string;
  title: string;
}

export function getPageTitle(pathname: string): PageTitle | null {
  if (pathname === '/') return { title: i18n.t('common:pageTitle.dashboard') };
  if (pathname === '/library') return { title: i18n.t('common:pageTitle.library') };
  if (pathname.startsWith('/library/')) return { title: i18n.t('common:pageTitle.gameDetail') };
  if (pathname === '/analytics') return { title: i18n.t('common:pageTitle.analytics') };
  if (pathname === '/sessions/new') return { title: i18n.t('common:pageTitle.addSession') };
  if (pathname.startsWith('/sessions/') && pathname.endsWith('/edit')) {
    return { title: i18n.t('common:pageTitle.editSession') };
  }
  if (pathname === '/voice') return { title: i18n.t('common:pageTitle.voice') };
  if (pathname === '/trash') return { title: i18n.t('common:pageTitle.trash') };
  if (pathname === '/admin') return { title: i18n.t('common:pageTitle.admin') };
  if (pathname === '/admin/catalog') return { title: i18n.t('common:pageTitle.adminCatalog') };
  if (pathname === '/settings') return { title: i18n.t('common:pageTitle.settings') };
  return null;
}
