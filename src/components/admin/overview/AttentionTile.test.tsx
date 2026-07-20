import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../test/utils';
import { AttentionTile } from './AttentionTile';

describe('AttentionTile', () => {
  it('links to the target surface when there is work to do', () => {
    renderWithProviders(
      <AttentionTile label="Do sprawdzenia" value={12} to="/admin/catalog?status=NEEDS_REVIEW" />,
    );

    const link = screen.getByRole('link', { name: /Do sprawdzenia/i });
    expect(link).toHaveAttribute('href', '/admin/catalog?status=NEEDS_REVIEW');
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders inert with no link when the count is zero', () => {
    renderWithProviders(
      <AttentionTile label="Do sprawdzenia" value={0} to="/admin/catalog?status=NEEDS_REVIEW" />,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
