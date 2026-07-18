import { APK_DOWNLOAD_PATH } from './apkDownload';

/**
 * Absolute URL of the APK binary artifact.
 * For QR / share links use {@link getDownloadPageUrl} instead so scans land on the hub page.
 */
export function getApkDownloadUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${APK_DOWNLOAD_PATH}`;
  }
  return APK_DOWNLOAD_PATH;
}
