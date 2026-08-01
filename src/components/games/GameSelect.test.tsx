import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import { beforeEach, expect, test, vi } from 'vitest';
import { GameSelect } from './GameSelect';
import { createTestQueryClient, resetStores, seedAuth } from '../../../test/utils';
import { server } from '../../../test/server';

/**
 * GameSelect is controlled: the chip only renders when `value` is set. A fixed
 * `value=""` would make every post-selection assertion fail for the wrong reason,
 * so the harness holds the value in state the way SessionFormPage does.
 */
function renderSelect(onChange = vi.fn()) {
  const client = createTestQueryClient();

  function Harness() {
    const [value, setValue] = useState<number | ''>('');
    return (
      <GameSelect
        id="session-game"
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange(v);
        }}
        aria-label="Gra"
      />
    );
  }

  render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  );
  return { onChange };
}

beforeEach(() => {
  resetStores();
  seedAuth();
});

test('selects a library game without any online call', async () => {
  const user = userEvent.setup();
  const { onChange } = renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'Cyber');

  await user.click(await screen.findByText('Cyberpunk 2077'));
  expect(onChange).toHaveBeenCalledWith(2);
});

test('shows catalog suggestions in their own group', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'hades');

  expect(await screen.findByText('Z katalogu')).toBeInTheDocument();
  expect(await screen.findByText('Hades')).toBeInTheDocument();
});

test('keeps the chip after picking a catalog game absent from the library', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'hades');
  await user.click(await screen.findByText('Hades'));

  // The chip must render from the ladder's selection record. Game 901 is not in
  // the picker list, so a picker-list lookup alone would render nothing here.
  // The chip inherits the aria-label prop, hence 'Gra' rather than changeAria.
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Gra' })).toHaveTextContent('Hades'),
  );
});

test('does not offer the unrecognized-create button before an online search', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'My Tiny Jam Game');
  // Nothing matches locally or in the catalog, so the browse empty state settles.
  await screen.findByText('Brak wyników');

  expect(screen.queryByText(/mimo to/)).not.toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Szukaj online' })).toBeInTheDocument();
});

test('online search reveals candidates and the unrecognized-create button', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'kingdom hearts');
  await user.click(await screen.findByRole('option', { name: 'Szukaj online' }));

  expect(
    await screen.findByText('Kingdom Hearts HD 1.5 + 2.5 ReMIX'),
  ).toBeInTheDocument();
  expect(screen.getByText(/mimo to/)).toBeInTheDocument();
});

test('keeps the chip after creating an unrecognized game', async () => {
  const user = userEvent.setup();
  const { onChange } = renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'My Tiny Jam Game');
  await user.click(await screen.findByRole('option', { name: 'Szukaj online' }));
  await user.click(await screen.findByText(/mimo to/));

  expect(onChange).toHaveBeenCalledWith(903);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Gra' })).toHaveTextContent(
      'My Tiny Jam Game',
    ),
  );
});

test('empty online results keep the unrecognized-create button visible', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'no-online-results');
  await user.click(await screen.findByRole('option', { name: 'Szukaj online' }));

  expect(await screen.findByText('Brak wyników online')).toBeInTheDocument();
  expect(screen.getByText(/mimo to/)).toBeInTheDocument();
});

test('match failure shows the error and offers a retry', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'igdb-down');
  await user.click(await screen.findByRole('option', { name: 'Szukaj online' }));

  expect(
    await screen.findByText('Nie udało się połączyć z bazą gier.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Spróbuj ponownie' })).toBeInTheDocument();
});

test('create failure keeps the dropdown open and preserves the query', async () => {
  const user = userEvent.setup();
  const { onChange } = renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'create-fails');
  await user.click(await screen.findByRole('option', { name: 'Szukaj online' }));
  await user.click(await screen.findByText(/mimo to/));

  expect(await screen.findByText('Nie udało się dodać gry.')).toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByRole('combobox')).toHaveValue('create-fails');
});

test('keeps the chip when the search query no longer matches the selected game', async () => {
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <GameSelect id="session-game" value={1} onChange={vi.fn()} aria-label="Gra" />
    </QueryClientProvider>,
  );

  // Arrived already-selected from the parent, so selectedMeta is null throughout.
  const chip = await screen.findByRole('button', { name: 'Gra' });
  expect(chip).toHaveTextContent('Wiedźmin 3');

  await user.click(chip);
  await user.type(await screen.findByRole('combobox'), 'zzz');
  await user.click(document.body);

  // The query is still 'zzz' and matches nothing. The chip must survive it.
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Gra' })).toHaveTextContent('Wiedźmin 3'),
  );
});

test('editing the query after an online search clears candidates', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'kingdom hearts');
  await user.click(await screen.findByRole('option', { name: 'Szukaj online' }));
  await screen.findByText('Kingdom Hearts HD 1.5 + 2.5 ReMIX');

  await user.type(input, '2');

  await waitFor(() =>
    expect(
      screen.queryByText('Kingdom Hearts HD 1.5 + 2.5 ReMIX'),
    ).not.toBeInTheDocument(),
  );
});

