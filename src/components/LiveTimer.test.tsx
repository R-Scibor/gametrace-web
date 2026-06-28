import { render, screen, act } from '@testing-library/react';
import { LiveTimer } from './LiveTimer';
import { test, expect } from 'vitest';
import { vi } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

test('LiveTimer formats time and ticks', () => {
  const now = new Date('2026-06-04T12:00:00Z').getTime();
  vi.setSystemTime(now);

  // 1h 2m 3s in the past
  const startIso = new Date(now - (3600 + 120 + 3) * 1000).toISOString();
  render(<LiveTimer startIso={startIso} />);
  
  expect(screen.getByText('01:02:03')).toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(screen.getByText('01:02:04')).toBeInTheDocument();
});
