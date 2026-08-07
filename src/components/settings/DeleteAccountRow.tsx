import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';
import { ACCOUNT_DELETION_GRACE_DAYS } from '../../lib/accountDeletion';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { SettingsRow } from './SettingsRow';
import styles from './DeleteAccountRow.module.css';

interface DeleteAccountRowProps {
  username: string;
  isAdmin: boolean;
}

/**
 * Lives inside the existing "Konto" panel. Admins see it disabled with a reason
 * rather than hidden: the backend 403s admin self-deletion, and hiding it would
 * leave the surface untestable from the only account that exists locally.
 */
export function DeleteAccountRow({ username, isAdmin }: DeleteAccountRowProps) {
  const { t } = useTranslation('settings');
  const [open, setOpen] = useState(false);

  return (
    <>
      <SettingsRow
        label={t('account.delete')}
        labelClassName={styles.label}
        subtext={
          isAdmin
            ? t('account.deleteAdmin')
            : t('account.deleteSub', { days: ACCOUNT_DELETION_GRACE_DAYS })
        }
      >
        <Button
          className={styles.danger}
          variant="secondary"
          disabled={isAdmin}
          onClick={() => setOpen(true)}
        >
          {t('account.deleteAction')}
        </Button>
      </SettingsRow>

      {open && <DeleteAccountDialog username={username} onClose={() => setOpen(false)} />}
    </>
  );
}
