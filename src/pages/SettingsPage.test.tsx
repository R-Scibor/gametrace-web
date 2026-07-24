import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach, it } from 'vitest';
import { SettingsPage } from './SettingsPage';
import { renderAppRoutes, renderPage, resetStores } from '../../test/utils';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';
import i18n from '../i18n';

beforeEach(() => {
  resetStores();
});

test('SettingsPage renders profile and bot status', async () => {
  renderAppRoutes(
    <>
      <Route path="/settings" element={<SettingsPage />} />
    </>,
    { route: '/settings' },
  );

  expect(await screen.findByText('testuser')).toBeInTheDocument();
  expect(screen.getByText('ONLINE')).toBeInTheDocument();
  expect(screen.getByText('1.0.0-test')).toBeInTheDocument();
});

test('SettingsPage timezone change calls settings API', async () => {
  let updatedTimezone: string | undefined;
  server.use(
    http.put('/api/v1/profile/settings', async ({ request }) => {
      const body = (await request.json()) as { timezone?: string };
      updatedTimezone = body.timezone;
      return HttpResponse.json({ ...fixtures.profileMe, timezone: body.timezone });
    }),
  );

  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/settings" element={<SettingsPage />} />
    </>,
    { route: '/settings' },
  );

  const select = await screen.findByLabelText('Strefa czasowa');
  await user.selectOptions(select, 'America/New_York');

  await waitFor(() => expect(updatedTimezone).toBe('America/New_York'));
});

test('SettingsPage push toggle calls settings API', async () => {
  let updatedPush: boolean | undefined;
  server.use(
    http.put('/api/v1/profile/settings', async ({ request }) => {
      const body = (await request.json()) as { push_enabled?: boolean };
      updatedPush = body.push_enabled;
      return HttpResponse.json({ ...fixtures.profileMe, push_enabled: body.push_enabled });
    }),
  );

  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/settings" element={<SettingsPage />} />
    </>,
    { route: '/settings' },
  );

  const pushToggle = await screen.findByRole('checkbox', { name: /Powiadomienia push/i });
  await user.click(pushToggle);

  await waitFor(() => expect(updatedPush).toBe(true));
});

test('SettingsPage does not render logout button', async () => {
  renderAppRoutes(
    <>
      <Route path="/settings" element={<SettingsPage />} />
    </>,
    { route: '/settings' },
  );

  await screen.findByText('testuser');
  expect(screen.queryByRole('button', { name: /Wyloguj się/i })).not.toBeInTheDocument();
});

it('changes the active language when a new one is selected', async () => {
  const user = userEvent.setup();
  let putBody: unknown = null;
  server.use(
    http.put('/api/v1/profile/settings', async ({ request }) => {
      putBody = await request.json();
      return HttpResponse.json({ ...fixtures.profileMe, ...(putBody as object) });
    }),
  );
  renderPage(<SettingsPage />, { route: '/settings' });
  const select = await screen.findByLabelText('Język');
  await user.selectOptions(select, 'en');
  expect(i18n.language).toBe('en');
  await waitFor(() => expect(putBody).toEqual({ language: 'en' }));
});