import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach, it } from 'vitest';
import { SettingsPage } from './SettingsPage';
import { DeletionScheduledPage } from './DeletionScheduledPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { renderAppRoutes, renderPage, resetStores } from '../../test/utils';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';
import i18n from '../i18n';
import { PRIVACY_POLICY_VERSION } from '../lib/privacyPolicy';

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

it('disables the delete row for an admin and explains why', async () => {
  renderPage(<SettingsPage />);
  await waitFor(() => expect(screen.getByText('Usuń konto')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Usuń' })).toBeDisabled();
  expect(screen.getByText('Konta administratora nie można usunąć samodzielnie.')).toBeInTheDocument();
});

it('opens the confirm dialog for a non-admin', async () => {
  const user = userEvent.setup();
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json({ ...fixtures.profileMe, is_admin: false }),
    ),
  );
  renderPage(<SettingsPage />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Usuń' })).toBeEnabled());

  await user.click(screen.getByRole('button', { name: 'Usuń' }));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
});

it('lands on the deletion-scheduled screen with the purge date, not /welcome, after scheduling', async () => {
  // Guards the onSuccess race in DeleteAccountDialog: teardownAuth() flips
  // isAuthenticated false and navigate() fires in the same batch. If the
  // ProtectedRoute redirect ever won that race the user would be bounced to
  // /welcome and never see the purge date.
  const user = userEvent.setup();
  server.use(
    http.get('/api/v1/profile/me', () =>
      HttpResponse.json({ ...fixtures.profileMe, is_admin: false }),
    ),
  );
  renderAppRoutes(
    <>
      <Route element={<ProtectedRoute />}>
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/account/deletion-scheduled" element={<DeletionScheduledPage />} />
      <Route path="/welcome" element={<p>welcome page</p>} />
    </>,
    { route: '/settings' },
  );

  await waitFor(() => expect(screen.getByRole('button', { name: 'Usuń' })).toBeEnabled());
  await user.click(screen.getByRole('button', { name: 'Usuń' }));
  await user.type(screen.getByLabelText(/Wpisz testuser/), 'testuser');
  await user.click(screen.getByRole('button', { name: 'Usuń konto' }));

  expect(await screen.findByText(/14/)).toBeInTheDocument();
  expect(screen.queryByText('welcome page')).not.toBeInTheDocument();
});
it('keeps the delete button disabled for an admin when the profile request fails', async () => {
  await i18n.changeLanguage('pl');
  const deleteLabel = i18n.t('account.deleteAction', { ns: 'settings' });
  // profile is undefined and profileLoading is false, so the guard has to fall
  // back to the store's flag. Defaulting to false would offer an admin a
  // delete the backend always 403s.
  server.use(http.get('/api/v1/profile/me', () => new HttpResponse(null, { status: 500 })));

  renderAppRoutes(
    <>
      <Route path="/settings" element={<SettingsPage />} />
    </>,
    { route: '/settings' },
  );

  const deleteButton = await screen.findByRole('button', { name: deleteLabel });
  expect(deleteButton).toBeDisabled();
});

it('links a signed-in user to the privacy notice, stamped with the published version', async () => {
  await i18n.changeLanguage('pl');

  renderAppRoutes(
    <>
      <Route path="/settings" element={<SettingsPage />} />
    </>,
    { route: '/settings' },
  );

  const link = await screen.findByRole('link', {
    name: i18n.t('privacy.open', { ns: 'settings' }),
  });
  expect(link).toHaveAttribute('href', '/privacy');

  // The row must quote the shipped document, not a copy of its version string.
  expect(
    screen.getByText(
      new RegExp(i18n.t('versionLabel', { ns: 'privacy', version: PRIVACY_POLICY_VERSION })),
    ),
  ).toBeInTheDocument();
});
