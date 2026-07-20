import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { AdminCatalogPage } from './AdminCatalogPage';
import { renderPage, resetStores } from '../../test/utils';
import { server } from '../../test/server';

beforeEach(() => resetStores());

test('AdminCatalogPage shows table and selects row detail', async () => {
  const user = userEvent.setup();
  renderPage(<AdminCatalogPage />, { route: '/admin/catalog' });

  const row = await screen.findByRole('button', { name: /Kingdom Hearts HD/i });
  await user.click(row);

  expect(
    screen.getByRole('heading', { name: /Kingdom Hearts HD 1\.5 \+ 2\.5 ReMIX/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Ponów wzbogacanie/i })).toBeInTheDocument();
});

test('AdminCatalogPage honours the status the overview hub links with', async () => {
  const requested: string[] = [];
  server.use(
    http.get('/api/v1/admin/games', ({ request }) => {
      requested.push(new URL(request.url).searchParams.get('status') ?? '');
      return HttpResponse.json({ total: 0, items: [] });
    }),
  );

  renderPage(<AdminCatalogPage />, { route: '/admin/catalog?status=PENDING' });

  // The non-NEEDS_REVIEW empty copy is itself evidence the status propagated.
  await screen.findByText('Brak gier dla wybranego filtra.');
  expect(requested).toContain('PENDING');
  expect(requested).not.toContain('NEEDS_REVIEW');
});

test('AdminCatalogPage falls back to NEEDS_REVIEW for an unknown status', async () => {
  const requested: string[] = [];
  server.use(
    http.get('/api/v1/admin/games', ({ request }) => {
      requested.push(new URL(request.url).searchParams.get('status') ?? '');
      return HttpResponse.json({ total: 0, items: [] });
    }),
  );

  renderPage(<AdminCatalogPage />, { route: '/admin/catalog?status=BOGUS' });

  await screen.findByText('Brak gier do sprawdzenia.');
  expect(requested).toContain('NEEDS_REVIEW');
});

test('AdminCatalogPage shows empty state when filter has no matches', async () => {
  server.use(
    http.get('/api/v1/admin/games', () => HttpResponse.json({ total: 0, items: [] })),
  );

  renderPage(<AdminCatalogPage />, { route: '/admin/catalog' });
  expect(await screen.findByText('Brak gier do sprawdzenia.')).toBeInTheDocument();
});