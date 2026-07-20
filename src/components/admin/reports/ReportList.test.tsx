import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportList } from './ReportList';
import type { AdminReportItem } from '../../../types/api';

const items: AdminReportItem[] = [
  {
    id: 17,
    user_id: '123',
    username: 'testuser',
    message: 'Nie mogę dodać sesji',
    context: {},
    status: 'open',
    created_at: '2026-07-18T10:00:00Z',
  },
  {
    id: 15,
    user_id: '789',
    username: null,
    message: 'Statystyki się nie zgadzają',
    context: {},
    status: 'closed',
    created_at: '2026-07-14T08:00:00Z',
  },
];

describe('ReportList', () => {
  it('marks only the selected row as current', () => {
    render(<ReportList items={items} selectedId={17} onSelect={() => {}} />);

    const selected = screen.getByRole('button', { name: /Nie mogę dodać sesji/ });
    const other = screen.getByRole('button', { name: /Statystyki się nie zgadzają/ });

    expect(selected).toHaveAttribute('aria-current', 'true');
    expect(other).toHaveAttribute('aria-current', 'false');
  });

  it('marks no row as current when nothing is selected', () => {
    render(<ReportList items={items} selectedId={null} onSelect={() => {}} />);

    for (const row of screen.getAllByRole('button')) {
      expect(row).toHaveAttribute('aria-current', 'false');
    }
  });

  it('reports the clicked row id', async () => {
    const onSelect = vi.fn();
    render(<ReportList items={items} selectedId={null} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /Statystyki/ }));

    expect(onSelect).toHaveBeenCalledWith(15);
  });

  it('falls back to the user id when the username is missing', () => {
    render(<ReportList items={items} selectedId={null} onSelect={() => {}} />);

    expect(screen.getByRole('button', { name: /Statystyki/ })).toHaveTextContent('789');
    expect(screen.getByRole('button', { name: /Nie mogę/ })).toHaveTextContent('testuser');
  });

  it('renders statuses in Polish, never the raw API code', () => {
    render(<ReportList items={items} selectedId={null} onSelect={() => {}} />);

    expect(screen.getByRole('button', { name: /Nie mogę/ })).toHaveTextContent('Otwarte');
    expect(screen.getByRole('button', { name: /Statystyki/ })).toHaveTextContent('Zamknięte');
    expect(screen.queryByText(/\bopen\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bclosed\b/)).not.toBeInTheDocument();
  });
});
