import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { requestDeletion } from '../../api/profile';
import { ACCOUNT_DELETION_GRACE_DAYS, saveScheduledDeletion } from '../../lib/accountDeletion';
import { resumeAuthTeardown, suspendAuthTeardown } from '../../lib/authTeardown';
import { listOf } from '../../lib/i18nList';
import { Button, Input, Modal } from '../ui';
import styles from './DeleteAccountDialog.module.css';

interface DeleteAccountDialogProps {
  username: string;
  onClose: () => void;
}

const matches = (typed: string, username: string) =>
  username.trim().length > 0 && typed.trim().toLowerCase() === username.trim().toLowerCase();

/**
 * Built on Modal rather than ConfirmDialog: a typed-confirmation gate and its
 * validation do not belong in the shared yes/no primitive that four other call
 * sites use. Mounted only while open, so the typed field resets on close.
 */
export function DeleteAccountDialog({ username, onClose }: DeleteAccountDialogProps) {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const [typed, setTyped] = useState('');
  const handedOff = useRef(false);

  // `suspended` is module-level, and React Query drops a mutation's callbacks
  // when its observer unmounts — so an unmount mid-request (parent route
  // change) would resume nowhere and leave 401 auto-logout disabled for the
  // rest of the session. Resume on the way out unless the flow handed off to
  // DeletionScheduledPage, which owns the window from there.
  useEffect(
    () => () => {
      if (!handedOff.current) resumeAuthTeardown();
    },
    [],
  );

  const schedule = useMutation({
    mutationFn: requestDeletion,
    onMutate: () => {
      // Suspended before the request: the 202 revokes every token server-side,
      // so a 401 from any query racing this one would otherwise tear down auth
      // mid-navigation. Resumed on DeletionScheduledPage mount, or here if the
      // request fails.
      suspendAuthTeardown();
    },
    onSuccess: (status) => {
      handedOff.current = true;
      // Auth teardown deliberately does NOT happen here. It happens on
      // DeletionScheduledPage's mount instead — see the comment there for why.
      saveScheduledDeletion(status);
      navigate('/account/deletion-scheduled', { state: status, replace: true });
    },
    onError: () => {
      resumeAuthTeardown();
    },
  });

  // Escape and backdrop clicks both route through Modal's onClose, which the
  // disabled Cancel button does not cover. A destructive request already in
  // flight must not be dismissable: the deletion still lands server-side, so
  // dismissing it would strand the user on Settings with a dead token and no
  // confirmation screen.
  const requestClose = () => {
    if (!schedule.isPending) onClose();
  };

  const confirmLabel = t('dialog.confirmLabel', { username });
  const inventory = listOf(t('public.inventory', { returnObjects: true }));
  const consequences = listOf(
    t('dialog.consequences', { returnObjects: true, days: ACCOUNT_DELETION_GRACE_DAYS }),
  );

  return (
    <Modal
      open
      onClose={requestClose}
      labelledBy="delete-account-title"
      role="alertdialog"
      overlayClassName={styles.overlay}
    >
      <h2 id="delete-account-title" className={styles.title}>{t('dialog.title')}</h2>
      <p className={styles.lead}>{t('dialog.lead')}</p>

      <div className={styles.inventoryBox}>
        <p className={styles.label}>{t('dialog.inventoryLabel')}</p>
        <ul className={styles.list}>
          {inventory.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      <p className={styles.label}>{t('dialog.consequencesLabel')}</p>
      <ul className={styles.list}>
        {consequences.map((line) => <li key={line}>{line}</li>)}
      </ul>

      <Input
        label={confirmLabel}
        value={typed}
        autoComplete="off"
        onChange={(e) => setTyped(e.target.value)}
      />

      {schedule.isError && <p className={styles.error} role="alert">{t('dialog.error')}</p>}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={requestClose} disabled={schedule.isPending}>
          {t('dialog.cancel')}
        </Button>
        <Button
          className={styles.danger}
          disabled={!matches(typed, username)}
          loading={schedule.isPending}
          onClick={() => schedule.mutate()}
        >
          {t('dialog.submit')}
        </Button>
      </div>
    </Modal>
  );
}
