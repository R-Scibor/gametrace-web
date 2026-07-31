import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test/utils';
import { fixtures } from '../../../../test/fixtures';
import { ReportInspector } from './ReportInspector';

describe('ReportInspector', () => {
  const item = fixtures.adminReports.items[0];
  const defaultProps = {
    onPatch: vi.fn(),
    onDelete: vi.fn(),
    isPending: false,
  };

  it('prompts to pick a report when nothing is selected', () => {
    renderWithProviders(<ReportInspector item={null} {...defaultProps} />);

    expect(screen.getByText(/Wybierz zgłoszenie z listy/i)).toBeInTheDocument();
  });

  it('renders the message and context as readable rows', () => {
    renderWithProviders(<ReportInspector item={item} {...defaultProps} />);

    expect(screen.getByText('Nie mogę dodać sesji na telefonie')).toBeInTheDocument();
    expect(screen.getByText('screen')).toBeInTheDocument();
    expect(screen.getByText('SessionForm')).toBeInTheDocument();
    expect(screen.getByText('app_version')).toBeInTheDocument();
    expect(screen.getByText('1.4.2')).toBeInTheDocument();
  });

  it('shows mark triaged and close for open reports and patches triaged', async () => {
    const onPatch = vi.fn();
    const open = { ...item, status: 'open' as const };
    renderWithProviders(
      <ReportInspector item={open} {...defaultProps} onPatch={onPatch} />,
    );

    expect(screen.getByRole('button', { name: /Oznacz jako obsłużone/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zamknij/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Oznacz jako obsłużone/i }));

    expect(onPatch).toHaveBeenCalledWith({ status: 'triaged' });
  });

  it('shows reopen and close for triaged reports', () => {
    const triaged = { ...item, status: 'triaged' as const };
    renderWithProviders(<ReportInspector item={triaged} {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Otwórz ponownie/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zamknij/i })).toBeInTheDocument();
  });

  it('shows reopen and mark triaged for closed reports', () => {
    const closed = { ...item, status: 'closed' as const };
    renderWithProviders(<ReportInspector item={closed} {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Otwórz ponownie/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Oznacz jako obsłużone/i })).toBeInTheDocument();
  });

  it('saves a note via onPatch with admin_note string', async () => {
    const onPatch = vi.fn();
    renderWithProviders(
      <ReportInspector item={item} {...defaultProps} onPatch={onPatch} />,
    );

    const textarea = screen.getByPlaceholderText(/Dlaczego oznaczyłeś lub zamknąłeś/i);
    await userEvent.type(textarea, 'repro on android');
    await userEvent.click(screen.getByRole('button', { name: /Zapisz notatkę/i }));

    expect(onPatch).toHaveBeenCalledWith({ admin_note: 'repro on android' });
  });

  it('clears the note via onPatch with admin_note null', async () => {
    const onPatch = vi.fn();
    const withNote = { ...item, admin_note: 'existing note' };
    renderWithProviders(
      <ReportInspector item={withNote} {...defaultProps} onPatch={onPatch} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Wyczyść notatkę/i }));

    expect(onPatch).toHaveBeenCalledWith({ admin_note: null });
  });

  it('confirms delete and calls onDelete', async () => {
    const onDelete = vi.fn();
    renderWithProviders(
      <ReportInspector item={item} {...defaultProps} onDelete={onDelete} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^Usuń$/i }));
    expect(screen.getByText(/Usunąć to zgłoszenie/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Usuń trwale/i }));

    expect(onDelete).toHaveBeenCalled();
  });

  it('disables status, note, and delete controls when isPending', () => {
    renderWithProviders(<ReportInspector item={item} {...defaultProps} isPending />);

    expect(screen.getByRole('button', { name: /Oznacz jako obsłużone/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Zamknij/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Zapisz notatkę/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Wyczyść notatkę/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Usuń$/i })).toBeDisabled();
    expect(screen.getByPlaceholderText(/Dlaczego oznaczyłeś lub zamknąłeś/i)).toBeDisabled();
  });

  it('shows the empty-diagnostics fallback when context has no keys', () => {
    const empty = { ...item, context: {} };
    renderWithProviders(<ReportInspector item={empty} {...defaultProps} />);

    expect(screen.getByText('Brak danych diagnostycznych.')).toBeInTheDocument();
    expect(screen.queryByText('screen')).not.toBeInTheDocument();
  });

  it('renders null and nested-object context values defensively', () => {
    const withMixedContext = {
      ...item,
      context: { crash_reason: null, device: { brand: 'Google', model: 'Pixel 8' } },
    };
    renderWithProviders(<ReportInspector item={withMixedContext} {...defaultProps} />);

    expect(screen.getByText('crash_reason')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('device')).toBeInTheDocument();
    expect(
      screen.getByText(JSON.stringify({ brand: 'Google', model: 'Pixel 8' })),
    ).toBeInTheDocument();
  });

  it('falls back to user_id when username is null', () => {
    const noUsername = { ...item, username: null };
    renderWithProviders(<ReportInspector item={noUsername} {...defaultProps} />);

    expect(screen.getByText(new RegExp(noUsername.user_id))).toBeInTheDocument();
  });
});