test('never calls POST /games/match while typing', async () => {
  const user = userEvent.setup();
  const matchRequests: string[] = [];
  const onRequestStart = ({ request }: { request: Request }) => {
    if (request.method === 'POST' && request.url.includes('/api/v1/games/match')) {
      matchRequests.push(request.url);
    }
  };
  server.events.on('request:start', onRequestStart);

  try {
    renderSelect();

    const input = await screen.findByRole('combobox');
    await user.type(input, 'kingdom hearts');
    // Suggest substring-matches its fixture and finds nothing for this query, so
    // the browse empty state settling is the deterministic signal that typing is done.
    await screen.findByText('Brak wyników');

    expect(matchRequests).toEqual([]);
  } finally {
    server.events.removeListener('request:start', onRequestStart);
  }
});

test('typing past a highlighted option clears aria-activedescendant instead of leaving a dangling reference', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'Cyber');
  await screen.findByText('Cyberpunk 2077');

  await user.keyboard('{ArrowDown}');
  expect(input).toHaveAttribute('aria-activedescendant', 'session-game-opt-lib-2');

  // The highlighted option is about to fall out of the rebuilt activatables array
  // entirely (no match for the new query). aria-activedescendant must not keep
  // pointing at an id that is no longer in the DOM.
  await user.type(input, 'punk zzz');
  await screen.findByText('Brak wyników');

  expect(input).not.toHaveAttribute('aria-activedescendant');
});

test('Enter after a full query change does not fire POST /games/match from a stale footer highlight', async () => {
  const user = userEvent.setup();
  const matchRequests: string[] = [];
  const onRequestStart = ({ request }: { request: Request }) => {
    if (request.method === 'POST' && request.url.includes('/api/v1/games/match')) {
      matchRequests.push(request.url);
    }
  };
  server.events.on('request:start', onRequestStart);

  try {
    renderSelect();

    const input = await screen.findByRole('combobox');
    await user.type(input, 'Cyber');
    await screen.findByText('Cyberpunk 2077');

    // Highlight "Szukaj online" — past the single library row.
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      'session-game-opt-search-online',
    );

    // Replace the ENTIRE query. The user changed their mind about what they're
    // looking for; they did not ask to spend an IGDB round trip on "Cyber".
    await user.keyboard('{Control>}a{/Control}');
    await user.type(input, 'elden ring');
    await waitFor(() => expect(input).not.toHaveAttribute('aria-activedescendant'));

    await user.keyboard('{Enter}');

    expect(matchRequests).toEqual([]);
  } finally {
    server.events.removeListener('request:start', onRequestStart);
  }
});

test('ArrowUp floors at "nothing active" and still opens a closed dropdown', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'Cyber');
  await screen.findByText('Cyberpunk 2077');

  await user.keyboard('{ArrowDown}');
  expect(input).toHaveAttribute('aria-activedescendant', 'session-game-opt-lib-2');

  // One more ArrowUp than there are items must land on "nothing active", not
  // clamp back to the first item — otherwise there is no way to back out of a
  // highlight without an Escape (which would also discard IGDB candidates).
  await user.keyboard('{ArrowUp}');
  expect(input).not.toHaveAttribute('aria-activedescendant');

  await user.keyboard('{Escape}');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

  await user.keyboard('{ArrowUp}');
  expect(screen.getByRole('listbox')).toBeInTheDocument();
});

test('arrow keys skip group headers and Enter selects an option', async () => {
  const user = userEvent.setup();
  const { onChange } = renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'Cyber');
  await screen.findByText('Cyberpunk 2077');

  await user.keyboard('{ArrowDown}{Enter}');

  expect(onChange).toHaveBeenCalledWith(2);
});

test('arrow keys reach the online-search footer action', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'Cyber');
  await screen.findByText('Cyberpunk 2077');

  // Pin the premise this test depends on: exactly one option for "Cyber", so the
  // second ArrowDown is guaranteed to land on the footer action rather than a
  // second option (e.g. a future catalog fixture that also matches "Cyber").
  // Scoped to the listbox itself, since footer action buttons are also
  // role="option" (aria-owned by the listbox) but live outside its DOM subtree.
  const listbox = screen.getByRole('listbox');
  expect(within(listbox).getAllByRole('option')).toHaveLength(1);

  await user.keyboard('{ArrowDown}');
  const searchOnlineBtn = screen.getByRole('option', { name: 'Szukaj online' });
  await user.keyboard('{ArrowDown}');
  expect(input).toHaveAttribute('aria-activedescendant', searchOnlineBtn.id);

  await user.keyboard('{Enter}');

  expect(
    await screen.findByText('Kingdom Hearts HD 1.5 + 2.5 ReMIX'),
  ).toBeInTheDocument();
});

