import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/server';
import { fixtures } from '../../../test/fixtures';
import { renderPage, resetStores } from '../../../test/utils';
import { AdminReportsPage } from './AdminReportsPage';

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
});
