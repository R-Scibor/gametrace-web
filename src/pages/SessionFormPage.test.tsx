import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionFormPage } from './SessionFormPage';
import { renderAppRoutes, renderWithProviders, resetStores } from '../../test/utils';
import { server } from '../../test/server';
import { fixtures } from '../../test/fixtures';
import { setVoiceTranscriptPrefill } from '../lib/voicePrefill';
import { useToastStore } from '../store/toastStore';
import { SESSION_MAX_DURATION_MS } from '../lib/sessionBounds';

const FROZEN = new Date('2026-06-15T12:00:00.000Z');

beforeEach(() => {
  resetStores();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(FROZEN);
});

afterEach(() => {
  vi.useRealTimers();
});

async function pickFirstGame(user: ReturnType<typeof userEvent.setup>) {
  const gameInput = await screen.findByRole('combobox');
  await user.click(gameInput);
  await user.type(gameInput, 'Wiedź');
  const options = await screen.findAllByRole('option');
  await user.click(options[0]);
}

function localInput(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function setTime(id: string, value: string) {
  fireEvent.change(document.getElementById(id) as HTMLInputElement, { target: { value } });
}

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

  await pickFirstGame(user);
  setTime('session-start', localInput(new Date(FROZEN.getTime() - 60 * 60 * 1000)));
  setTime('session-end', localInput(FROZEN));
  await user.click(screen.getByRole('button', { name: /Zapisz sesję/i }));

  expect(await screen.findByText('Nakładające się sesje')).toBeInTheDocument();
  expect(screen.getByText('Ten przedział nachodzi na inną sesję.')).toBeInTheDocument();
  expect(screen.queryByText('Session overlaps with an existing session')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Edytuj/i })).toHaveAttribute('href', '/sessions/42/edit');
});

test('SessionFormPage create 409 with ongoing conflicting session links to library', async () => {
  server.use(
    http.post('/api/v1/sessions', () =>
      HttpResponse.json({
        detail: {
          ...fixtures.conflictResponse,
          conflicting_session: {
            ...fixtures.conflictResponse.conflicting_session,
            status: 'ONGOING',
            end_time: null,
            game: { id: 1, primary_name: 'Wiedźmin 3', cover_image_url: null },
          },
        },
      }, { status: 409 }),
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
  await pickFirstGame(user);
  setTime('session-start', localInput(new Date(FROZEN.getTime() - 60 * 60 * 1000)));
  setTime('session-end', localInput(FROZEN));
  await user.click(screen.getByRole('button', { name: /Zapisz sesję/i }));

  expect(await screen.findByText('Nakładające się sesje')).toBeInTheDocument();
  expect(screen.getByText('Ta sesja nadal trwa, więc nie da się jej tu edytować. Zakończ ją w bocie, a potem zapisz ponownie.')).toBeInTheDocument();
  const link = screen.getByRole('link', { name: /Zobacz grę/i });
  expect(link).toHaveAttribute('href', '/library/1');
  expect(link).not.toHaveAttribute('href', '/sessions/42/edit');
  expect(screen.queryByRole('link', { name: /Edytuj/i })).not.toBeInTheDocument();
});

test('SessionFormPage edit PATCH 409 with writer conflict shows writer notice and no link', async () => {
  server.use(
    http.get('/api/v1/sessions/1', () => HttpResponse.json(fixtures.session)),
    http.patch('/api/v1/sessions/1', () =>
      HttpResponse.json({ detail: fixtures.writerConflictResponse }, { status: 409 }),
    ),
  );

  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/sessions/:id/edit" element={<SessionFormPage />} />
    </>,
    { route: '/sessions/1/edit' },
  );

  expect(await screen.findByText('Edytuj sesję')).toBeInTheDocument();
  await screen.findByText('Test session');
  await user.click(screen.getByRole('button', { name: /Zapisz zmiany/i }));

  expect(await screen.findByText('Sesja zmieniona')).toBeInTheDocument();
  expect(screen.getByText('Ta sesja została zapisana w innej karcie, w aplikacji albo przez bota. Odśwież stronę i spróbuj ponownie.')).toBeInTheDocument();
  expect(screen.queryByText(/Ktoś inny/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Someone else/i)).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Edytuj/i })).not.toBeInTheDocument();
  expect(document.querySelector('a[href="/sessions/1/edit"]')).toBeNull();
  expect(useToastStore.getState().toasts).toHaveLength(0);
});

