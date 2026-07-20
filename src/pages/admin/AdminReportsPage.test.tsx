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
