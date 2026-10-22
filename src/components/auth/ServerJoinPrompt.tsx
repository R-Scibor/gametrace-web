import { useTranslation } from 'react-i18next';
import { Modal, Button } from '../ui';
import { useServerJoinStore } from '../../store/serverJoinStore';
import { getDiscordServerJoinUrl } from '../../lib/discordInvites';
import styles from './ServerJoinPrompt.module.css';

/**
 * Raised after a Discord login whose account is not in the GameTrace guild.
 * Dismissible: sessions still record fine, the bot commands are what need the
 * server. Rendered once from AppLayout so it survives the callback → app hop.
 */
export function ServerJoinPrompt() {
  const { t } = useTranslation('auth');
  const visible = useServerJoinStore((s) => s.visible);
  const hide = useServerJoinStore((s) => s.hide);
  const inviteUrl = getDiscordServerJoinUrl();

  // Nothing to offer without a configured invite — don't nag about a dead end.
  if (!inviteUrl) return null;

  return (
    <Modal open={visible} onClose={hide} labelledBy="server-join-title">
      <h2 id="server-join-title" className={styles.title}>
        {t('serverJoin.title')}
      </h2>
      <p className={styles.body}>{t('serverJoin.body')}</p>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={hide}>
          {t('serverJoin.dismiss')}
        </Button>
        <Button
          onClick={() => {
            window.open(inviteUrl, '_blank', 'noopener,noreferrer');
            hide();
          }}
        >
          {t('serverJoin.join')}
        </Button>
      </div>
    </Modal>
  );
}
