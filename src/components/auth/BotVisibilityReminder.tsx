import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '../ui';
import { useProfile } from '../../hooks/useProfile';
import { useToastStore } from '../../store/toastStore';
import { updateSettings } from '../../api/profile';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '../../lib/queryKeys';
import { getDiscordBotInviteUrl, getDiscordServerJoinUrl } from '../../lib/discordInvites';
import {
  markReminderShown,
  shouldShowBotReminder,
  snoozeUntilIso,
} from '../../lib/botReminder';
import styles from './BotVisibilityReminder.module.css';

export function BotVisibilityReminder() {
  const { t } = useTranslation('auth');
  const { data: profile } = useProfile();
  const pushToast = useToastStore((s) => s.pushToast);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [snoozing, setSnoozing] = useState(false);

  useEffect(() => {
    if (!profile || open) return;
    const show = shouldShowBotReminder({
      botCanSeeUser: profile.bot_can_see_user,
      enabled: profile.bot_visibility_reminders_enabled,
      snoozedUntil: profile.bot_visibility_reminder_snoozed_until,
      discordId: profile.discord_id,
      timeZone: profile.timezone,
    });
    if (!show) return;
    // Stamp before the next navigation. Do not fold this flag back into `open`,
    // or the modal closes on the same render that recorded the day.
    markReminderShown(profile.discord_id, profile.timezone);
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- reveal modal once profile loads */
    setOpen(true);
  }, [profile, open]);

  if (!profile) return null;

  const joinUrl = getDiscordServerJoinUrl();
  const botUrl = getDiscordBotInviteUrl();

  const snooze = async () => {
    setSnoozing(true);
    try {
      await updateSettings({ bot_visibility_reminder_snoozed_until: snoozeUntilIso() });
      await queryClient.invalidateQueries({ queryKey: qk.profile });
      setOpen(false);
      pushToast({ type: 'success', message: t('botReminder.snoozed') });
    } catch {
      setSnoozing(false);
      pushToast({ type: 'error', message: t('errors.loginFailed') });
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} labelledBy="bot-reminder-title">
      <h2 id="bot-reminder-title" className={styles.title}>{t('botReminder.title')}</h2>
      <p className={styles.body}>{t('botReminder.body')}</p>
      <div className={styles.actions}>
        {joinUrl ? (
          <Button variant="secondary" onClick={() => window.open(joinUrl, '_blank', 'noopener,noreferrer')}>
            {t('botReminder.join')}
          </Button>
        ) : null}
        {botUrl ? (
          <Button variant="secondary" onClick={() => window.open(botUrl, '_blank', 'noopener,noreferrer')}>
            {t('botReminder.addBot')}
          </Button>
        ) : null}
        <Button onClick={() => void snooze()} disabled={snoozing}>
          {t('botReminder.snooze')}
        </Button>
      </div>
    </Modal>
  );
}
