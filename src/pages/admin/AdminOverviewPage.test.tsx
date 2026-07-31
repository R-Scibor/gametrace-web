import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/server';
import { fixtures } from '../../../test/fixtures';
import { renderPage, resetStores } from '../../../test/utils';
import { AdminOverviewPage } from './AdminOverviewPage';

describe('AdminOverviewPage', () => {
  beforeEach(() => resetStores());

  it('puts attention first and links queues into the right surfaces', async () => {
    renderPage(<AdminOverviewPage />, { route: '/admin' });

    // Wait for overview payload (labels also render in the loading skeleton).
    expect(await screen.findByText('317')).toBeInTheDocument();
    expect(screen.getByText('Wymaga uwagi')).toBeInTheDocument();
    expect(screen.getByText('Kolejka')).toBeInTheDocument();
    expect(screen.getByText('Homelab')).toBeInTheDocument();
    expect(screen.getByText('1284')).toBeInTheDocument();
    expect(screen.getByText('892.0')).toBeInTheDocument();

    const reviewLink = screen.getByRole('link', { name: /Do sprawdzenia/i });
    expect(reviewLink).toHaveAttribute('href', '/admin/catalog?status=NEEDS_REVIEW');

    const queueLink = screen.getByRole('link', { name: /W kolejce/i });
    expect(queueLink).toHaveAttribute('href', '/admin/catalog?status=PENDING');

    const reportsLink = screen.getByRole('link', { name: /Otwarte zgłoszenia/i });
    expect(reportsLink).toHaveAttribute('href', '/admin/reports?status=open');
  });

  it('renders open-report and needs-review previews with deep links', async () => {
    renderPage(<AdminOverviewPage />, { route: '/admin' });

    expect(
      await screen.findByText('Nie mogę dodać sesji na telefonie'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Nie mogę dodać sesji na telefonie/i }),
    ).toHaveAttribute('href', '/admin/reports?status=open&report=17');

    expect(
      await screen.findByText('Kingdom Hearts HD 1.5 + 2.5 ReMIX'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Kingdom Hearts HD 1.5 \+ 2.5 ReMIX/i }),
    ).toHaveAttribute('href', '/admin/catalog?status=NEEDS_REVIEW&game=45');
  });

  it('renders attention tiles inert with idle copy when nothing needs attention', async () => {
    server.use(
      http.get('/api/v1/admin/stats/overview', () =>
        HttpResponse.json(fixtures.adminOverviewIdle),
      ),
    );

    renderPage(<AdminOverviewPage />, { route: '/admin' });

    expect(await screen.findByText('317')).toBeInTheDocument();
    expect(screen.getByText('Katalog czysty')).toBeInTheDocument();
    expect(screen.getByText('Nic w kolejce')).toBeInTheDocument();
    expect(screen.getByText('Brak zgłoszeń')).toBeInTheDocument();
    // Queue panels still offer "view all", but no attention deep-links.
    expect(screen.queryByRole('link', { name: /Do sprawdzenia/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /W kolejce/i })).not.toBeInTheDocument();
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
