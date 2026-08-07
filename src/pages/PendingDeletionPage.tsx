import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { cancelDeletion } from '../api/profile';
import { clearScheduledDeletion } from '../lib/accountDeletion';
import { listOf } from '../lib/i18nList';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { DeletionStatusPanel } from '../components/account/DeletionStatusPanel';
import { Button } from '../components/ui';
import styles from './PendingDeletionPage.module.css';

/**
 * The blocking screen. Reached whenever pendingDeletion is set, because every
 * authed route except logout and the deletion endpoints 403s during the grace
 * period — there is no version of the app to show behind this.
 */
export function PendingDeletionPage() {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pendingDeletion = useAuthStore((s) => s.pendingDeletion);
  const setPendingDeletion = useAuthStore((s) => s.setPendingDeletion);
  const pushToast = useToastStore((s) => s.pushToast);

  useEffect(() => {
    const prev = document.title;
    document.title = t('pending.documentTitle');
    return () => {
      document.title = prev;
    };
  }, [t]);

  const cancel = useMutation({
    mutationFn: cancelDeletion,
    onSuccess: (result) => {
      // A 404 means nothing was scheduled. Same control flow — the user's intent
      // is satisfied and the flag must not stay sticky — but api.md is explicit
      // that clients must not report success for cancelling nothing.
      setPendingDeletion(null);
      clearScheduledDeletion();
      pushToast({
        type: result === 'cancelled' ? 'success' : 'info',
        message: result === 'cancelled' ? t('pending.cancelled') : t('pending.notScheduled'),
      });
      navigate('/', { replace: true });
    },
    onError: () => {
      pushToast({ type: 'error', message: t('pending.cancelFailed') });
    },
  });

  if (!isAuthenticated) return <Navigate to="/welcome" replace />;
  if (!pendingDeletion) return <Navigate to="/" replace />;

  const caveats = listOf(t('pending.caveats', { returnObjects: true }));

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>{t('pending.eyebrow')}</p>
        <h1 className={styles.title}>{t('pending.title')}</h1>
        <p className={styles.lead}>{t('pending.lead')}</p>

        <DeletionStatusPanel status={pendingDeletion} />

        <h2 className={styles.sectionTitle}>{t('pending.caveatsLabel')}</h2>
        <ul className={styles.list}>
          {caveats.map((line) => <li key={line}>{line}</li>)}
        </ul>

        <div className={styles.actions}>
          <Button onClick={() => cancel.mutate()} loading={cancel.isPending}>
            {t('pending.cancelCta')}
          </Button>
          <Button variant="secondary" onClick={logout} disabled={cancel.isPending}>
            {t('pending.logoutCta')}
          </Button>
        </div>
      </div>
    </div>
  );
}
