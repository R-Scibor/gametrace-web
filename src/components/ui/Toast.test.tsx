import { render, screen, act } from '@testing-library/react';
import { test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToastViewport } from './Toast';
import { useToastStore } from '../../store/toastStore';
import { resetStores } from '../../../test/utils';

beforeEach(() => {
  resetStores();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test('ToastViewport renders pushed toast', () => {
  render(<ToastViewport />);
  act(() => {
    useToastStore.getState().pushToast({ type: 'success', message: 'Sesja zapisana.' });
  });
  expect(screen.getByText('Sesja zapisana.')).toBeInTheDocument();
});

test('ToastViewport auto-dismisses after 5 seconds', () => {
  render(<ToastViewport />);
  act(() => {
    useToastStore.getState().pushToast({ type: 'info', message: 'Test toast' });
  });
  expect(screen.getByText('Test toast')).toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(5000);
  });
  expect(screen.queryByText('Test toast')).not.toBeInTheDocument();
});

test('ToastViewport dismisses on click', () => {
  vi.useRealTimers();
  render(<ToastViewport />);
  act(() => {
    useToastStore.getState().pushToast({ type: 'error', message: 'Błąd zapisu' });
  });

  act(() => {
    screen.getByText('Błąd zapisu').click();
  });
  expect(screen.queryByText('Błąd zapisu')).not.toBeInTheDocument();
});