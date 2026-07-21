import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useToastStore } from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-dismisses a plain toast after 5s', () => {
    useToastStore.getState().pushToast({ type: 'success', message: 'Alias dodany.' });
    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(5000);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('does not auto-dismiss a toast with an action', () => {
    useToastStore.getState().pushToast({
      type: 'error',
      message: 'Konflikt sesji.',
      action: { label: 'Pokaż grę', to: '/library/1' },
    });
    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(60000);

    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it('still dismisses an action toast manually via dismissToast', () => {
    useToastStore.getState().pushToast({
      type: 'error',
      message: 'Konflikt sesji.',
      action: { label: 'Pokaż grę', to: '/library/1' },
    });
    const id = useToastStore.getState().toasts[0].id;

    useToastStore.getState().dismissToast(id);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
