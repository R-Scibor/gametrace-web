import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '../i18n';
import { NotFoundPage } from './NotFoundPage';
import { renderWithProviders, resetStores } from '../../test/utils';

describe('NotFoundPage', () => {
  beforeEach(async () => {
    resetStores();
    await i18n.changeLanguage('pl');
  });

  it('renders heading, description, and link to dashboard in PL', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Nie znaleziono strony' })).toBeInTheDocument();
    expect(screen.getByText('Ten adres nie istnieje albo został przeniesiony.')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Przejdź do Dashboardu' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
    expect(document.title).toBe('Nie znaleziono strony');
  });

  it('renders copy in EN when language is switched', async () => {
    await i18n.changeLanguage('en');
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('This address does not exist or was moved.')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Go to dashboard' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
    expect(document.title).toBe('Page not found');
  });
});