test('Escape closes the dropdown without clearing candidates', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'kingdom hearts');
  await user.click(await screen.findByRole('option', { name: 'Szukaj online' }));
  await screen.findByText('Kingdom Hearts HD 1.5 + 2.5 ReMIX');

  await user.keyboard('{Escape}');
  expect(
    screen.queryByText('Kingdom Hearts HD 1.5 + 2.5 ReMIX'),
  ).not.toBeInTheDocument();

  await user.click(input);
  expect(
    await screen.findByText('Kingdom Hearts HD 1.5 + 2.5 ReMIX'),
  ).toBeInTheDocument();
});

test('a highlighted footer action survives a debounced catalog row landing mid-query', async () => {
  const user = userEvent.setup();
  // Real fixtures have no catalog match for "Cyber", so this test needs its own
  // handler: a catalog suggestion that resolves AFTER the library row (which is
  // synchronous, from the already-loaded picker cache) has already rendered. That
  // reproduces the exact race: mode and query stay put while `activatables` grows
  // in the middle from underneath an already-set highlight.
  server.use(
    http.get('/api/v1/games/suggest', async ({ request }) => {
      const url = new URL(request.url);
      const q = url.searchParams.get('q')?.trim();
      if (!q) return HttpResponse.json({ detail: 'q required' }, { status: 422 });
      await delay(150);
      return HttpResponse.json({
        total: 1,
        items: [
          {
            game_id: 950,
            primary_name: 'Cyber Suggestion',
            cover_image_url: null,
            enrichment_status: 'ENRICHED',
            score: 0.9,
          },
        ],
      });
    }),
  );

  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'Cyber');
  await screen.findByText('Cyberpunk 2077');

  // Only the library row exists yet — the catalog suggestion is still in flight
  // (debounced + delayed above). Scoped to the listbox: the footer action button
  // is also role="option" (aria-owned) but lives outside the listbox's DOM subtree.
  expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(1);

  // Highlight the LAST activatable while the array is still short: past the one
  // option, onto the "Szukaj online" footer action.
  await user.keyboard('{ArrowDown}{ArrowDown}');
  const searchOnlineBtn = screen.getByRole('option', { name: 'Szukaj online' });
  expect(input).toHaveAttribute('aria-activedescendant', searchOnlineBtn.id);

  // Let the debounced catalog row land. The activatable array now has a new
  // middle entry where "Szukaj online" used to sit at the old index.
  await screen.findByText('Cyber Suggestion');

  // The highlight must still identify "Szukaj online" by key, not have silently
  // slid onto the newly-inserted catalog row that now occupies its old index.
  expect(input).toHaveAttribute('aria-activedescendant', searchOnlineBtn.id);
  expect(searchOnlineBtn).toHaveAttribute('aria-selected', 'true');
  expect(
    screen.getByRole('option', { name: 'Cyber Suggestion' }),
  ).toHaveAttribute('aria-selected', 'false');

  // And Enter must still run the highlighted footer action — not the constraint
  // this whole plan protects: firing /games/match must always be a deliberate,
  // correctly-targeted action, never a side effect of a list reshuffling.
  await user.keyboard('{Enter}');
  expect(
    await screen.findByText('Kingdom Hearts HD 1.5 + 2.5 ReMIX'),
  ).toBeInTheDocument();
});

test('wires aria-activedescendant, aria-selected, and a stable id onto the highlighted option', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'Cyber');
  const optionText = await screen.findByText('Cyberpunk 2077');
  const optionEl = optionText.closest('[role="option"]') as HTMLElement;

  expect(optionEl).toHaveAttribute('id', 'session-game-opt-lib-2');
  expect(optionEl).toHaveAttribute('aria-selected', 'false');
  expect(input).not.toHaveAttribute('aria-activedescendant');

  await user.keyboard('{ArrowDown}');

  expect(optionEl).toHaveAttribute('aria-selected', 'true');
  expect(input).toHaveAttribute('aria-activedescendant', 'session-game-opt-lib-2');
});

test('group headers name the option group instead of appearing as invalid listbox children', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'Cyber');
  await screen.findByText('Cyberpunk 2077');

  const group = screen.getByRole('group', { name: 'Twoja biblioteka' });
  expect(within(group).getByRole('option', { name: 'Cyberpunk 2077' })).toBeInTheDocument();
});

test('listbox aria-owns tracks only the footer actions currently rendered', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'kingdom hearts');

  const listbox = await screen.findByRole('listbox');
  await waitFor(() =>
    expect(listbox).toHaveAttribute('aria-owns', 'session-game-opt-search-online'),
  );

  const searchOnlineBtn = screen.getByRole('option', { name: 'Szukaj online' });
  expect(searchOnlineBtn).toHaveAttribute('id', 'session-game-opt-search-online');

  await user.click(searchOnlineBtn);
  await screen.findByText('Kingdom Hearts HD 1.5 + 2.5 ReMIX');

  // Online mode: "Szukaj online" is gone, replaced by "Dodaj ... mimo to".
  expect(listbox).toHaveAttribute('aria-owns', 'session-game-opt-add-unrecognized');
  const addBtn = screen.getByRole('option', { name: /mimo to/ });
  expect(addBtn).toHaveAttribute('id', 'session-game-opt-add-unrecognized');
});
