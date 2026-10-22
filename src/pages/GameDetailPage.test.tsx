import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { test, expect, beforeEach } from 'vitest';
import { GameDetailPage } from './GameDetailPage';
import { renderAppRoutes, resetStores } from '../../test/utils';
import { server } from '../../test/server';
import { fixtures, gameIgnored } from '../../test/fixtures';
import { useLocalCoversStore } from '../store/localCoversStore';
import { ToastViewport } from '../components/ui/Toast';

beforeEach(() => {
  resetStores();
});

function renderGameDetail(gameId = 1) {
  return renderAppRoutes(
    <Route
      path="/library/:gameId"
      element={
        <>
          <ToastViewport />
          <GameDetailPage />
        </>
      }
    />,
    { route: `/library/${gameId}` },
  );
}

test('GameDetailPage deep link fetches GET /games/{id} without list scan', async () => {
  let getGameCalled = false;
  let listGamesCalled = false;

  server.use(
    http.get('/api/v1/games', () => {
      listGamesCalled = true;
      return HttpResponse.json({ total: 0, items: [] });
    }),
    http.get('/api/v1/games/:id', () => {
      getGameCalled = true;
      return HttpResponse.json(fixtures.gameNeedsReview);
    }),
  );

  renderAppRoutes(
    <Route path="/library/:gameId" element={<GameDetailPage />} />,
    { route: '/library/3' },
  );

  expect(await screen.findByRole('heading', { name: 'Nieznana Gra' })).toBeInTheDocument();
  expect(getGameCalled).toBe(true);
  expect(listGamesCalled).toBe(false);
});

test('GameDetailPage redirects to library on 404 game', async () => {
  server.use(
    http.get('/api/v1/games/:id', () =>
      HttpResponse.json({ detail: 'Game not found' }, { status: 404 }),
    ),
  );

  renderAppRoutes(
    <>
      <Route path="/library" element={<div data-testid="library">Biblioteka</div>} />
      <Route path="/library/:gameId" element={<GameDetailPage />} />
    </>,
    { route: '/library/999' },
  );

  expect(await screen.findByTestId('library')).toBeInTheDocument();
});

test('GameDetailPage renders game stats and session history', async () => {
  renderGameDetail();

  expect(await screen.findByRole('heading', { name: 'Wiedźmin 3' })).toBeInTheDocument();
  expect(screen.getByText('Historia sesji')).toBeInTheDocument();
  expect(screen.getByText('SESJE')).toBeInTheDocument();
});

