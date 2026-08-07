import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { DeleteAccountPage } from './DeleteAccountPage';
import { renderWithProviders, resetStores } from '../../test/utils';
import i18n from '../i18n';

beforeEach(async () => {
  resetStores();
  await i18n.changeLanguage('pl');
});

describe('DeleteAccountPage', () => {
  it('renders unauthenticated', () => {
    renderWithProviders(<DeleteAccountPage />, { authenticated: false });
    expect(screen.getByRole('heading', { name: 'Usuwanie konta', level: 1 })).toBeInTheDocument();
  });

  it('lists the steps and the contact email', () => {
    renderWithProviders(<DeleteAccountPage />, { authenticated: false });
    expect(screen.getByText(/Ustawienia → Konto/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sciborr08@gmail.com/ })).toBeInTheDocument();
  });

  it('does not claim the game catalogue is deleted', () => {
    renderWithProviders(<DeleteAccountPage />, { authenticated: false });
    expect(screen.getByText(/katalog gier nie zawiera/i)).toBeInTheDocument();
  });

  it('renders in English', async () => {
    await i18n.changeLanguage('en');
    renderWithProviders(<DeleteAccountPage />, { authenticated: false });
    expect(screen.getByRole('heading', { name: 'Account deletion', level: 1 })).toBeInTheDocument();
  });
});
