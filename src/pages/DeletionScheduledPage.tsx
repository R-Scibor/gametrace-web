import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DeletionStatusPanel } from '../components/account/DeletionStatusPanel';
import { readScheduledDeletion } from '../lib/accountDeletion';
import type { DeletionStatus } from '../types/api';
import styles from './DeletionScheduledPage.module.css';

/**
 * Where the user lands right after scheduling deletion. Their token is already
 * dead, so there is no cancel button here — only instructions for getting back
 * in. Status resolves from router state first, then sessionStorage so a refresh
 * does not lose the purge date.
 */
export function DeletionScheduledPage() {
  const { t } = useTranslation('account');
  const location = useLocation();
  const fromState = (location.state as DeletionStatus | null) ?? null;
  const status = fromState ?? readScheduledDeletion();

  useEffect(() => {
    if (!status) return;
    const prev = document.title;
    document.title = t('scheduled.documentTitle');
    return () => {
      document.title = prev;
    };
  }, [t, status]);

  if (!status) {
    return <Navigate to="/delete-account" replace />;
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
