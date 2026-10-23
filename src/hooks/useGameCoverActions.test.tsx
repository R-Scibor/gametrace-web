import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { renderHookWithProviders, resetStores } from '../../test/utils';
import { useLocalCoversStore } from '../store/localCoversStore';
import { useToastStore } from '../store/toastStore';
import { useGameCoverActions } from './useGameCoverActions';

describe('useGameCoverActions', () => {
  beforeEach(() => {
    resetStores();
    useLocalCoversStore.setState({ covers: { 7: 'data:image/png;base64,x' } });
  });

  it('says "restored" when a catalog cover exists', () => {
    const { result } = renderHookWithProviders(() =>
      useGameCoverActions({ id: 7, cover_image_url: 'https://x/c.jpg' }),
    );
    act(() => result.current.clearLocalCover());
    expect(useLocalCoversStore.getState().covers[7]).toBeUndefined();
    expect(useToastStore.getState().toasts.at(-1)?.message).toMatch(/restor|przywr/i);
  });

  it('says "removed" when there is no catalog cover', () => {
    const { result } = renderHookWithProviders(() =>
      useGameCoverActions({ id: 7, cover_image_url: null }),
    );
    act(() => result.current.clearLocalCover());
    expect(useLocalCoversStore.getState().covers[7]).toBeUndefined();
    expect(useToastStore.getState().toasts.at(-1)?.message).toMatch(/remov|usuni/i);
  });
});