test('SessionFormPage edit PATCH 409 with writer ongoing conflict links to library and hides writer message', async () => {
  server.use(
    http.get('/api/v1/sessions/1', () => HttpResponse.json(fixtures.session)),
    http.patch('/api/v1/sessions/1', () =>
      HttpResponse.json({ detail: fixtures.writerOngoingConflictResponse }, { status: 409 }),
    ),
  );

  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/sessions/:id/edit" element={<SessionFormPage />} />
    </>,
    { route: '/sessions/1/edit' },
  );

  expect(await screen.findByText('Edytuj sesję')).toBeInTheDocument();
  await screen.findByText('Test session');
  await user.click(screen.getByRole('button', { name: /Zapisz zmiany/i }));

  expect(await screen.findByText('Sesja zmieniona')).toBeInTheDocument();
  expect(screen.getByText('Ta sesja nadal trwa, więc nie da się jej tu edytować. Zakończ ją w bocie, a potem zapisz ponownie.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Zobacz grę/i })).toHaveAttribute('href', '/library/1');
  expect(screen.queryByText('Ta sesja została zapisana w innej karcie, w aplikacji albo przez bota. Odśwież stronę i spróbuj ponownie.')).not.toBeInTheDocument();
});

test('SessionFormPage edit PATCH 409 with writer trashed conflict shows trashed message without links', async () => {
  server.use(
    http.get('/api/v1/sessions/1', () => HttpResponse.json(fixtures.session)),
    http.patch('/api/v1/sessions/1', () =>
      HttpResponse.json({ detail: fixtures.writerTrashedConflictResponse }, { status: 409 }),
    ),
  );

  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/sessions/:id/edit" element={<SessionFormPage />} />
    </>,
    { route: '/sessions/1/edit' },
  );

  expect(await screen.findByText('Edytuj sesję')).toBeInTheDocument();
  await screen.findByText('Test session');
  await user.click(screen.getByRole('button', { name: /Zapisz zmiany/i }));

  expect(await screen.findByText('Sesja zmieniona')).toBeInTheDocument();
  expect(screen.getByText('Ta sesja jest w koszu. Nie da się jej tu zapisać.')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Edytuj/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Zobacz grę/i })).not.toBeInTheDocument();
  expect(screen.queryByText('Ta sesja została zapisana w innej karcie, w aplikacji albo przez bota. Odśwież stronę i spróbuj ponownie.')).not.toBeInTheDocument();
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

test('untouched create prefill posts and does not show a future-end error', async () => {
  let posted = false;
  server.use(http.post('/api/v1/sessions', async () => {
    posted = true;
    return HttpResponse.json(fixtures.session, { status: 201 });
  }));
  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/sessions/new" element={<SessionFormPage />} />
      <Route path="/" element={<div>Dashboard</div>} />
    </>,
    { route: '/sessions/new' },
  );
  await pickFirstGame(user);
  await user.click(screen.getByRole('button', { name: /Zapisz sesję/i }));
  await waitFor(() => expect(posted).toBe(true));
  expect(screen.queryByText('Zakończenie może być najwyżej 5 minut w przyszłości.')).not.toBeInTheDocument();
  expect(screen.queryByText('Zakończenie musi być późniejsze niż rozpoczęcie.')).not.toBeInTheDocument();
});

test('create with end equal to start shows endBeforeStart and does not post', async () => {
  let posted = false;
  server.use(http.post('/api/v1/sessions', () => {
    posted = true;
    return HttpResponse.json(fixtures.session, { status: 201 });
  }));
  const user = userEvent.setup();
  renderAppRoutes(<Route path="/sessions/new" element={<SessionFormPage />} />, { route: '/sessions/new' });
  await pickFirstGame(user);
  const value = localInput(FROZEN);
  setTime('session-start', value);
  setTime('session-end', value);
  await user.click(screen.getByRole('button', { name: /Zapisz sesję/i }));
  expect(await screen.findByText('Zakończenie musi być późniejsze niż rozpoczęcie.')).toBeInTheDocument();
  expect(posted).toBe(false);
});

