import { test, expect, beforeEach, vi } from 'vitest';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { renderAppRoutes, resetStores } from '../../../test/utils';
import { AppLayout } from './AppLayout';
import i18n from '../../i18n';

beforeEach(() => {
  resetStores();
});

test('skip link is the first link in the document', () => {
  renderAppRoutes(
    <Route element={<AppLayout />}>
      <Route path="/" element={<div>Dashboard content</div>} />
    </Route>,
    { route: '/', authenticated: true },
  );

  const links = screen.getAllByRole('link');
  expect(links[0]).toHaveAttribute('href', '#main-content');
  expect(links[0]).toHaveTextContent('Przejdź do treści');
});

test('clicking the skip link moves focus to the main element', async () => {
  const scrollIntoView = vi.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  const user = userEvent.setup();

  try {
    renderAppRoutes(
      <Route element={<AppLayout />}>
        <Route path="/" element={<div>Dashboard content</div>} />
      </Route>,
      { route: '/', authenticated: true },
    );

    const skipLink = screen.getByRole('link', { name: 'Przejdź do treści' });
    const main = screen.getByRole('main');

    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
    expect(main).not.toHaveFocus();

    await user.click(skipLink);

    expect(main).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('');
  } finally {
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  }
});

test('skip link label follows active language', async () => {
  renderAppRoutes(
    <Route element={<AppLayout />}>
      <Route path="/" element={<div>Dashboard content</div>} />
    </Route>,
    { route: '/', authenticated: true },
  );

  expect(screen.getByRole('link', { name: 'Przejdź do treści' })).toBeInTheDocument();

  await act(async () => {
    await i18n.changeLanguage('en');
  });

  expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument();
});
