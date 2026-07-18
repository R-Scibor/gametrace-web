/**
 * Public SPA path for the APK download hub (not the binary).
 * Trailing slash is canonical — nginx 302s `/download` → `/download/`, and the
 * SPA registers both so in-app navigation never hits the ProtectedRoute catch-all.
 */
export const DOWNLOAD_PAGE_PATH = '/download/';

/** Absolute URL for QR codes and share links to the download page. */
export function getDownloadPageUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${DOWNLOAD_PAGE_PATH}`;
  }
  return DOWNLOAD_PAGE_PATH;
}
