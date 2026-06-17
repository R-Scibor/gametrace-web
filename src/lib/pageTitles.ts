export interface PageTitle {
  eyebrow?: string;
  title: string;
}

export function getPageTitle(pathname: string): PageTitle | null {
  if (pathname === '/') return { eyebrow: '◈ GAMETRACE', title: 'Pulpit' };
  if (pathname === '/library') return { title: 'Biblioteka' };
  if (pathname.startsWith('/library/')) return { title: 'Szczegóły gry' };
  if (pathname === '/analytics') return { title: 'Statystyki' };
  if (pathname === '/sessions/new') return { title: 'Dodaj sesję' };
  if (pathname.startsWith('/sessions/') && pathname.endsWith('/edit')) return { title: 'Edytuj sesję' };
  if (pathname === '/voice') return { title: 'Sesja głosowa' };
  if (pathname === '/trash') return { title: 'Kosz' };
  if (pathname === '/settings') return { title: 'Ustawienia' };
  return null;
}