import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
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
  expect(screen.getByRole('button', { name: 'Szukaj online' })).toBeInTheDocument();
});

test('online search reveals candidates and the unrecognized-create button', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'kingdom hearts');
  await user.click(await screen.findByRole('button', { name: 'Szukaj online' }));

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
  await user.click(await screen.findByRole('button', { name: 'Szukaj online' }));
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
  await user.click(await screen.findByRole('button', { name: 'Szukaj online' }));

  expect(await screen.findByText('Brak wyników online')).toBeInTheDocument();
  expect(screen.getByText(/mimo to/)).toBeInTheDocument();
});

test('match failure shows the error and offers a retry', async () => {
  const user = userEvent.setup();
  renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'igdb-down');
  await user.click(await screen.findByRole('button', { name: 'Szukaj online' }));

  expect(
    await screen.findByText('Nie udało się połączyć z bazą gier.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Spróbuj ponownie' })).toBeInTheDocument();
});

test('create failure keeps the dropdown open and preserves the query', async () => {
  const user = userEvent.setup();
  const { onChange } = renderSelect();

  const input = await screen.findByRole('combobox');
  await user.type(input, 'create-fails');
  await user.click(await screen.findByRole('button', { name: 'Szukaj online' }));
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
  await user.click(await screen.findByRole('button', { name: 'Szukaj online' }));
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
