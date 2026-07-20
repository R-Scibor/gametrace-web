import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test/utils';
import { fixtures } from '../../../../test/fixtures';
import { ReportInspector } from './ReportInspector';

describe('ReportInspector', () => {
  const item = fixtures.adminReports.items[0];

  it('prompts to pick a report when nothing is selected', () => {
    renderWithProviders(<ReportInspector item={null} onTriage={vi.fn()} isPending={false} />);

    expect(screen.getByText(/Wybierz zgłoszenie z listy/i)).toBeInTheDocument();
  });

  it('renders the message and context as readable rows', () => {
    renderWithProviders(<ReportInspector item={item} onTriage={vi.fn()} isPending={false} />);

    expect(screen.getByText('Nie mogę dodać sesji na telefonie')).toBeInTheDocument();
    expect(screen.getByText('screen')).toBeInTheDocument();
    expect(screen.getByText('SessionForm')).toBeInTheDocument();
    expect(screen.getByText('app_version')).toBeInTheDocument();
    expect(screen.getByText('1.4.2')).toBeInTheDocument();
  });

  it('triages as handled', async () => {
    const onTriage = vi.fn();
    renderWithProviders(<ReportInspector item={item} onTriage={onTriage} isPending={false} />);

    await userEvent.click(screen.getByRole('button', { name: /Oznacz jako obsłużone/i }));

    expect(onTriage).toHaveBeenCalledWith('triaged');
  });

  it('triages as closed', async () => {
    const onTriage = vi.fn();
    renderWithProviders(<ReportInspector item={item} onTriage={onTriage} isPending={false} />);

    await userEvent.click(screen.getByRole('button', { name: /Zamknij/i }));

    expect(onTriage).toHaveBeenCalledWith('closed');
  });
});
