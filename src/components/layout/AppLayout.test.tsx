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

function renderLayout(route = '/') {
  return renderAppRoutes(
    <Route element={<AppLayout />}>
      <Route path="/" element={<div>Dashboard content</div>} />
      <Route path="/library" element={<div>Library content</div>} />
    </Route>,
    { route, authenticated: true },
  );
}

const burger = () => screen.getByRole('button', { name: 'Otwórz menu' });
const sidebar = () => document.querySelector('aside') as HTMLElement;

test('burger starts collapsed and points at the sidebar', () => {
  renderLayout();

  expect(burger()).toHaveAttribute('aria-expanded', 'false');
  expect(burger()).toHaveAttribute('aria-controls', sidebar().id);
  expect(sidebar().id).not.toBe('');
  expect(sidebar()).toHaveAttribute('data-open', 'false');
  expect(document.body.style.overflow).toBe('');
});

test('burger opens the drawer, moves focus into it and locks body scroll', async () => {
  const user = userEvent.setup();
  renderLayout();

  await user.click(burger());

  expect(burger()).toHaveAttribute('aria-expanded', 'true');
  expect(sidebar()).toHaveAttribute('data-open', 'true');
  expect(screen.getByRole('button', { name: 'Zamknij menu' })).toHaveFocus();
  expect(document.body.style.overflow).toBe('hidden');
});

test('Escape closes the drawer, returns focus to the burger and unlocks scroll', async () => {
  const user = userEvent.setup();
  renderLayout();
  await user.click(burger());

  await user.keyboard('{Escape}');

  expect(burger()).toHaveAttribute('aria-expanded', 'false');
  expect(sidebar()).toHaveAttribute('data-open', 'false');
  expect(burger()).toHaveFocus();
  expect(document.body.style.overflow).toBe('');
});

test('the close button closes the drawer', async () => {
  const user = userEvent.setup();
  renderLayout();
  await user.click(burger());

  await user.click(screen.getByRole('button', { name: 'Zamknij menu' }));

  expect(burger()).toHaveAttribute('aria-expanded', 'false');
  expect(burger()).toHaveFocus();
});

test('clicking the backdrop closes the drawer', async () => {
  const user = userEvent.setup();
  const { container } = renderLayout();
  expect(container.querySelector('[class*="backdrop"]')).toBeNull();
  await user.click(burger());

  const backdrop = container.querySelector('[class*="backdrop"]') as HTMLElement;
  expect(backdrop).not.toBeNull();
  await user.click(backdrop);

  expect(burger()).toHaveAttribute('aria-expanded', 'false');
  expect(container.querySelector('[class*="backdrop"]')).toBeNull();
});

test('navigating to another route closes the drawer', async () => {
  const user = userEvent.setup();
  renderLayout();
  await user.click(burger());

  await user.click(screen.getByRole('link', { name: 'Biblioteka' }));

  expect(await screen.findByText('Library content')).toBeInTheDocument();
  expect(burger()).toHaveAttribute('aria-expanded', 'false');
  expect(sidebar()).toHaveAttribute('data-open', 'false');
  expect(document.body.style.overflow).toBe('');
});

test('Tab wraps inside the open drawer in both directions', async () => {
  const user = userEvent.setup();
  renderLayout();
  await user.click(burger());

  const focusables = Array.from(
    sidebar().querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
  );
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  last.focus();
  await user.tab();
  expect(first).toHaveFocus();

  await user.tab({ shift: true });
  expect(last).toHaveFocus();
});

test('Escape closes only the logout dialog while it is open on top of the drawer', async () => {
  const user = userEvent.setup();
  renderLayout();
  await user.click(burger());
  await user.click(screen.getByRole('button', { name: 'Wyloguj się' }));
  expect(await screen.findByRole('alertdialog')).toBeInTheDocument();

  await user.keyboard('{Escape}');

  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(burger()).toHaveAttribute('aria-expanded', 'true');
});

test('burger and close labels follow the active language', async () => {
  const user = userEvent.setup();
  renderLayout();
  await user.click(burger());
  expect(screen.getByRole('button', { name: 'Zamknij menu' })).toBeInTheDocument();

  await act(async () => {
    await i18n.changeLanguage('en');
  });

  expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
});
