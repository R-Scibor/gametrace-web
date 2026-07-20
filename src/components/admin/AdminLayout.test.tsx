import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderPage, resetStores } from '../../../test/utils';
import { AdminLayout } from './AdminLayout';

describe('AdminLayout', () => {
  beforeEach(() => resetStores());

  it('renders the three admin tabs with live counts', async () => {
    renderPage(<AdminLayout />, { route: '/admin' });

    expect(await screen.findByRole('link', { name: /Przegląd/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Zgłoszenia/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Katalog/i })).toBeInTheDocument();

    // needs_review_count 12 and open_reports_count 3 from the overview fixture
    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
