import { waitFor } from '@testing-library/react';
import { test, expect } from 'vitest';
import { useStatsSummary } from './useStats';
import { renderHookWithProviders } from '../../test/utils';

test('useStatsSummary does not fetch when enabled is false', async () => {
  const { result } = renderHookWithProviders(() => useStatsSummary(30, { enabled: false }));
  expect(result.current.isLoading).toBe(false);
  expect(result.current.data).toBeUndefined();
  expect(result.current.fetchStatus).toBe('idle');
});

test('useStatsSummary fetches by default', async () => {
  const { result } = renderHookWithProviders(() => useStatsSummary(30));
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
