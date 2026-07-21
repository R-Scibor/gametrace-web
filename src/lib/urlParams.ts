/**
 * Reads an integer URL search param, falling back to `fallback` when the raw
 * value is missing or not a finite whole number (e.g. `?skip=abc` or
 * `?game=NaN`). Without this guard `Number(...)` produces `NaN`, which then
 * serializes back into the URL as the literal string "NaN" and gets rejected
 * by the backend with a 422.
 */
export function parseIntParam(
  params: URLSearchParams,
  key: string,
  fallback: number,
): number {
  const raw = params.get(key);
  if (raw === null) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && Number.isInteger(value) ? value : fallback;
}

/** Same as `parseIntParam`, but returns `null` when the param is absent or invalid. */
export function parseIntParamOrNull(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && Number.isInteger(value) ? value : null;
}
