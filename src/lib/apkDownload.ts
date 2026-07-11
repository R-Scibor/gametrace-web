const APK_MAGIC = [0x50, 0x4b, 0x03, 0x04] as const;

export const APK_DOWNLOAD_PATH = '/download/gametrace.apk';

/** True only when the origin returns ZIP/APK magic bytes (not SPA HTML or nginx 404). */
export async function isApkDownloadReady(): Promise<boolean> {
  try {
    const res = await fetch(APK_DOWNLOAD_PATH, {
      method: 'GET',
      headers: { Range: 'bytes=0-3' },
    });
    if (!res.ok && res.status !== 206) return false;

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length < 4) return false;

    return APK_MAGIC.every((byte, index) => bytes[index] === byte);
  } catch {
    return false;
  }
}