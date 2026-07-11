import { http, HttpResponse } from 'msw';
import { test, expect } from 'vitest';
import { server } from '../../test/server';
import { APK_DOWNLOAD_PATH, isApkDownloadReady } from './apkDownload';

test('isApkDownloadReady returns true for APK magic bytes', async () => {
  server.use(
    http.get(APK_DOWNLOAD_PATH, () =>
      new HttpResponse(new Uint8Array([0x50, 0x4b, 0x03, 0x04]), {
        status: 206,
        headers: { 'Content-Type': 'application/vnd.android.package-archive' },
      }),
    ),
  );

  await expect(isApkDownloadReady()).resolves.toBe(true);
});

test('isApkDownloadReady returns false for HTML fallback', async () => {
  server.use(
    http.get(APK_DOWNLOAD_PATH, () =>
      HttpResponse.text('<!doctype html><html></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }),
    ),
  );

  await expect(isApkDownloadReady()).resolves.toBe(false);
});

test('isApkDownloadReady returns false on 404', async () => {
  server.use(http.get(APK_DOWNLOAD_PATH, () => new HttpResponse(null, { status: 404 })));

  await expect(isApkDownloadReady()).resolves.toBe(false);
});