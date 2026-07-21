import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/server';
import { renderPage, resetStores } from '../../../test/utils';
import { fixtures } from '../../../test/fixtures';
import { AdminCatalogPage } from './AdminCatalogPage';

describe('AdminCatalogPage', () => {
  beforeEach(() => resetStores());

  it('shows the empty inspector prompt before anything is selected', async () => {
    renderPage(<AdminCatalogPage />, { route: '/admin/catalog?status=NEEDS_REVIEW' });

    expect(await screen.findByText(/Wybierz grę z tabeli/i)).toBeInTheDocument();
  });

  it('preselects the game named in the URL', async () => {
    renderPage(<AdminCatalogPage />, { route: '/admin/catalog?status=NEEDS_REVIEW&game=45' });

    // The name renders twice by design: once in the table row, once as the
    // inspector heading for the preselected game.
    expect(
      await screen.findByRole('heading', { name: 'Kingdom Hearts HD 1.5 + 2.5 ReMIX' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('KINGDOM HEARTS -HD 1.5+2.5 ReMIX-')).toBeInTheDocument();
  });

  it('renders a retry affordance when the catalog fails to load', async () => {
    server.use(
      http.get('/api/v1/admin/games', () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    );

    renderPage(<AdminCatalogPage />, { route: '/admin/catalog?status=NEEDS_REVIEW' });

    expect(await screen.findByText(/Nie udało się wczytać katalogu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Spróbuj ponownie/i })).toBeInTheDocument();
  });

  it('keeps the game selected in the URL when the page changes', async () => {
    // The default fixture has 2 rows, so pagination is disabled. Report a larger
    // total to enable the Następna button without changing the returned rows.
    server.use(
      http.get('/api/v1/admin/games', () =>
        HttpResponse.json({ total: 60, items: fixtures.adminCatalogGames.items }),
      ),
    );

    renderPage(<AdminCatalogPage />, { route: '/admin/catalog?status=NEEDS_REVIEW&game=45' });

    await screen.findByText('KINGDOM HEARTS -HD 1.5+2.5 ReMIX-');
    await userEvent.click(screen.getByRole('button', { name: 'Następna' }));

    // Selection lives in the URL, so pagination does not clear it. The previous
    // build cleared selection on every page and filter change.
    expect(await screen.findByText('KINGDOM HEARTS -HD 1.5+2.5 ReMIX-')).toBeInTheDocument();
  });

  it('keeps pagination reachable when a filter yields no rows', async () => {
    server.use(
      http.get('/api/v1/admin/games', () => HttpResponse.json({ total: 0, items: [] })),
    );

    // Deep into pagination, then the result set collapses to nothing. Without
    // pagination still mounted the admin is stranded on an out-of-range skip
    // with no in-UI way back.
    renderPage(<AdminCatalogPage />, { route: '/admin/catalog?status=NEEDS_REVIEW&skip=100' });

    expect(await screen.findByText('Brak gier dla wybranego filtra.')).toBeInTheDocument();

    const back = screen.getByRole('button', { name: 'Poprzednia' });
    expect(back).toBeEnabled();

    await userEvent.click(back);
    expect(screen.getByRole('button', { name: 'Poprzednia' })).toBeInTheDocument();
  });

  it('says so when the selected game is not visible under the current filter', async () => {
    // This is what an admin sees after merging into a game that lives under a
    // different status filter or on another page: the merge succeeded, but the
    // survivor is not in the loaded result set.
    renderPage(<AdminCatalogPage />, {
      route: '/admin/catalog?status=NEEDS_REVIEW&game=4242',
    });

    expect(await screen.findByText(/nie jest widoczna przy tym filtrze/i)).toBeInTheDocument();
    // The generic prompt would wrongly read as "your selection was lost".
    expect(screen.queryByText('Wybierz grę z tabeli.')).not.toBeInTheDocument();
  });

  it('clears the filter so a game hidden by it becomes reachable', async () => {
    const user = userEvent.setup();
    renderPage(<AdminCatalogPage />, {
      route: '/admin/catalog?status=NEEDS_REVIEW&q=cokolwiek&skip=100&game=45',
    });

    await user.click(await screen.findByRole('button', { name: /Pokaż wszystkie/i }));

    // Filter and pagination both reset, so the selected game resolves again.
    expect(
      await screen.findByRole('heading', { name: 'Kingdom Hearts HD 1.5 + 2.5 ReMIX' }),
    ).toBeInTheDocument();
  });

  it('omits the status param entirely when "Wszystkie" is selected', async () => {
    let lastStatusParam: string | null | undefined;
    server.use(
      http.get('/api/v1/admin/games', ({ request }) => {
        const url = new URL(request.url);
        lastStatusParam = url.searchParams.get('status');
        return HttpResponse.json(fixtures.adminCatalogGames);
      }),
    );

    const user = userEvent.setup();
    renderPage(<AdminCatalogPage />, { route: '/admin/catalog?status=NEEDS_REVIEW' });

    await screen.findByText('Kingdom Hearts HD 1.5 + 2.5 ReMIX');
    expect(lastStatusParam).toBe('NEEDS_REVIEW');

    await user.selectOptions(screen.getByLabelText('Status'), 'Wszystkie');

    // The request that follows the "Wszystkie" selection must drop the status
    // key entirely, not resurrect the previous value or send an empty string.
    await screen.findByText('Kingdom Hearts HD 1.5 + 2.5 ReMIX');
    expect(lastStatusParam).toBeNull();
  });

  it('selects the surviving game in place after a merge, without navigating away', async () => {
    let mergedInto: string | undefined;
    server.use(
      http.post('/api/v1/admin/games/:id/merge/:targetId', ({ params }) => {
        mergedInto = params.targetId as string;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderPage(<AdminCatalogPage />, { route: '/admin/catalog?status=NEEDS_REVIEW&game=45' });

    await screen.findByRole('heading', { name: 'Kingdom Hearts HD 1.5 + 2.5 ReMIX' });

    await user.type(screen.getByLabelText('Szukaj gry docelowej'), 'Nieznana');
    await user.click(await screen.findByRole('button', { name: 'Scal tutaj' }));
    await user.click(await screen.findByRole('button', { name: 'Scal' }));

    expect(await screen.findByRole('heading', { name: 'Nieznana Gra' })).toBeInTheDocument();
    expect(mergedInto).toBe('99');
  });
});
