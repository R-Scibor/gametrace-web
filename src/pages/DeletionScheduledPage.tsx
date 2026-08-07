import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DeletionStatusPanel } from '../components/account/DeletionStatusPanel';
import {
  isDeletionStatus,
  isScheduledDeletionConsumed,
  markScheduledDeletionConsumed,
  readScheduledDeletion,
} from '../lib/accountDeletion';
import { resumeAuthTeardown, teardownAuth } from '../lib/authTeardown';
import { useAuthStore } from '../store/authStore';
import styles from './DeletionScheduledPage.module.css';

/**
 * Where the user lands right after scheduling deletion. Their token is already
 * dead, so there is no cancel button here — only instructions for getting back
 * in. Status resolves from router state first, then sessionStorage so a refresh
 * does not lose the purge date. Router state is validated the same way as
 * sessionStorage — an unrelated navigation must not render a bogus purge date.
 */
export function DeletionScheduledPage() {
  const { t } = useTranslation('account');
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Read once at mount: teardown below flips it, and this must keep reporting
  // what was true when this particular mount started.
  const [alreadyConsumed] = useState(isScheduledDeletionConsumed);
  const status = useMemo(() => {
    const fromState = isDeletionStatus(location.state) ? location.state : null;
    return fromState ?? readScheduledDeletion();
  }, [location.state]);

  useEffect(() => {
    if (!status) return;
    const prev = document.title;
    document.title = t('scheduled.documentTitle');
    return () => {
      document.title = prev;
    };
  }, [t, status]);

  // Closes the window opened by the confirm dialog. Unconditional: leaving it
  // open would disable 401 auto-logout for the rest of the session.
  useEffect(() => {
    resumeAuthTeardown();
  }, []);

  // Teardown lives here, not in the dialog before navigating, so it can
  // never race ProtectedRoute: this route is public, so flipping
  // isAuthenticated to false here cannot trigger a redirect. By the time the
  // user is on this screen the backend has already revoked the token as
  // part of scheduling deletion, so this only clears already-dead client
  // state. Guarded on `status` so a visitor who lands here with nothing to
  // show (and gets redirected to /delete-account below) never gets signed
  // out, and on `alreadyConsumed` so only the mount that follows the request
  // itself tears anything down.
  useEffect(() => {
    if (!status || alreadyConsumed) return;
    markScheduledDeletionConsumed();
    teardownAuth();
  }, [status, alreadyConsumed]);

  if (!status) {
    return <Navigate to="/delete-account" replace />;
  }

  // Both the sessionStorage entry and the history entry carrying this status
  // outlive the visit, so this page is reachable again — pressing Back after
  // logging in to cancel. Someone holding a live token belongs on the gated
  // side of the app, not on a dead-token screen telling them to sign in.
  if (alreadyConsumed && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>{t('scheduled.eyebrow')}</p>
        <h1 className={styles.title}>{t('scheduled.title')}</h1>
        <p className={styles.lead}>{t('scheduled.lead')}</p>

        <DeletionStatusPanel status={status} />

        <h2 className={styles.sectionTitle}>{t('scheduled.cancelTitle')}</h2>
        <p className={styles.body}>{t('scheduled.cancelBody')}</p>

        <div className={styles.actions}>
          <Link to="/login" className={styles.primaryLink}>{t('scheduled.loginCta')}</Link>
          <Link to="/welcome" className={styles.secondaryLink}>{t('scheduled.homeCta')}</Link>
        </div>
      </div>
    </div>
  );
}
