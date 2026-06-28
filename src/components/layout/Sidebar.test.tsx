import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { test, expect } from 'vitest';

test('Sidebar renders nav links', () => {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  );
  expect(screen.getByText('Pulpit')).toBeInTheDocument();
  expect(screen.getByText('Biblioteka')).toBeInTheDocument();
  expect(screen.getByText('Statystyki')).toBeInTheDocument();
  expect(screen.getByText('Dodaj sesję')).toBeInTheDocument();
  expect(screen.getByText('Sesja głosowa')).toBeInTheDocument();
  expect(screen.getByText('Kosz')).toBeInTheDocument();
  expect(screen.getByText('Ustawienia')).toBeInTheDocument();
});