test('menu opens/closes with Esc and returns focus', async () => {
  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  const trigger = screen.getByRole('button', { name: /Opcje gry/i });
  expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await user.click(trigger);
  expect(trigger).toHaveAttribute('aria-expanded', 'true');

  const menu = screen.getByRole('menu');
  expect(menu).toBeInTheDocument();

  const items = screen.getAllByRole('menuitem');
  expect(items[0]).toHaveFocus();

  await user.keyboard('{Escape}');
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test('ignore item calls mutation with {is_ignored:true}', async () => {
  let prefBody: Record<string, unknown> | null = null;
  server.use(
    http.put('/api/v1/user/preferences/:id', async ({ request }) => {
      prefBody = (await request.json()) as Record<string, unknown>;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));

  const ignoreItem = screen.getByRole('menuitem', { name: /Ignoruj grę/i });
  await user.click(ignoreItem);

  await waitFor(() => expect(prefBody).toEqual({ is_ignored: true }));
});

test('restore item when ignored', async () => {
  let prefBody: Record<string, unknown> | null = null;
  server.use(
    http.get('/api/v1/games/:id', () => HttpResponse.json(gameIgnored)),
    http.put('/api/v1/user/preferences/:id', async ({ request }) => {
      prefBody = (await request.json()) as Record<string, unknown>;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  const user = userEvent.setup();
  renderGameDetail(4);

  await screen.findByRole('heading', { name: 'Stara Gra' });
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));

  expect(screen.queryByRole('menuitem', { name: /Ignoruj grę/i })).not.toBeInTheDocument();
  const restoreItem = screen.getByRole('menuitem', { name: /Przywróć grę/i });
  await user.click(restoreItem);

  await waitFor(() => expect(prefBody).toEqual({ is_ignored: false }));
});

test('accept item only when canAccept', async () => {
  let prefBody: Record<string, unknown> | null = null;
  server.use(
    http.get('/api/v1/games/:id', ({ params }) => {
      if (params.id === '3') return HttpResponse.json(fixtures.gameNeedsReview);
      return HttpResponse.json(fixtures.game);
    }),
    http.put('/api/v1/user/preferences/:id', async ({ request }) => {
      prefBody = (await request.json()) as Record<string, unknown>;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  const user = userEvent.setup();
  const { unmount } = renderGameDetail(3);

  await screen.findByRole('heading', { name: 'Nieznana Gra' });
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));

  const acceptItem = screen.getByRole('menuitem', { name: /Akceptuj grę/i });
  expect(acceptItem).toBeInTheDocument();

  await user.click(acceptItem);
  await waitFor(() => expect(prefBody).toEqual({ is_ignored: false, is_accepted: true }));

  unmount();

  // Regular reviewed game does not show accept item
  renderGameDetail(1);
  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));
  expect(screen.queryByRole('menuitem', { name: /Akceptuj grę/i })).not.toBeInTheDocument();
});

test('change cover opens dialog', async () => {
  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));

  await user.click(screen.getByRole('menuitem', { name: /Zmień okładkę/i }));

  expect(await screen.findByRole('dialog', { name: /Okładka gry/i })).toBeInTheDocument();
});

test('IN USE badge on default when no local cover and on "Your cover" when local cover set', async () => {
  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));
  await user.click(screen.getByRole('menuitem', { name: /Zmień okładkę/i }));

  await screen.findByRole('dialog');

  // Without local cover, default cover is active
  const yourCoverCard = screen.getByRole('group', { name: 'Twoja okładka' });
  const defaultCoverCard = screen.getByRole('group', { name: 'Okładka domyślna' });

  expect(defaultCoverCard).toHaveAttribute('aria-current', 'true');
  expect(defaultCoverCard).toHaveTextContent('W UŻYCIU');
  expect(yourCoverCard).not.toHaveAttribute('aria-current');
  expect(yourCoverCard).toHaveTextContent('Nie ustawiono');

  // Set local cover via file input
  const file = new File(['cover'], 'cover.png', { type: 'image/png' });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, file);

  await waitFor(() => {
    expect(yourCoverCard).toHaveAttribute('aria-current', 'true');
    expect(yourCoverCard).toHaveTextContent('W UŻYCIU');
    expect(defaultCoverCard).not.toHaveAttribute('aria-current');
  });
});

test('file pick saves to localCoversStore', async () => {
  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));
  await user.click(screen.getByRole('menuitem', { name: /Zmień okładkę/i }));

  await screen.findByRole('dialog');

  const file = new File(['cover'], 'cover.png', { type: 'image/png' });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;

  await user.upload(input, file);

  await waitFor(() => {
    expect(useLocalCoversStore.getState().covers[1]).toBeTruthy();
  });
  expect(await screen.findByText('Okładka zapisana lokalnie.')).toBeInTheDocument();
});

test('reset clears local cover', async () => {
  useLocalCoversStore.setState({ covers: { 1: 'data:image/png;base64,test-image' } });
  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));
  await user.click(screen.getByRole('menuitem', { name: /Zmień okładkę/i }));

  await screen.findByRole('dialog');

  const resetBtn = screen.getByRole('button', { name: 'USUŃ SWOJĄ OKŁADKĘ' });
  await user.click(resetBtn);

  await waitFor(() => {
    expect(useLocalCoversStore.getState().covers[1]).toBeUndefined();
  });
  expect(await screen.findByText('Usunięto okładkę.')).toBeInTheDocument();
  // Focus stays inside the dialog after the reset button unmounts.
  expect(screen.getByRole('button', { name: /WYBIERZ OBRAZ/i })).toHaveFocus();
});

test('reset/remove menu item hidden without local cover', async () => {
  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));

  expect(screen.queryByRole('menuitem', { name: /Przywróć domyślną okładkę/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: /Usuń swoją okładkę/i })).not.toBeInTheDocument();

  // Open cover dialog and upload a local cover
  await user.click(screen.getByRole('menuitem', { name: /Zmień okładkę/i }));
  await screen.findByRole('dialog');

  const file = new File(['cover'], 'cover.png', { type: 'image/png' });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, file);
  await waitFor(() => expect(useLocalCoversStore.getState().covers[1]).toBeTruthy());

  // Close dialog
  await user.click(screen.getByRole('button', { name: /ZAMKNIJ/i }));

  // Re-open menu
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));
  const resetMenuItem = screen.getByRole('menuitem', { name: /Przywróć domyślną okładkę|Usuń swoją okładkę/i });
  expect(resetMenuItem).toBeInTheDocument();

  await user.click(resetMenuItem);
  await waitFor(() => {
    expect(useLocalCoversStore.getState().covers[1]).toBeUndefined();
  });
  expect(await screen.findByText('Usunięto okładkę.')).toBeInTheDocument();
});

