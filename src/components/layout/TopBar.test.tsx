import { test, expect } from 'vitest';
import { act, screen } from '@testing-library/react';
import { renderPage } from '../../../test/utils';
import { TopBar } from './TopBar';
import i18n from '../../i18n';

test('the page heading follows a language switch without a route change', async () => {
  renderPage(<TopBar />, { route: '/settings' });
  expect(await screen.findByRole('heading', { name: 'Ustawienia' })).toBeInTheDocument();

  // No navigation, no unrelated state change: only the language moves. Reading the
  // title through the i18n singleton left the old heading on screen here.
  await act(async () => {
    await i18n.changeLanguage('en');
  });

  expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Ustawienia' })).not.toBeInTheDocument();
});

test('the browser tab title names the current view', async () => {
  renderPage(<TopBar />, { route: '/library' });
  await screen.findByRole('heading', { name: 'Biblioteka' });
  expect(document.title).toBe('Biblioteka | GameTrace');
});

test('the burger is only rendered when the layout supplies a menu handler', async () => {
  const { unmount } = renderPage(<TopBar />, { route: '/library' });
  await screen.findByRole('heading', { name: 'Biblioteka' });
  expect(screen.queryByRole('button', { name: 'Otwórz menu' })).not.toBeInTheDocument();
  unmount();

  renderPage(<TopBar onMenuClick={() => {}} menuOpen menuControls="nav-id" />, { route: '/library' });
  const button = await screen.findByRole('button', { name: 'Otwórz menu' });
  expect(button).toHaveAttribute('aria-expanded', 'true');
  expect(button).toHaveAttribute('aria-controls', 'nav-id');
});
