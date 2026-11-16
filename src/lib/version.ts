const RELEASE_VERSION_RE = /^[vV]?(\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z._-]+)?(?:\+[0-9A-Za-z._-]+)?)$/;

export function releaseVersion(raw?: string | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const match = RELEASE_VERSION_RE.exec(trimmed);
  return match ? match[1] : null;
}
