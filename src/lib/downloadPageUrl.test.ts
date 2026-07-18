import { afterEach, expect, test, vi } from 'vitest';
import { DOWNLOAD_PAGE_PATH, getDownloadPageUrl } from './downloadPageUrl';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('getDownloadPageUrl returns path when window is unavailable', () => {
  vi.stubGlobal('window', undefined);
  expect(getDownloadPageUrl()).toBe(DOWNLOAD_PAGE_PATH);
});

test('getDownloadPageUrl returns absolute page URL, not APK path', () => {
  vi.stubGlobal('window', {
    location: { origin: 'https://gametrace.rscibor.dev' },
  });
  const url = getDownloadPageUrl();
  expect(url).toBe('https://gametrace.rscibor.dev/download/');
  expect(url).not.toContain('.apk');
});