test('menu supports arrow, Home and End keys', async () => {
  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));
  const items = screen.getAllByRole('menuitem');
  expect(items[0]).toHaveFocus();

  await user.keyboard('{ArrowDown}');
  expect(items[1]).toHaveFocus();
  await user.keyboard('{End}');
  expect(items[items.length - 1]).toHaveFocus();
  await user.keyboard('{ArrowDown}');
  expect(items[0]).toHaveFocus();
  await user.keyboard('{ArrowUp}');
  expect(items[items.length - 1]).toHaveFocus();
  await user.keyboard('{Home}');
  expect(items[0]).toHaveFocus();
});

test('closing the cover dialog returns focus to the options button', async () => {
  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  const trigger = screen.getByRole('button', { name: /Opcje gry/i });
  await user.click(trigger);
  await user.click(screen.getByRole('menuitem', { name: /Zmień okładkę/i }));
  expect(screen.getByRole('dialog', { name: 'Okładka gry' })).toBeInTheDocument();

  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test('report duplicate sends a merge-candidate report, never a merge', async () => {
  let reportBody: { message: string; context: Record<string, string> } | null = null;
  let mergeCalled = false;
  server.use(
    http.post('/api/v1/reports', async ({ request }) => {
      reportBody = (await request.json()) as typeof reportBody;
      return HttpResponse.json({ id: 1, created_at: '2026-10-22T10:00:00Z' }, { status: 201 });
    }),
    http.post('/api/v1/admin/games/:id/merge/:target', () => {
      mergeCalled = true;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));
  const items = screen.getAllByRole('menuitem');
  // Same position as on mobile: after the cover entries.
  expect(items[items.length - 1]).toHaveAccessibleName(/Zgłoś duplikat/);
  await user.click(items[items.length - 1]);

  const dialog = await screen.findByRole('dialog', { name: 'Zgłoś duplikat' });
  const send = within(dialog).getByRole('button', { name: 'WYŚLIJ ZGŁOSZENIE' });
  expect(send).toBeDisabled();
  // The source game is not offered as its own duplicate.
  const option = await within(dialog).findByRole('radio', { name: 'Cyberpunk 2077' });
  expect(within(dialog).queryByRole('radio', { name: 'Wiedźmin 3' })).not.toBeInTheDocument();

  await user.click(option);
  await user.type(within(dialog).getByLabelText('Notatka (opcjonalnie)'), 'ta sama okładka');
  await user.click(send);

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(reportBody!.message).toContain('kind: merge_candidate');
  expect(reportBody!.message).toContain('source_id: 1');
  expect(reportBody!.message).toContain('target_name: Cyberpunk 2077');
  expect(reportBody!.message).toContain('ta sama okładka');
  expect(reportBody!.context.platform).toBe('web');
  expect(reportBody!.context.screen).toBe('GameDetail');
  expect(mergeCalled).toBe(false);
  expect(await screen.findByText(/Dzięki! Sprawdzimy/)).toBeInTheDocument();
});

test('report duplicate keeps the dialog open with an error when sending fails', async () => {
  server.use(http.post('/api/v1/reports', () => new HttpResponse(null, { status: 500 })));
  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));
  await user.click(screen.getByRole('menuitem', { name: /Zgłoś duplikat/ }));
  const dialog = await screen.findByRole('dialog', { name: 'Zgłoś duplikat' });
  await user.click(await within(dialog).findByRole('radio', { name: 'Cyberpunk 2077' }));
  await user.click(within(dialog).getByRole('button', { name: 'WYŚLIJ ZGŁOSZENIE' }));

  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Nie udało się wysłać zgłoszenia');
  expect(screen.getByRole('dialog', { name: 'Zgłoś duplikat' })).toBeInTheDocument();
});

test('removing own cover without a default says "removed", not "restored"', async () => {
  server.use(
    http.get('/api/v1/games/:id', () =>
      HttpResponse.json({ ...fixtures.game, cover_image_url: null }),
    ),
  );
  useLocalCoversStore.setState({ covers: { 1: 'data:image/png;base64,test-image' } });
  const user = userEvent.setup();
  renderGameDetail();

  await screen.findByRole('heading', { name: 'Wiedźmin 3' });
  await user.click(screen.getByRole('button', { name: /Opcje gry/i }));
  await user.click(screen.getByRole('menuitem', { name: /Usuń swoją okładkę/ }));

  expect(await screen.findByText('Usunięto okładkę.')).toBeInTheDocument();
  expect(screen.queryByText('Przywrócono oryginalną okładkę.')).not.toBeInTheDocument();
});
