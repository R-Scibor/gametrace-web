import { useEffect, useMemo, useRef } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { clearDiscordHandoff, readDiscordHandoff } from '../lib/discordOAuth';
import styles from './DiscordCallbackPage.module.css';

type Attempt =
  | { kind: 'exchange'; code: string; verifier: string; redirectUri: string }
  | { kind: 'error'; message: string };

/**
 * Reads the callback query and either produces the exchange inputs or the
 * reason we refuse to exchange. Pure — the stored handoff is only cleared once
 * the effect actually acts on it.
 */
function prepareAttempt(params: URLSearchParams, t: TFunction<'auth'>): Attempt {
  const oauthError = params.get('error');
  if (oauthError) {
    return {
      kind: 'error',
      message:
        oauthError === 'access_denied'
          ? t('errors.discordCancelled')
          : t('errors.discordDenied'),
    };
  }

  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) return { kind: 'error', message: t('errors.discordDenied') };

  // No handoff means a forged or expired state — never send the code onward.
  const handoff = readDiscordHandoff(state);
  if (!handoff) return { kind: 'error', message: t('errors.discordState') };

  return {
    kind: 'exchange',
    code,
    verifier: handoff.verifier,
    redirectUri: handoff.redirectUri,
  };
}

/**
 * Return leg of the Discord OAuth redirect. Exchanges the authorization code
 * once, then hands routing back to the same guard the login page uses, so one
 * place decides where an authenticated user goes.
 */
export function DiscordCallbackPage() {
  const { t } = useTranslation('auth');
  const [params] = useSearchParams();
  const { isAuthenticated, handleDiscordLogin, error: exchangeError } = useAuth();
  const pendingDeletion = useAuthStore((s) => s.pendingDeletion);

  const attempt = useMemo(
    () => prepareAttempt(params, t),
    // Evaluated once: the query is fixed for this mount, and re-reading after
    // the handoff is cleared would flip a successful attempt into an error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // The authorization code is single-use, so StrictMode's double effect (and
  // any re-render) must not exchange it twice.
  const startedRef = useRef(false);
  useEffect(() => {
    if (attempt.kind !== 'exchange' || startedRef.current) return;
    startedRef.current = true;
    clearDiscordHandoff();
    void handleDiscordLogin(attempt.code, attempt.verifier, attempt.redirectUri);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isAuthenticated) {
    return <Navigate to={pendingDeletion ? '/account/pending-deletion' : '/'} replace />;
  }

  const message = attempt.kind === 'error' ? attempt.message : exchangeError;

  return (
    <div className={styles.container}>
      <div className={styles.center}>
        <h1 className={styles.title}>
          Game<span className={styles.titleAccent}>Trace</span>
        </h1>
        {message ? (
          <>
            <p className={styles.error} role="alert">
              {message}
            </p>
            <Link to="/login" className={styles.backLink}>
              {t('discord.backToLogin')}
            </Link>
          </>
        ) : (
          <p className={styles.status}>{t('connecting')}</p>
        )}
      </div>
    </div>
  );
}
