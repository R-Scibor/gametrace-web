import { render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { PolicyToc } from './PolicyToc';
import type { PolicySection } from '../../lib/privacyPolicy';

const sections: PolicySection[] = [
  { id: 'scope', title: 'Scope', blocks: [] },
  { id: 'account-deletion', title: 'Account deletion', blocks: [] },
];

beforeEach(() => {
  // jsdom has no IntersectionObserver; the component must still render its
  // links so the TOC is usable (and testable) without one.
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

test('renders one anchor per section pointing at its id', () => {
  render(<PolicyToc sections={sections} label="On this page" />);

  const nav = screen.getByRole('navigation', { name: 'On this page' });
  expect(nav).toBeInTheDocument();

  expect(screen.getByRole('link', { name: 'Scope' })).toHaveAttribute('href', '#scope');
  expect(screen.getByRole('link', { name: 'Account deletion' })).toHaveAttribute(
    'href',
    '#account-deletion',
  );
});

test('marks no entry current before any section is observed', () => {
  render(<PolicyToc sections={sections} label="On this page" />);
  expect(
    screen.queryByRole('link', { current: 'true' }),
  ).not.toBeInTheDocument();
});

test('renders nothing when there are no sections', () => {
  const { container } = render(<PolicyToc sections={[]} label="On this page" />);
  expect(container).toBeEmptyDOMElement();
});
