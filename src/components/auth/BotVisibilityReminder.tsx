import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '../ui';
import { useProfile, useUpdateSettings } from '../../hooks/useProfile';
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
  const [dismissed, setDismissed] = useState(false);
  const updateSettings = useUpdateSettings({ successMessage: t('botReminder.snoozed') });

  const show =
    !dismissed &&
    profile != null &&
    shouldShowBotReminder({
      botCanSeeUser: profile.bot_can_see_user,
      enabled: profile.bot_visibility_reminders_enabled,
      snoozedUntil: profile.bot_visibility_reminder_snoozed_until,
      discordId: profile.discord_id,
      timeZone: profile.timezone,
    });

  const handleDismiss = () => {
    if (profile) {
      markReminderShown(profile.discord_id, profile.timezone);
    }
    setDismissed(true);
  };

  const snooze = async () => {
    try {
      await updateSettings.mutateAsync({
        bot_visibility_reminder_snoozed_until: snoozeUntilIso(),
      });
      handleDismiss();
    } catch {
      // useUpdateSettings pushes settingsSaveFailed toast on error
    }
  };

  if (!show || !profile) return null;

  const joinUrl = getDiscordServerJoinUrl();
  const botUrl = getDiscordBotInviteUrl();

  return (
    <Modal open onClose={handleDismiss} labelledBy="bot-reminder-title">
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
        <Button onClick={() => void snooze()} disabled={updateSettings.isPending}>
          {t('botReminder.snooze')}
        </Button>
      </div>
    </Modal>
  );
}
