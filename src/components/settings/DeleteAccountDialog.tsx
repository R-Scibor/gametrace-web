import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { requestDeletion } from '../../api/profile';
import { ACCOUNT_DELETION_GRACE_DAYS, saveScheduledDeletion } from '../../lib/accountDeletion';
import { listOf } from '../../lib/i18nList';
import { Button, Input, Modal } from '../ui';
import styles from './DeleteAccountDialog.module.css';

interface DeleteAccountDialogProps {
  open: boolean;
  username: string;
  onClose: () => void;
}

const matches = (typed: string, username: string) =>
  username.trim().length > 0 && typed.trim().toLowerCase() === username.trim().toLowerCase();

/**
 * Built on Modal rather than ConfirmDialog: a typed-confirmation gate and its
 * validation do not belong in the shared yes/no primitive that four other call
 * sites use.
 */
export function DeleteAccountDialog({ open, username, onClose }: DeleteAccountDialogProps) {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const [typed, setTyped] = useState('');
  const [failed, setFailed] = useState(false);

  const schedule = useMutation({
    mutationFn: requestDeletion,
    onMutate: () => setFailed(false),
    onSuccess: (status) => {
      // Auth teardown deliberately does NOT happen here. It happens on
      // DeletionScheduledPage's mount instead — see the comment there for why.
      saveScheduledDeletion(status);
      navigate('/account/deletion-scheduled', { state: status, replace: true });
    },
    onError: () => setFailed(true),
  });

  const confirmLabel = t('dialog.confirmLabel', { username });
  const inventory = listOf(t('public.inventory', { returnObjects: true }));
  const consequences = listOf(
    t('dialog.consequences', { returnObjects: true, days: ACCOUNT_DELETION_GRACE_DAYS }),
  );

  return (
    <Modal open={open} onClose={onClose} labelledBy="delete-account-title" role="alertdialog">
      <h2 id="delete-account-title" className={styles.title}>{t('dialog.title')}</h2>
      <p className={styles.lead}>{t('dialog.lead')}</p>

      <div className={styles.inventoryBox}>
        <p className={styles.label}>{t('dialog.inventoryLabel')}</p>
        <ul className={styles.list}>
          {inventory.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className={styles.note}>{t('public.inventoryNote')}</p>
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

      {failed && <p className={styles.error} role="alert">{t('dialog.error')}</p>}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose} disabled={schedule.isPending}>
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
