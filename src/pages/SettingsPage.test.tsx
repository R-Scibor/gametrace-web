import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { SettingsPage } from './SettingsPage';
import { renderAppRoutes, resetStores } from '../../test/utils';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';

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

  const select = await screen.findByRole('combobox');
  await user.selectOptions(select, 'America/New_York');

  await waitFor(() => expect(updatedTimezone).toBe('America/New_York'));
});

test('SettingsPage logout navigates to login', async () => {
  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/login" element={<div>Login Screen</div>} />
    </>,
    { route: '/settings' },
  );

  await user.click(await screen.findByRole('button', { name: /Wyloguj się/i }));

  expect(await screen.findByText('Login Screen')).toBeInTheDocument();
});