import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test/utils';
import { fixtures } from '../../../../test/fixtures';
import { CatalogTable } from './CatalogTable';

const items = fixtures.adminCatalogGames.items;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('CatalogTable', () => {
  it('marks the selected row on the row itself', async () => {
    renderWithProviders(
      <CatalogTable
        items={items}
        total={items.length}
        skip={0}
        limit={50}
        selectedId={items[0].id}
        onSelect={vi.fn()}
        onPage={vi.fn()}
      />,
    );

    const row = screen.getByRole('row', {
      name: new RegExp(escapeRegExp(items[0].primary_name), 'i'),
    });
    expect(row).toHaveAttribute('aria-selected', 'true');
  });

  it('reports the clicked game', async () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <CatalogTable
        items={items}
        total={items.length}
        skip={0}
        limit={50}
        selectedId={null}
        onSelect={onSelect}
        onPage={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByText(items[1].primary_name));

    expect(onSelect).toHaveBeenCalledWith(items[1].id);
  });

  it('disables the previous control on the first page', () => {
    renderWithProviders(
      <CatalogTable
        items={items}
        total={100}
        skip={0}
        limit={50}
        selectedId={null}
        onSelect={vi.fn()}
        onPage={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Poprzednia' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Następna' })).toBeEnabled();
  });

  it('disables the next control on the last page', () => {
    renderWithProviders(
      <CatalogTable
        items={items}
        total={100}
        skip={50}
        limit={50}
        selectedId={null}
        onSelect={vi.fn()}
        onPage={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Poprzednia' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Następna' })).toBeDisabled();
  });

  it('advances to the next page with the correct skip', async () => {
    const onPage = vi.fn();
    renderWithProviders(
      <CatalogTable
        items={items}
        total={100}
        skip={0}
        limit={50}
        selectedId={null}
        onSelect={vi.fn()}
        onPage={onPage}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Następna' }));

    expect(onPage).toHaveBeenCalledWith(50);
  });

  it('shows an empty state when there are no items', () => {
    renderWithProviders(
      <CatalogTable
        items={[]}
        total={0}
        skip={0}
        limit={50}
        selectedId={null}
        onSelect={vi.fn()}
        onPage={vi.fn()}
      />,
    );

    expect(screen.getByText('Brak gier dla wybranego filtra.')).toBeInTheDocument();
  });
});
