import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import i18n from '../i18n';
import { PrivacyPage, PRIVACY_CONTACT_EMAIL } from './PrivacyPage';
import {
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY_VERSION,
  REQUIRED_SECTION_IDS,
} from '../lib/privacyPolicy';
import { ACCOUNT_DELETION_GRACE_DAYS } from '../lib/accountDeletion';
import { renderAppRoutes, renderWithProviders, resetStores } from '../../test/utils';

beforeEach(() => {
  resetStores();
  void i18n.changeLanguage('pl');
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

test('PrivacyPage is public and renders the full PL notice', () => {
  const { container } = renderAppRoutes(
    <Route path="/privacy" element={<PrivacyPage />} />,
    {
      route: '/privacy',
      authenticated: false,
    },
  );

  expect(
    screen.getByRole('heading', { level: 1, name: /polityka prywatności/i }),
  ).toBeInTheDocument();
  expect(container.textContent).toContain('Administratorem danych osobowych');
  expect(screen.getByRole('link', { name: /strona główna/i })).toHaveAttribute(
    'href',
    '/welcome',
  );
});

test('the draft banner is gone', () => {
  renderWithProviders(<PrivacyPage />, { authenticated: false });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.queryByText(/wersja robocza/i)).not.toBeInTheDocument();
});

test('every required section renders with its stable anchor id', () => {
  const { container } = renderWithProviders(<PrivacyPage />, { authenticated: false });

  for (const id of REQUIRED_SECTION_IDS) {
    expect(container.querySelector(`#${id}`)).not.toBeNull();
  }
  // The Discord bot deep-links here; renaming this id breaks inbound links.
  expect(container.querySelector('#account-deletion')).not.toBeNull();
});

test('the table of contents lists every section', () => {
  renderWithProviders(<PrivacyPage />, { authenticated: false });

  const nav = screen.getByRole('navigation', { name: /na tej stronie/i });
  const hrefs = within(nav)
    .getAllByRole('link')
    .map((link) => link.getAttribute('href'));

  expect(hrefs).toEqual(REQUIRED_SECTION_IDS.map((id) => `#${id}`));
});

test('the grace period comes from the shared constant, not a literal', () => {
  const { container } = renderWithProviders(<PrivacyPage />, { authenticated: false });
  const deletion = container.querySelector('#account-deletion');
  expect(deletion?.textContent).toContain(String(ACCOUNT_DELETION_GRACE_DAYS));
  expect(deletion?.textContent).not.toContain('{{days}}');
});

test('the contact email renders as a mailto link', () => {
  renderWithProviders(<PrivacyPage />, { authenticated: false });
  // Five occurrences across the notice (controller, account-deletion, rights,
  // children, changes), each a plain-text {{email}} inside a `p` block. Exact
  // count catches regressions where trailing punctuation gets swallowed into
  // the link, since a malformed anchor's accessible name no longer equals
  // PRIVACY_CONTACT_EMAIL and silently drops out of this query.
  const emailLinks = screen.getAllByRole('link', { name: PRIVACY_CONTACT_EMAIL });
  expect(emailLinks).toHaveLength(5);
  for (const link of emailLinks) {
    expect(link).toHaveAttribute('href', `mailto:${PRIVACY_CONTACT_EMAIL}`);
  }
});

test('links the deletion section to the public delete-account page', () => {
  renderWithProviders(<PrivacyPage />, { authenticated: false });
  const links = screen.getAllByRole('link');
  expect(
    links.some((link) => link.getAttribute('href') === '/delete-account'),
  ).toBe(true);
});

test('the header version comes from the shared constant, not a literal', () => {
  renderWithProviders(<PrivacyPage />, { authenticated: false });
  const banner = within(screen.getByRole('banner'));
  expect(
    banner.getByText(new RegExp(`wersja ${PRIVACY_POLICY_VERSION.replace(/\./g, '\\.')}`, 'i')),
  ).toBeInTheDocument();
  expect(banner.queryByText(/\{\{version\}\}/)).not.toBeInTheDocument();
  // PL month names; day and year must match PRIVACY_POLICY_EFFECTIVE_DATE.
  const [, month, day] = PRIVACY_POLICY_EFFECTIVE_DATE.split('-');
  const plMonths = [
    '',
    'stycznia',
    'lutego',
    'marca',
    'kwietnia',
    'maja',
    'czerwca',
    'lipca',
    'sierpnia',
    'września',
    'października',
    'listopada',
    'grudnia',
  ];
  const plDate = `${Number(day)} ${plMonths[Number(month)]} ${PRIVACY_POLICY_EFFECTIVE_DATE.slice(0, 4)}`;
  expect(banner.getByText(new RegExp(plDate.replace(/\s+/g, '\\s+'), 'i'))).toBeInTheDocument();
});

test('every table renders a header row', () => {
  renderWithProviders(<PrivacyPage />, { authenticated: false });

  // purposes (3x8), recipients (3x9), retention (2x11), account-deletion (2x5).
  const tables = screen.getAllByRole('table');
  expect(tables).toHaveLength(4);

  const headerCounts = tables.map(
    (table) => within(table).getAllByRole('columnheader').length,
  );
  expect(headerCounts).toEqual([3, 3, 2, 2]);
  expect(
    within(tables[0]).getByRole('columnheader', { name: 'Cel' }),
  ).toBeInTheDocument();
});

test('the notice sits in a main landmark', () => {
  renderWithProviders(<PrivacyPage />, { authenticated: false });
  expect(screen.getByRole('main')).toBeInTheDocument();
});

test('language select switches to English', async () => {
  const user = userEvent.setup();
  const { container } = renderAppRoutes(
    <Route path="/privacy" element={<PrivacyPage />} />,
    {
      route: '/privacy',
      authenticated: false,
    },
  );

  await user.selectOptions(screen.getByLabelText(/język/i), 'en');

  expect(
    screen.getByRole('heading', { level: 1, name: /privacy policy/i }),
  ).toBeInTheDocument();
  expect(container.textContent).toContain('controller for personal data');
});

test('remains reachable when authenticated', () => {
  renderAppRoutes(<Route path="/privacy" element={<PrivacyPage />} />, {
    route: '/privacy',
    authenticated: true,
  });

  expect(
    screen.getByRole('heading', { level: 1, name: /polityka prywatności/i }),
  ).toBeInTheDocument();
});

test('no raw {{email}} placeholder survives rendering anywhere on the page', () => {
  const { container } = renderWithProviders(<PrivacyPage />, { authenticated: false });
  expect(container.textContent).not.toContain('{{email}}');
});
