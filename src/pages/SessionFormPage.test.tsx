import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { SessionFormPage } from './SessionFormPage';
import { renderAppRoutes, resetStores } from '../../test/utils';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';

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

  const gameSelect = await screen.findByRole('combobox');
  await user.selectOptions(gameSelect, '1');

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