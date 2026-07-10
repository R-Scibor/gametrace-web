import { screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import { AdminCatalogTable } from './AdminCatalogTable';
import { renderPage } from '../../../test/utils';
import { fixtures } from '../../../test/fixtures';

test('AdminCatalogTable renders NEEDS_REVIEW rows and session count', () => {
  renderPage(
    <AdminCatalogTable
      filter={{ status: 'NEEDS_REVIEW', skip: 0, limit: 50 }}
      items={fixtures.adminCatalogGames.items}
      total={fixtures.adminCatalogGames.total}
      isLoading={false}
      selectedId={null}
      onSelect={() => {}}
      onFilterChange={() => {}}
    />,
  );

  expect(screen.getByText('Kingdom Hearts HD 1.5 + 2.5 ReMIX')).toBeInTheDocument();
  expect(screen.getByText('26')).toBeInTheDocument();
});