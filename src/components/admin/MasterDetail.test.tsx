import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/utils';
import { MasterDetail } from './MasterDetail';

describe('MasterDetail', () => {
  it('renders both panes', () => {
    renderWithProviders(
      <MasterDetail list={<p>lista</p>} inspector={<p>inspektor</p>} />,
    );

    expect(screen.getByText('lista')).toBeInTheDocument();
    expect(screen.getByText('inspektor')).toBeInTheDocument();
  });
});
