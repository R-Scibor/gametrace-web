import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../test/utils';
import { fixtures } from '../../../../test/fixtures';
import { CatalogInspector } from './CatalogInspector';

describe('CatalogInspector', () => {
  const item = fixtures.adminCatalogGames.items[0];

  it('prompts to pick a game when nothing is selected', () => {
    renderWithProviders(<CatalogInspector item={null} onMerged={vi.fn()} />);

    expect(screen.getByText(/Wybierz grę z tabeli/i)).toBeInTheDocument();
  });

  it('renders the selected game header and composed sections', () => {
    renderWithProviders(<CatalogInspector item={item} onMerged={vi.fn()} />);

    expect(screen.getByText(item.primary_name)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`#${item.id}`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${item.session_count} sesji`))).toBeInTheDocument();

    // Aliases section (Task 5)
    expect(screen.getByText(item.aliases[0])).toBeInTheDocument();
    // Actions section (Task 7)
    expect(screen.getByRole('button', { name: 'Powiąż z IGDB' })).toBeInTheDocument();
    // Merge section (this task)
    expect(screen.getByLabelText('Szukaj gry docelowej')).toBeInTheDocument();
  });
});
