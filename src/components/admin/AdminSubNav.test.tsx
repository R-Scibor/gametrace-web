import { test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { AdminSubNav } from './AdminSubNav';
import { renderPage } from '../../../test/utils';

test('AdminSubNav highlights active tab', () => {
  renderPage(<AdminSubNav />, { route: '/admin/catalog' });
  expect(screen.getByRole('link', { name: 'Katalog' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Operacje' })).not.toHaveAttribute('aria-current');
});