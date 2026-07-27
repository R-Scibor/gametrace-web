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
