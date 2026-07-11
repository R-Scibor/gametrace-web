import { APK_DOWNLOAD_PATH } from './apkDownload';

/** Absolute URL for QR codes and share links (same-origin in prod/dev). */
export function getApkDownloadUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${APK_DOWNLOAD_PATH}`;
  }
  return APK_DOWNLOAD_PATH;
}