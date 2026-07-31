import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { server } from '../../../test/server';
import { fixtures } from '../../../test/fixtures';
import { renderPage, resetStores } from '../../../test/utils';
import { AdminReportsPage } from './AdminReportsPage';

/** Captures MemoryRouter search string for URL assertions. */
function SearchCapture({ onSearch }: { onSearch: (search: string) => void }) {
  const { search } = useLocation();
  useEffect(() => {
    onSearch(search);
  }, [search, onSearch]);
  return null;
}

describe('AdminReportsPage', () => {
  beforeEach(() => resetStores());

  it('lists open reports and shows the empty inspector state', async () => {
    renderPage(<AdminReportsPage />, { route: '/admin/reports?status=open' });

    expect(await screen.findByText('Nie mogę dodać sesji na telefonie')).toBeInTheDocument();
    expect(screen.getByText(/Wybierz zgłoszenie z listy/i)).toBeInTheDocument();
  });

  it('selects a report and shows its detail', async () => {
    renderPage(<AdminReportsPage />, { route: '/admin/reports?status=open' });

    await userEvent.click(await screen.findByText('Okładka Hadesa jest zła'));

    expect(await screen.findByText('GameDetail')).toBeInTheDocument();
  });

  it('preselects the report named in the URL', async () => {
    renderPage(<AdminReportsPage />, { route: '/admin/reports?status=open&report=17' });

    expect(await screen.findByText('SessionForm')).toBeInTheDocument();
  });

  it('refetches the chosen bucket and drops the selection when the filter changes', async () => {
    const requested: string[] = [];
    server.use(
      http.get('/api/v1/admin/reports', ({ request }) => {
        const status = new URL(request.url).searchParams.get('status') ?? '';
        requested.push(status);
        const items = fixtures.adminReports.items.filter((r) => r.status === status);
        return HttpResponse.json({ total: items.length, items });
      }),
    );

    renderPage(<AdminReportsPage />, { route: '/admin/reports?status=open&report=17' });

    // Selection from the URL is live before the filter changes.
    expect(await screen.findByText('SessionForm')).toBeInTheDocument();

    await userEvent.selectOptions(await screen.findByLabelText('Status'), 'closed');

    // The new bucket is fetched, and the stale selection is gone rather than
    // pointing at a report that is not in this bucket.
    await screen.findByText(/Brak zgłoszeń/i);
    expect(requested).toEqual(['open', 'closed']);
    expect(screen.queryByText('SessionForm')).not.toBeInTheDocument();
  });

  it('renders an empty state when the inbox is clear', async () => {
    server.use(
      http.get('/api/v1/admin/reports', () => HttpResponse.json(fixtures.adminReportsEmpty)),
    );

    renderPage(<AdminReportsPage />, { route: '/admin/reports?status=open' });

    expect(await screen.findByText(/Brak zgłoszeń/i)).toBeInTheDocument();
  });

  it('renders a retry affordance when loading fails', async () => {
    server.use(
      http.get('/api/v1/admin/reports', () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    );

    renderPage(<AdminReportsPage />, { route: '/admin/reports?status=open' });

    expect(await screen.findByText(/Nie udało się wczytać zgłoszeń/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Spróbuj ponownie/i })).toBeInTheDocument();
  });

  it('updates the URL and filters the list when the screen facet changes', async () => {
    let lastSearch = '';
    const listScreens: (string | null)[] = [];
    server.use(
      http.get('/api/v1/admin/reports', ({ request }) => {
        const url = new URL(request.url);
        listScreens.push(url.searchParams.get('screen'));
        let items = fixtures.adminReports.items;
        const status = url.searchParams.get('status');
        const screen = url.searchParams.get('screen');
        if (status) items = items.filter((r) => r.status === status);
        if (screen) items = items.filter((r) => r.context.screen === screen);
        return HttpResponse.json({ total: items.length, items });
      }),
    );

    renderPage(
      <>
        <AdminReportsPage />
        <SearchCapture onSearch={(s) => {
          lastSearch = s;
        }}
        />
      </>,
      { route: '/admin/reports?status=open' },
    );

    await screen.findByText('Nie mogę dodać sesji na telefonie');
    await screen.findByText('Okładka Hadesa jest zła');

    await userEvent.selectOptions(await screen.findByLabelText('Ekran'), 'SessionForm');

    await waitFor(() => {
      expect(lastSearch).toContain('screen=SessionForm');
      expect(listScreens).toContain('SessionForm');
    });

    expect(await screen.findByText('Nie mogę dodać sesji na telefonie')).toBeInTheDocument();
    expect(screen.queryByText('Okładka Hadesa jest zła')).not.toBeInTheDocument();
  });

  it('debounces search into the q URL param', async () => {
    let lastSearch = '';
    const listQs: (string | null)[] = [];
    server.use(
      http.get('/api/v1/admin/reports', ({ request }) => {
        const url = new URL(request.url);
        listQs.push(url.searchParams.get('q'));
        let items = fixtures.adminReports.items;
        const status = url.searchParams.get('status');
        const q = url.searchParams.get('q')?.toLowerCase();
        if (status) items = items.filter((r) => r.status === status);
        if (q) items = items.filter((r) => r.message.toLowerCase().includes(q));
        return HttpResponse.json({ total: items.length, items });
      }),
    );

    const user = userEvent.setup();
    renderPage(
      <>
        <AdminReportsPage />
        <SearchCapture onSearch={(s) => {
          lastSearch = s;
        }}
        />
      </>,
      { route: '/admin/reports?status=open' },
    );

    await screen.findByText('Nie mogę dodać sesji na telefonie');

    await user.type(screen.getByLabelText('Szukaj w treściach zgłoszeń'), 'telefonie');

    await waitFor(
      () => {
        expect(lastSearch).toMatch(/q=telefonie/);
        expect(listQs).toContain('telefonie');
      },
      { timeout: 3000 },
    );

    expect(await screen.findByText('Nie mogę dodać sesji na telefonie')).toBeInTheDocument();
    expect(screen.queryByText('Okładka Hadesa jest zła')).not.toBeInTheDocument();
  });

  it('loads facets with status only (no q, screen, or platform)', async () => {
    const facetUrls: string[] = [];
    server.use(
      http.get('/api/v1/admin/reports/facets', ({ request }) => {
        facetUrls.push(request.url);
        return HttpResponse.json(fixtures.adminReportFacets);
      }),
    );

    // Combined list filters intentionally empty the inbox; we only assert the facets request.
    renderPage(<AdminReportsPage />, {
      route: '/admin/reports?status=open&q=foo&screen=SessionForm&platform=android',
    });

    await screen.findByLabelText('Ekran');
    await waitFor(() => expect(facetUrls.length).toBeGreaterThan(0));

    for (const url of facetUrls) {
      const params = new URL(url).searchParams;
      expect(params.get('status')).toBe('open');
      expect(params.has('q')).toBe(false);
      expect(params.has('screen')).toBe(false);
      expect(params.has('platform')).toBe(false);
    }
  });

  it('shows the select prompt when the selected report is filtered out of the list', async () => {
    let lastSearch = '';
    renderPage(
      <>
        <AdminReportsPage />
        <SearchCapture onSearch={(s) => {
          lastSearch = s;
        }}
        />
      </>,
      { route: '/admin/reports?status=open&report=17' },
    );

    // Deep-linked selection is live.
    expect(await screen.findByText('SessionForm')).toBeInTheDocument();

    // GameDetail excludes report 17 but keeps report 16 so MasterDetail stays mounted.
    await userEvent.selectOptions(await screen.findByLabelText('Ekran'), 'GameDetail');

    await waitFor(() => {
      expect(screen.queryByText('Nie mogę dodać sesji na telefonie')).not.toBeInTheDocument();
    });

    expect(await screen.findByText('Okładka Hadesa jest zła')).toBeInTheDocument();
    expect(screen.getByText(/Wybierz zgłoszenie z listy/i)).toBeInTheDocument();
    // report may remain in the URL (stale selection not auto-cleared on facet change).
    expect(lastSearch).toContain('report=17');
  });

  it('clears selection after reopening a report out of the closed bucket', async () => {
    const closed = {
      ...fixtures.adminReports.items[0],
      id: 99,
      status: 'closed' as const,
      message: 'Zamknięte zgłoszenie do otwarcia',
      context: { screen: 'Settings', platform: 'web' },
    };

    server.use(
      http.get('/api/v1/admin/reports', ({ request }) => {
        const status = new URL(request.url).searchParams.get('status');
        if (status === 'closed') {
          return HttpResponse.json({ total: 1, items: [closed] });
        }
        return HttpResponse.json({ total: 0, items: [] });
      }),
      http.patch('/api/v1/admin/reports/:id', async ({ params, request }) => {
        const body = (await request.json()) as { status?: string };
        return HttpResponse.json({
          ...closed,
          id: Number(params.id),
          ...(body.status !== undefined ? { status: body.status } : {}),
        });
      }),
    );

    renderPage(<AdminReportsPage />, {
      route: '/admin/reports?status=closed&report=99',
    });

    // Message renders in both the list row and the inspector body.
    expect(
      await screen.findByRole('button', { name: /Otwórz ponownie/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Zamknięte zgłoszenie do otwarcia').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /Otwórz ponownie/i }));

    // Status left the closed bucket → selection cleared → select prompt.
    await waitFor(() => {
      expect(screen.getByText(/Wybierz zgłoszenie z listy/i)).toBeInTheDocument();
    });
  });

  it('clears selection after delete confirm', async () => {
    let lastSearch = '';
    renderPage(
      <>
        <AdminReportsPage />
        <SearchCapture onSearch={(s) => {
          lastSearch = s;
        }}
        />
      </>,
      { route: '/admin/reports?status=open&report=17' },
    );

    expect(await screen.findByText('SessionForm')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Usuń$/i }));
    expect(screen.getByText(/Usunąć to zgłoszenie/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Usuń trwale/i }));

    await waitFor(() => {
      expect(screen.getByText(/Wybierz zgłoszenie z listy/i)).toBeInTheDocument();
      expect(lastSearch).not.toContain('report=');
    });
  });
});