test('create longer than 48 hours shows the duration message and does not post', async () => {
  let posted = false;
  server.use(http.post('/api/v1/sessions', () => {
    posted = true;
    return HttpResponse.json(fixtures.session, { status: 201 });
  }));
  const user = userEvent.setup();
  renderAppRoutes(<Route path="/sessions/new" element={<SessionFormPage />} />, { route: '/sessions/new' });
  await pickFirstGame(user);
  setTime('session-start', localInput(new Date(FROZEN.getTime() - 49 * 60 * 60 * 1000)));
  setTime('session-end', localInput(FROZEN));
  await user.click(screen.getByRole('button', { name: /Zapisz sesję/i }));
  expect(await screen.findByText('Sesja nie może trwać dłużej niż 48 godzin.')).toBeInTheDocument();
  expect(posted).toBe(false);
});

test('create older than 30 days shows lookback and does not post', async () => {
  let posted = false;
  server.use(http.post('/api/v1/sessions', () => {
    posted = true;
    return HttpResponse.json(fixtures.session, { status: 201 });
  }));
  const user = userEvent.setup();
  renderAppRoutes(<Route path="/sessions/new" element={<SessionFormPage />} />, { route: '/sessions/new' });
  await pickFirstGame(user);
  const start = new Date(FROZEN.getTime() - 31 * 24 * 60 * 60 * 1000);
  setTime('session-start', localInput(start));
  setTime('session-end', localInput(new Date(start.getTime() + 60 * 60 * 1000)));
  await user.click(screen.getByRole('button', { name: /Zapisz sesję/i }));
  expect(await screen.findByText('Początek nie może być starszy niż 30 dni.')).toBeInTheDocument();
  expect(posted).toBe(false);
});

