import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '../ui';
import { getDiscordBotInviteUrl, getDiscordServerJoinUrl } from '../../lib/discordInvites';
import styles from './BotContactConfirm.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  onContinue: () => void | Promise<void>;
};

export function BotContactConfirm({ open, onClose, onContinue }: Props) {
  const { t } = useTranslation('auth');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const joinUrl = getDiscordServerJoinUrl();
  const botUrl = getDiscordBotInviteUrl();

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const continueLogin = async () => {
    setError(null);
    setPending(true);
    try {
      await onContinue();
    } catch {
      setPending(false);
      setError(t('errors.loginFailed'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="bot-contact-title"
      overlayClassName={styles.overlay}
    >
      <h2 id="bot-contact-title" className={styles.title}>
        {t('botContact.title')}
      </h2>
      <p className={styles.body}>{t('botContact.body')}</p>
      <p className={styles.permission}>{t('botContact.permission')}</p>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.links}>
        {joinUrl ? (
          <Button variant="secondary" onClick={() => openLink(joinUrl)}>
            {t('botContact.join')}
          </Button>
        ) : null}
        {botUrl ? (
          <Button variant="secondary" onClick={() => openLink(botUrl)}>
            {t('botContact.addBot')}
          </Button>
        ) : null}
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          {t('botContact.back')}
        </Button>
        <Button onClick={() => void continueLogin()} disabled={pending}>
          {pending ? t('discord.starting') : t('botContact.continue')}
        </Button>
      </div>
    </Modal>
  );
}
