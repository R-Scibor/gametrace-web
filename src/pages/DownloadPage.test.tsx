import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { DownloadPage } from './DownloadPage';
import { server } from '../../test/server';
import { renderAppRoutes, resetStores } from '../../test/utils';

beforeEach(() => {
  resetStores();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('DownloadPage renders hub title, install help, and welcome CTA', async () => {
  renderAppRoutes(<Route path="/download" element={<DownloadPage />} />, {
    route: '/download',
    authenticated: false,
  });

  expect(screen.getByRole('heading', { level: 1, name: /pobierz aplikację/i })).toBeInTheDocument();
  expect(screen.getByText(/jak zainstalować/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /zobacz gametrace w przeglądarce/i })).toHaveAttribute(
    'href',
    '/welcome',
  );
  expect(screen.getByRole('contentinfo')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /pobierz apk/i })).toBeEnabled();
  });
});

test('DownloadPage disables download when APK is missing', async () => {
  server.use(http.get('/download/gametrace.apk', () => new HttpResponse(null, { status: 404 })));

  renderAppRoutes(<Route path="/download" element={<DownloadPage />} />, {
    route: '/download',
    authenticated: false,
  });

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /apk niedostępne/i })).toBeDisabled();
  });
  expect(screen.getByRole('status')).toHaveTextContent(/chwilowo niedostępny/i);
});

test('DownloadPage assigns APK path when download is ready', async () => {
  const assign = vi.fn();
  vi.stubGlobal('location', { ...window.location, assign });

  const user = userEvent.setup();
  renderAppRoutes(<Route path="/download" element={<DownloadPage />} />, {
    route: '/download',
    authenticated: false,
  });

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /pobierz apk/i })).toBeEnabled();
  });

  await user.click(screen.getByRole('button', { name: /pobierz apk/i }));
  expect(assign).toHaveBeenCalledWith('/download/gametrace.apk');
});

test('DownloadPage shows dashboard link when authenticated', async () => {
  renderAppRoutes(<Route path="/download" element={<DownloadPage />} />, {
    route: '/download',
    authenticated: true,
  });

  expect(screen.getByRole('link', { name: /przejdź do pulpitu/i })).toHaveAttribute('href', '/');
});
