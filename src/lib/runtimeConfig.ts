export type RuntimeConfigKey =
  | 'VITE_DISCORD_CLIENT_ID'
  | 'VITE_DISCORD_SERVER_INVITE_URL'
  | 'VITE_DISCORD_BOT_INVITE_URL'
  | 'VITE_APP_VERSION';

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: Partial<Record<RuntimeConfigKey, string>>;
  }
}

/**
 * Reads runtime config injected by the container entrypoint (`/env-config.js`)
 * before falling back to Vite build-time / Vitest `import.meta.env`.
 */
export function getRuntimeEnv(key: RuntimeConfigKey): string {
  if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) {
    const runtime = window.__RUNTIME_CONFIG__;
    if (Object.prototype.hasOwnProperty.call(runtime, key) && runtime[key] != null) {
      return String(runtime[key]);
    }
  }
  return String(import.meta.env[key] ?? '');
}
