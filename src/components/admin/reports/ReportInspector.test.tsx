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

  it('shows the empty-diagnostics fallback when context has no keys', () => {
    const empty = { ...item, context: {} };
    renderWithProviders(<ReportInspector item={empty} onTriage={vi.fn()} isPending={false} />);

    expect(screen.getByText('Brak danych diagnostycznych.')).toBeInTheDocument();
    expect(screen.queryByText('screen')).not.toBeInTheDocument();
  });

  it('renders null and nested-object context values defensively', () => {
    const withMixedContext = {
      ...item,
      context: { crash_reason: null, device: { brand: 'Google', model: 'Pixel 8' } },
    };
    renderWithProviders(
      <ReportInspector item={withMixedContext} onTriage={vi.fn()} isPending={false} />,
    );

    expect(screen.getByText('crash_reason')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('device')).toBeInTheDocument();
    expect(
      screen.getByText(JSON.stringify({ brand: 'Google', model: 'Pixel 8' })),
    ).toBeInTheDocument();
  });

  it('hides triage actions when the report is not open', () => {
    const triaged = { ...item, status: 'triaged' as const };
    renderWithProviders(<ReportInspector item={triaged} onTriage={vi.fn()} isPending={false} />);

    expect(
      screen.queryByRole('button', { name: /Oznacz jako obsłużone/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Zamknij/i })).not.toBeInTheDocument();
  });

  it('shows triage actions when the report is open', () => {
    const open = { ...item, status: 'open' as const };
    renderWithProviders(<ReportInspector item={open} onTriage={vi.fn()} isPending={false} />);

    expect(screen.getByRole('button', { name: /Oznacz jako obsłużone/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zamknij/i })).toBeInTheDocument();
  });

  it('falls back to user_id when username is null', () => {
    const noUsername = { ...item, username: null };
    renderWithProviders(<ReportInspector item={noUsername} onTriage={vi.fn()} isPending={false} />);

    expect(screen.getByText(new RegExp(noUsername.user_id))).toBeInTheDocument();
  });
});
