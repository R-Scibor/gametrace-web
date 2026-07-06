// Dev-only username login (POST /auth/login). Primary path is the Discord link code.
export const DEV_USERNAME_LOGIN =
  import.meta.env.VITE_DEV_USERNAME_LOGIN === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_DEV_USERNAME_LOGIN !== 'false');