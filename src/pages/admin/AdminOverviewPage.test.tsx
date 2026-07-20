import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/server';
import { fixtures } from '../../../test/fixtures';
import { renderPage, resetStores } from '../../../test/utils';
import { AdminOverviewPage } from './AdminOverviewPage';

describe('AdminOverviewPage', () => {
  beforeEach(() => resetStores());

  it('renders context and attention tiles from the overview endpoint', async () => {
    renderPage(<AdminOverviewPage />, { route: '/admin' });

    expect(await screen.findByText('317')).toBeInTheDocument();
    expect(screen.getByText('1284')).toBeInTheDocument();
    expect(screen.getByText('892.0')).toBeInTheDocument();

    const reviewLink = screen.getByRole('link', { name: /Do sprawdzenia/i });
    expect(reviewLink).toHaveAttribute('href', '/admin/catalog?status=NEEDS_REVIEW');

    const queueLink = screen.getByRole('link', { name: /W kolejce/i });
    expect(queueLink).toHaveAttribute('href', '/admin/catalog?status=PENDING');

    const reportsLink = screen.getByRole('link', { name: /zgłoszenia/i });
    expect(reportsLink).toHaveAttribute('href', '/admin/reports?status=open');
  });

  it('renders attention tiles inert when nothing needs attention', async () => {
    server.use(
      http.get('/api/v1/admin/stats/overview', () =>
        HttpResponse.json(fixtures.adminOverviewIdle),
      ),
    );

    renderPage(<AdminOverviewPage />, { route: '/admin' });

    expect(await screen.findByText('317')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a retry affordance when the overview fails to load', async () => {
    server.use(
      http.get('/api/v1/admin/stats/overview', () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    );

    renderPage(<AdminOverviewPage />, { route: '/admin' });

    expect(await screen.findByText(/Nie udało się wczytać przeglądu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Spróbuj ponownie/i })).toBeInTheDocument();
  });
});
