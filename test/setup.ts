import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { server } from './server';
import { resetStores } from './utils';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetStores();
  localStorage.clear();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
