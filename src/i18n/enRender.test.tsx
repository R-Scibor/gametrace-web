import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderPage } from '../../test/utils';
import { SettingsPage } from '../pages/SettingsPage';
import i18n from './index';

describe('English rendering', () => {
  // `test/setup.ts` resets back to `pl` before every test, so no teardown is needed.
  beforeEach(() => {
    void i18n.changeLanguage('en');
  });

  it('renders the settings screen in English', async () => {
    renderPage(<SettingsPage />, { route: '/settings' });
    expect(await screen.findByText('Settings')).toBeInTheDocument();
    expect(await screen.findByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Timezone')).toBeInTheDocument();
  });

  it('does not show the Polish title in English mode', async () => {
    renderPage(<SettingsPage />, { route: '/settings' });
    await screen.findByText('Settings');
    expect(screen.queryByText('Ustawienia')).not.toBeInTheDocument();
  });
});
