import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { beforeEach, expect, test } from 'vitest';
import i18n from '../i18n';
import { PrivacyPage, PRIVACY_CONTACT_EMAIL } from './PrivacyPage';
import { renderAppRoutes, renderWithProviders, resetStores } from '../../test/utils';

beforeEach(() => {
  resetStores();
  void i18n.changeLanguage('pl');
});

test('PrivacyPage is public and shows PL stub content', () => {
  renderAppRoutes(<Route path="/privacy" element={<PrivacyPage />} />, {
    route: '/privacy',
    authenticated: false,
  });

  expect(screen.getByRole('heading', { level: 1, name: /polityka prywatności/i })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(/wersja robocza/i);
  expect(screen.getByText(/administrator danych/i)).toBeInTheDocument();
  expect(screen.getByText(/usuwanie konta/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: PRIVACY_CONTACT_EMAIL })).toHaveAttribute(
    'href',
    `mailto:${PRIVACY_CONTACT_EMAIL}`,
  );
  expect(screen.getByRole('link', { name: /strona główna/i })).toHaveAttribute('href', '/welcome');
});

test('PrivacyPage language select switches to English', async () => {
  const user = userEvent.setup();
  renderAppRoutes(<Route path="/privacy" element={<PrivacyPage />} />, {
    route: '/privacy',
    authenticated: false,
  });

  await user.selectOptions(screen.getByLabelText(/język/i), 'en');

  expect(screen.getByRole('heading', { level: 1, name: /privacy policy/i })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(/working draft/i);
  expect(screen.getByText(/data controller/i)).toBeInTheDocument();
});

test('PrivacyPage remains reachable when authenticated', () => {
  renderAppRoutes(<Route path="/privacy" element={<PrivacyPage />} />, {
    route: '/privacy',
    authenticated: true,
  });

  expect(screen.getByRole('heading', { level: 1, name: /polityka prywatności/i })).toBeInTheDocument();
});

test('links the deletion section to the public delete-account page', async () => {
  await i18n.changeLanguage('pl');
  renderWithProviders(<PrivacyPage />, { authenticated: false });
  const link = screen.getByRole('link', { name: /Jak usunąć konto/ });
  expect(link).toHaveAttribute('href', '/delete-account');
});

test('no longer says deletion is coming soon', async () => {
  await i18n.changeLanguage('pl');
  renderWithProviders(<PrivacyPage />, { authenticated: false });
  expect(screen.queryByText(/Wkrótce/)).not.toBeInTheDocument();
});