test('create ending six minutes ahead is blocked and four minutes ahead posts Z', async () => {
  let body: { start_time?: string; end_time?: string } | null = null;
  server.use(http.post('/api/v1/sessions', async ({ request }) => {
    body = await request.json() as { start_time: string; end_time: string };
    return HttpResponse.json(fixtures.session, { status: 201 });
  }));
  const user = userEvent.setup();
  renderAppRoutes(
    <>
      <Route path="/sessions/new" element={<SessionFormPage />} />
      <Route path="/" element={<div>Dashboard</div>} />
    </>,
    { route: '/sessions/new' },
  );
  await pickFirstGame(user);
  setTime('session-start', localInput(FROZEN));
  setTime('session-end', localInput(new Date(FROZEN.getTime() + 6 * 60_000)));
  await user.click(screen.getByRole('button', { name: /Zapisz sesję/i }));
  expect(await screen.findByText('Zakończenie może być najwyżej 5 minut w przyszłości.')).toBeInTheDocument();
  expect(body).toBeNull();

  setTime('session-end', localInput(new Date(FROZEN.getTime() + 4 * 60_000)));
  await user.click(screen.getByRole('button', { name: /Zapisz sesję/i }));
  await waitFor(() => expect(body).not.toBeNull());
  expect(body!.start_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  expect(body!.end_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test('ERROR with an empty end does not patch and asks for an end', async () => {
  let patched = false;
  server.use(
    http.get('/api/v1/sessions/2', () => HttpResponse.json(fixtures.sessionError)),
    http.patch('/api/v1/sessions/2', () => {
      patched = true;
      return HttpResponse.json(fixtures.sessionError);
    }),
  );
  const user = userEvent.setup();
  renderAppRoutes(<Route path="/sessions/:id/edit" element={<SessionFormPage />} />, { route: '/sessions/2/edit' });
  await screen.findByText('Edytuj sesję');
  await user.click(screen.getByRole('button', { name: /Zapisz zmiany/i }));
  expect(await screen.findByText('Podaj zakończenie albo odrzuć sesję.')).toBeInTheDocument();
  expect(patched).toBe(false);
  expect(useToastStore.getState().toasts).toHaveLength(0);
});

test('ERROR older than 30 days with a one hour end still patches', async () => {
  let body: Record<string, unknown> | null = null;
  const start = new Date(FROZEN.getTime() - 40 * 24 * 60 * 60 * 1000);
  server.use(
    http.get('/api/v1/sessions/2', () => HttpResponse.json({
      ...fixtures.sessionError,
      start_time: start.toISOString(),
      end_time: null,
    })),
    http.patch('/api/v1/sessions/2', async ({ request }) => {
      body = await request.json() as Record<string, unknown>;
      return HttpResponse.json(fixtures.sessionError);
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
  setTime('session-end', localInput(new Date(start.getTime() + 60 * 60 * 1000)));
  await user.click(screen.getByRole('button', { name: /Zapisz zmiany/i }));
  await waitFor(() => expect(body).not.toBeNull());
  expect(body).not.toHaveProperty('start_time');
  expect(String(body!.end_time)).toMatch(/Z$/);
  expect(screen.queryByText('Początek nie może być starszy niż 30 dni.')).not.toBeInTheDocument();
});

test('ERROR open longer than 48 hours warns and rejects an end of now', async () => {
  let patched = false;
  const start = new Date(FROZEN.getTime() - SESSION_MAX_DURATION_MS - 60_000);
  server.use(
    http.get('/api/v1/sessions/2', () => HttpResponse.json({
      ...fixtures.sessionError,
      start_time: start.toISOString(),
      end_time: null,
    })),
    http.patch('/api/v1/sessions/2', () => {
      patched = true;
      return HttpResponse.json(fixtures.sessionError);
    }),
  );
  const user = userEvent.setup();
  renderAppRoutes(<Route path="/sessions/:id/edit" element={<SessionFormPage />} />, { route: '/sessions/2/edit' });
  expect(await screen.findByText(/Ta sesja trwa już ponad 48 godzin/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Odrzuć sesję/i })).toBeInTheDocument();
  setTime('session-end', localInput(FROZEN));
  await user.click(screen.getByRole('button', { name: /Zapisz zmiany/i }));
  expect(await screen.findByText('Sesja nie może trwać dłużej niż 48 godzin.')).toBeInTheDocument();
  expect(patched).toBe(false);
  setTime('session-end', localInput(new Date(start.getTime() + 60 * 60 * 1000)));
  await user.click(screen.getByRole('button', { name: /Zapisz zmiany/i }));
  await waitFor(() => expect(patched).toBe(true));
});

test('a mapped duration 422 shows the field message and no toast', async () => {
  server.use(http.post('/api/v1/sessions', () =>
    HttpResponse.json({ detail: 'session duration exceeds 48 hours' }, { status: 422 })));
  const user = userEvent.setup();
  renderAppRoutes(<Route path="/sessions/new" element={<SessionFormPage />} />, { route: '/sessions/new' });
  await pickFirstGame(user);
  setTime('session-start', localInput(new Date(FROZEN.getTime() - 60 * 60 * 1000)));
  setTime('session-end', localInput(FROZEN));
  await user.click(screen.getByRole('button', { name: /Zapisz sesję/i }));
  expect(await screen.findByText('Sesja nie może trwać dłużej niż 48 godzin.')).toBeInTheDocument();
  expect(screen.queryByText('session duration exceeds 48 hours')).not.toBeInTheDocument();
  expect(useToastStore.getState().toasts).toHaveLength(0);
});

test('a pydantic list 422 toasts the generic save failure', async () => {
  server.use(http.post('/api/v1/sessions', () =>
    HttpResponse.json({
      detail: [{
        type: 'value_error',
        loc: ['body', 'start_time'],
        msg: 'Value error, datetime must include a timezone offset',
      }],
    }, { status: 422 })));
  const user = userEvent.setup();
  renderAppRoutes(<Route path="/sessions/new" element={<SessionFormPage />} />, { route: '/sessions/new' });
  await pickFirstGame(user);
  setTime('session-start', localInput(new Date(FROZEN.getTime() - 60 * 60 * 1000)));
  setTime('session-end', localInput(FROZEN));
  await user.click(screen.getByRole('button', { name: /Zapisz sesję/i }));
  await waitFor(() => {
    expect(useToastStore.getState().toasts[0]?.message).toBe('Nie udało się zapisać sesji.');
  });
  expect(screen.queryByText(/Value error/)).not.toBeInTheDocument();
  expect(screen.queryByText('Sesja nie może trwać dłużej niż 48 godzin.')).not.toBeInTheDocument();
});

