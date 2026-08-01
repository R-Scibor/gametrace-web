import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { SessionFormPage } from './SessionFormPage';
import { renderAppRoutes, renderWithProviders, resetStores } from '../../test/utils';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';
import { setVoiceTranscriptPrefill } from '../lib/voicePrefill';

beforeEach(() => {
  resetStores();
});

test('SessionFormPage create shows 409 ConflictNotice', async () => {
  server.use(
    http.post('/api/v1/sessions', () =>
      HttpResponse.json({ detail: fixtures.conflictResponse }, { status: 409 }),
    ),
  );

  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/sessions/new" element={<SessionFormPage />} />
    </>,
    { route: '/sessions/new' },
  );

  await screen.findByText('Dodaj sesję');

  const gameInput = await screen.findByRole('combobox');
  await user.click(gameInput);
  await user.type(gameInput, 'Wiedź');
  const options = await screen.findAllByRole('option');
  await user.click(options[0]);

  await user.click(screen.getByRole('button', { name: /Zapisz sesję/i }));

  expect(await screen.findByText('Nakładające się sesje')).toBeInTheDocument();
  expect(screen.getByText(fixtures.conflictResponse.detail)).toBeInTheDocument();
});

test('SessionFormPage edit prefills session data', async () => {
  renderAppRoutes(
    <>
      <Route path="/sessions/:id/edit" element={<SessionFormPage />} />
    </>,
    { route: '/sessions/1/edit' },
  );

  expect(await screen.findByText('Edytuj sesję')).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByText('Test session')).toBeInTheDocument();
  });
});

test('SessionFormPage ERROR session hides trash delete button', async () => {
  server.use(http.get('/api/v1/sessions/2', () => HttpResponse.json(fixtures.sessionError)));

  renderAppRoutes(
    <>
      <Route path="/sessions/:id/edit" element={<SessionFormPage />} />
    </>,
    { route: '/sessions/2/edit' },
  );

  await screen.findByText('Edytuj sesję');
  expect(screen.getByRole('button', { name: /Odrzuć sesję/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Usuń sesję/i })).not.toBeInTheDocument();
});

test('SessionFormPage create shows voice transcript preview from sessionStorage', async () => {
  setVoiceTranscriptPrefill('grałem dwa godziny w cyberpunka');

  renderAppRoutes(
    <>
      <Route path="/sessions/new" element={<SessionFormPage />} />
    </>,
    { route: '/sessions/new' },
  );

  expect(await screen.findByText('Podgląd transkrypcji')).toBeInTheDocument();
  expect(screen.getByText('Tylko podgląd — nie zapisuje się w sesji.')).toBeInTheDocument();
  expect(screen.getByText('grałem dwa godziny w cyberpunka')).toBeInTheDocument();
});

test('SessionFormPage discard sends DELETE not PATCH', async () => {
  let patchCalled = false;
  let deleteCalled = false;

  server.use(
    http.get('/api/v1/sessions/2', () => HttpResponse.json(fixtures.sessionError)),
    http.patch('/api/v1/sessions/2', () => {
      patchCalled = true;
      return HttpResponse.json(fixtures.sessionError);
    }),
    http.delete('/api/v1/sessions/2', () => {
      deleteCalled = true;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/sessions/:id/edit" element={<SessionFormPage />} />
      <Route path="/" element={<div>Dashboard</div>} />
    </>,
    { route: '/sessions/2/edit' },
  );

  await screen.findByText('Edytuj sesję');
  await user.click(await screen.findByRole('button', { name: /Odrzuć sesję/i }));

  await waitFor(() => {
    expect(deleteCalled).toBe(true);
    expect(patchCalled).toBe(false);
  });
});

test('seeds the game picker from a voice gameName param', async () => {
  renderWithProviders(<SessionFormPage />, {
    route: '/sessions/new?gameName=hades',
    authenticated: true,
  });

  expect(await screen.findByRole('combobox')).toHaveValue('hades');
  expect(await screen.findByText('Hades')).toBeInTheDocument();
});