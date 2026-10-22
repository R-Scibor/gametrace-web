import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  isDiscordLoginEnabled,
  isSecureContextAvailable,
  redirectToDiscord,
} from '../../lib/discordOAuth';
import { BotContactConfirm } from './BotContactConfirm';
import styles from './DiscordLoginButton.module.css';

type Props = {
  disabled?: boolean;
  onError: (message: string) => void;
};

/**
 * Renders nothing when VITE_DISCORD_CLIENT_ID is unset, so the login page is
 * unchanged until the OAuth app is actually configured for this deployment.
 */
export function DiscordLoginButton({ disabled = false, onError }: Props) {
  const { t } = useTranslation('auth');
  const [starting, setStarting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!isDiscordLoginEnabled()) return null;

  const onClick = () => {
    // PKCE needs crypto.subtle, which plain HTTP outside localhost lacks.
    if (!isSecureContextAvailable()) {
      onError(t('errors.discordInsecure'));
      return;
    }
    setConfirmOpen(true);
  };

  const onContinue = async () => {
    setStarting(true);
    try {
      await redirectToDiscord();
    } catch (err) {
      setStarting(false);
      throw err;
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.divider}>
        <span className={styles.dividerLabel}>{t('discord.or')}</span>
      </div>
      <button
        type="button"
        className={styles.button}
        onClick={onClick}
        disabled={disabled || starting}
      >
        <svg className={styles.icon} viewBox="0 0 24 18" aria-hidden focusable="false">
          <path
            fill="currentColor"
            d="M20.3 1.6A19.8 19.8 0 0 0 15.4 0l-.3.5c1.7.4 3.2 1 4.6 1.9a16.6 16.6 0 0 0-14-.5l.6-.3c.5-.2 1-.4 1.6-.5L7.6 0a19.8 19.8 0 0 0-4.9 1.6C.6 5.6-.2 9.6.1 13.5a19.9 19.9 0 0 0 6 3l1.2-1.9c-.7-.2-1.3-.5-1.9-.9l.5-.3a14.2 14.2 0 0 0 12.2 0l.5.3c-.6.4-1.2.7-1.9.9l1.2 1.9a19.9 19.9 0 0 0 6-3c.4-4.5-.6-8.5-3.6-11.9ZM8.1 11.2c-1.2 0-2.1-1.1-2.1-2.4S6.9 6.4 8.1 6.4c1.2 0 2.2 1.1 2.2 2.4s-1 2.4-2.2 2.4Zm7.8 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4c1.2 0 2.2 1.1 2.2 2.4s-1 2.4-2.2 2.4Z"
          />
        </svg>
        {starting ? t('discord.starting') : t('discord.button')}
      </button>
      <BotContactConfirm
        key={confirmOpen ? 'open' : 'closed'}
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onContinue={onContinue}
      />
    </div>
  );
}
