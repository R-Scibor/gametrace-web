import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test/utils';
import { CatalogFilters } from './CatalogFilters';

describe('CatalogFilters', () => {
  it('offers an all-statuses option that clears the status filter', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CatalogFilters q="" status="NEEDS_REVIEW" sort="sessions_desc" onChange={onChange} />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Status'), '');

    expect(onChange).toHaveBeenCalledWith({ status: undefined });
  });

  it('exposes a sort control', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CatalogFilters q="" status="NEEDS_REVIEW" sort="sessions_desc" onChange={onChange} />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Sortowanie'), 'name_asc');

    expect(onChange).toHaveBeenCalledWith({ sort: 'name_asc' });
  });
});
