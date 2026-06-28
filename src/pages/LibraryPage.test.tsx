import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, beforeEach } from 'vitest';
import { LibraryPage } from './LibraryPage';
import { renderPage, resetStores } from '../../test/utils';

beforeEach(() => {
  resetStores();
});

test('LibraryPage renders all games by default', async () => {
  renderPage(<LibraryPage />, { route: '/library' });

  expect(await screen.findByText('Biblioteka')).toBeInTheDocument();
  expect(await screen.findByText('Wiedźmin 3')).toBeInTheDocument();
  expect(screen.getByText('Cyberpunk 2077')).toBeInTheDocument();
});

test('LibraryPage search filters loaded games', async () => {
  const user = userEvent.setup();
  renderPage(<LibraryPage />, { route: '/library' });

  await screen.findByText('Wiedźmin 3');
  await user.type(screen.getByLabelText('Szukaj gry'), 'Cyber');

  await waitFor(() => {
    expect(screen.getByText('Cyberpunk 2077')).toBeInTheDocument();
  });
  expect(screen.queryByText('Wiedźmin 3')).not.toBeInTheDocument();
});

test('LibraryPage review tab shows only NEEDS_REVIEW games', async () => {
  const user = userEvent.setup();
  renderPage(<LibraryPage />, { route: '/library' });

  await screen.findByText('Wiedźmin 3');
  await user.click(screen.getByRole('button', { name: 'Do sprawdzenia' }));

  await waitFor(() => {
    expect(screen.getByText('Nieznana Gra')).toBeInTheDocument();
  });
  expect(screen.queryByText('Wiedźmin 3')).not.toBeInTheDocument();
});