import { describe, it, expect, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/server';
import { fixtures } from '../../../test/fixtures';
import { renderPage, resetStores } from '../../../test/utils';
import { AdminLayout } from './AdminLayout';

describe('AdminLayout', () => {
  beforeEach(() => resetStores());

  it('renders the three admin tabs with live counts', async () => {
    renderPage(<AdminLayout />, { route: '/admin' });

    expect(await screen.findByRole('link', { name: /Przegląd/i })).toBeInTheDocument();
    const reportsTab = screen.getByRole('link', { name: /Zgłoszenia/i });
    const catalogTab = screen.getByRole('link', { name: /Katalog/i });
    expect(reportsTab).toBeInTheDocument();
    expect(catalogTab).toBeInTheDocument();

    // open_reports_count 3 maps to Zgłoszenia, needs_review_count 12 maps to Katalog
    expect(await within(reportsTab).findByText('3')).toBeInTheDocument();
    expect(within(catalogTab).getByText('12')).toBeInTheDocument();
  });

  it('renders no count badges when nothing needs attention', async () => {
    server.use(
      http.get('/api/v1/admin/stats/overview', () =>
        HttpResponse.json(fixtures.adminOverviewIdle),
      ),
    );

    renderPage(<AdminLayout />, { route: '/admin' });

    const reportsTab = await screen.findByRole('link', { name: /Zgłoszenia/i });
    const catalogTab = screen.getByRole('link', { name: /Katalog/i });

    expect(within(reportsTab).queryByText(/\d+/)).not.toBeInTheDocument();
    expect(within(catalogTab).queryByText(/\d+/)).not.toBeInTheDocument();
  });

  it('does not mark Przegląd active when a child route is open', async () => {
    renderPage(<AdminLayout />, { route: '/admin/reports' });

    const overviewTab = await screen.findByRole('link', { name: /Przegląd/i });
    const reportsTab = screen.getByRole('link', { name: /Zgłoszenia/i });

    expect(overviewTab).not.toHaveAttribute('aria-current');
    expect(reportsTab).toHaveAttribute('aria-current', 'page');
  });
});
