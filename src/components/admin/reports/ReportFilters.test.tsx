import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test/utils';
import type { AdminReportFacetsResponse } from '../../../types/api';
import { ReportFilters } from './ReportFilters';

const facets: AdminReportFacetsResponse = {
  screens: [
    { value: 'sessions', count: 4 },
    { value: 'stats', count: 2 },
  ],
  platforms: [
    { value: 'web', count: 5 },
    { value: 'mobile', count: 1 },
  ],
};

const defaultProps = {
  status: 'open' as const,
  q: '',
  screen: '',
  platform: '',
  facets,
  facetsLoading: false,
};

describe('ReportFilters', () => {
  it('emits status changes via onChange', async () => {
    const onChange = vi.fn();
    renderWithProviders(<ReportFilters {...defaultProps} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'closed');

    expect(onChange).toHaveBeenCalledWith({ status: 'closed' });
  });

  it('emits screen and platform facet changes via onChange', async () => {
    const onChange = vi.fn();
    renderWithProviders(<ReportFilters {...defaultProps} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText('Ekran'), 'sessions');
    expect(onChange).toHaveBeenCalledWith({ screen: 'sessions' });

    await userEvent.selectOptions(screen.getByLabelText('Platforma'), 'web');
    expect(onChange).toHaveBeenCalledWith({ platform: 'web' });
  });

  it('disables screen and platform selects when facets are loading', () => {
    renderWithProviders(
      <ReportFilters {...defaultProps} facets={undefined} facetsLoading onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText('Ekran')).toBeDisabled();
    expect(screen.getByLabelText('Platforma')).toBeDisabled();
  });
});
