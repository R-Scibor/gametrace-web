import { describe, it, expect, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import { DeleteAccountPage } from './DeleteAccountPage';
import { renderWithProviders, resetStores } from '../../test/utils';
import i18n from '../i18n';

/** The section a heading introduces. The page is the URL Google Play publishes
 *  for data deletion, so several assertions below care which list a claim is
 *  in, not merely that the words appear somewhere on the page. */
function sectionFor(headingName: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: headingName });
  const section = heading.closest('section');
  if (!section) throw new Error(`No section wraps heading "${headingName}"`);
  return section as HTMLElement;
}

beforeEach(async () => {
  resetStores();
  await i18n.changeLanguage('pl');
});

describe('DeleteAccountPage', () => {
  it('renders unauthenticated', () => {
    renderWithProviders(<DeleteAccountPage />, { authenticated: false });
    expect(
      screen.getByRole('heading', { name: 'Usuwanie konta i danych', level: 1 }),
    ).toBeInTheDocument();
  });

  it('lists the steps and the contact email', () => {
    renderWithProviders(<DeleteAccountPage />, { authenticated: false });
    expect(screen.getByText(/Ustawienia → Konto/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sciborr08@gmail.com/ })).toBeInTheDocument();
  });

  it('names the shared catalogue as retained, never as deleted', () => {
    renderWithProviders(<DeleteAccountPage />, { authenticated: false });
    expect(
      within(sectionFor('Co zostaje usunięte')).queryByText(/katalog gier/i),
    ).not.toBeInTheDocument();
    expect(
      within(sectionFor('Co zostaje po usunięciu')).getByText(/katalog gier/i),
    ).toBeInTheDocument();
  });

  it('states what survives the purge, which Play requires the page to disclose', () => {
    renderWithProviders(<DeleteAccountPage />, { authenticated: false });
    const kept = within(sectionFor('Co zostaje po usunięciu'));
    expect(kept.getByText(/identyfikator Discord/i)).toBeInTheDocument();
    // The backup window is the one retention period not implied by the grace
    // period, so it has to be stated explicitly.
    expect(kept.getByText(/kopiach do 7 dni/i)).toBeInTheDocument();
  });

  it('offers deletion of individual data without closing the account', () => {
    renderWithProviders(<DeleteAccountPage />, { authenticated: false });
    const partial = within(sectionFor('Usuwanie części danych bez zamykania konta'));
    expect(partial.getByText(/pojedyncze sesje gier/i)).toBeInTheDocument();
    expect(partial.getByText(/powiadomienia push/i)).toBeInTheDocument();
  });

  it('renders in English', async () => {
    await i18n.changeLanguage('en');
    renderWithProviders(<DeleteAccountPage />, { authenticated: false });
    expect(
      screen.getByRole('heading', { name: 'Account and data deletion', level: 1 }),
    ).toBeInTheDocument();
    expect(
      within(sectionFor('What is kept after deletion')).getByText(/shared game catalog/i),
    ).toBeInTheDocument();
  });
});
