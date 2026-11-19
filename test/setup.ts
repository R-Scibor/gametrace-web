import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { server } from './server';
import { resetStores } from './utils';
import i18n from '../src/i18n';

// Ensure MSW XMLHttpRequest interceptor always finds ProgressEvent on globalThis
if (typeof globalThis.ProgressEvent === 'undefined' && typeof window !== 'undefined' && window.ProgressEvent) {
  globalThis.ProgressEvent = window.ProgressEvent;
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetStores();
  localStorage.clear();
  void i18n.changeLanguage('pl');
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
