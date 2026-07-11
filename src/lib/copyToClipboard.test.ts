import { test, expect, afterEach, vi } from 'vitest';
import { copyFromInput, copyToClipboard } from './copyToClipboard';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

test('copyFromInput selects the field and uses Clipboard API when available', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  const original = navigator.clipboard;
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });

  const input = document.createElement('input');
  input.value = '/login';
  document.body.appendChild(input);

  const ok = await copyFromInput(input);
  expect(ok).toBe(true);
  expect(writeText).toHaveBeenCalledWith('/login');
  expect(input.selectionStart).toBe(0);
  expect(input.selectionEnd).toBe('/login'.length);

  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: original,
  });
});

test('copyToClipboard copies arbitrary text', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  const original = navigator.clipboard;
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });

  const ok = await copyToClipboard('/login');
  expect(ok).toBe(true);
  expect(writeText).toHaveBeenCalledWith('/login');

  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: original,
  });
});