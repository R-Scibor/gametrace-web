import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useProfile, useUpdateSettings } from '../hooks/useProfile';
import { useHealth } from '../hooks/useHealth';
import { useLanguage } from '../hooks/useLanguage';
import { useAuthStore } from '../store/authStore';
import { SectionHeader, Skeleton } from '../components/ui';
import { Switch } from '../components/ui/Switch';
import { TimezoneSelect } from '../components/ui/TimezoneSelect';
import { LanguageSelect } from '../components/ui/LanguageSelect';
import { DeleteAccountRow } from '../components/settings/DeleteAccountRow';
import { PrivacyNoticeRow } from '../components/settings/PrivacyNoticeRow';
import { SettingsRow } from '../components/settings/SettingsRow';
import { formatBotStatus, formatUptime, botColor } from '../lib/bot';
import styles from './SettingsPage.module.css';

/** Shown off and inert. Does not read or write the stored preference. */
function LockedToggle({ label }: { label: string }) {
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        aria-label={label}
        checked={false}
        disabled
        onChange={() => {}}
      />
      <span className={styles.toggleSlider} />
    </label>
  );
}

export function SettingsPage() {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: health } = useHealth();
  // Fallback for a failed /profile/me: defaulting to false would hand an admin
  // an enabled Delete button and a retry-forever error, since the backend 403s
  // admin self-deletion. This flag is known synchronously from login.
  const storedIsAdmin = useAuthStore((s) => s.isAdmin);
  const updateSettings = useUpdateSettings();
  const { select: selectLanguage, isPending: languagePending } = useLanguage();

  const handleTimezone = (tz: string) => {
    updateSettings.mutate({ timezone: tz });
  };

  if (profileLoading) {
    return (
      <div className={styles.container}>
        <SectionHeader title={t('title')} />
        <Skeleton height={300} />
      </div>
    );
  }

  const timezone = profile?.timezone ?? 'Europe/Warsaw';
  const language = profile?.language ?? 'pl';

  return (
    <div className={styles.container}>
      <SectionHeader title={t('title')} />

      <div className={styles.panel}>
        <h3 className={styles.sectionTitle}>{t('sections.account')}</h3>
        <SettingsRow
          label={t('account.user')}
          subtext={
            profile?.discord_id
              ? t('account.discordId', { id: profile.discord_id })
              : undefined
          }
        >
          <span className={styles.value}>{profile?.username ?? user?.username ?? '—'}</span>
        </SettingsRow>
        <DeleteAccountRow
          username={profile?.username ?? user?.username ?? ''}
          isAdmin={profile?.is_admin ?? storedIsAdmin}
        />
      </div>

      <div className={styles.panel}>
        <h3 className={styles.sectionTitle}>{t('sections.privacy')}</h3>
        <PrivacyNoticeRow />
      </div>

      <div className={styles.panel}>
        <h3 className={styles.sectionTitle}>{t('sections.preferences')}</h3>
        <SettingsRow
          label={t('preferences.language')}
          subtext={language === 'pl' ? tCommon('language.pl') : tCommon('language.en')}
        >
          <LanguageSelect
            value={language}
            onChange={selectLanguage}
            disabled={languagePending}
          />
        </SettingsRow>
        <SettingsRow label={t('preferences.timezone')} subtext={timezone}>
          <TimezoneSelect
            value={timezone}
            onChange={handleTimezone}
            disabled={updateSettings.isPending}
          />
        </SettingsRow>
        <SettingsRow
          label={t('preferences.botReminder')}
          subtext={t('preferences.botReminderSubtext')}
        >
          <Switch
            label={t('preferences.botReminder')}
            checked={profile?.bot_visibility_reminders_enabled ?? true}
            disabled={updateSettings.isPending || !profile}
            onChange={(checked) =>
              updateSettings.mutate({ bot_visibility_reminders_enabled: checked })
            }
          />
        </SettingsRow>
        <SettingsRow
          label={t('preferences.weeklyReport')}
          subtext={t('preferences.unavailable')}
          badge={t('preferences.inDevelopment')}
        >
          <LockedToggle label={t('preferences.weeklyReport')} />
        </SettingsRow>
        <SettingsRow
          label={t('preferences.push')}
          subtext={t('preferences.unavailable')}
          badge={t('preferences.inDevelopment')}
        >
          <LockedToggle label={t('preferences.push')} />
        </SettingsRow>
      </div>

      <div className={styles.panel}>
        <h3 className={styles.sectionTitle}>{t('sections.status')}</h3>
        <SettingsRow label={t('status.bot')}>
          <span
            className={styles.statusValue}
            style={{ color: health ? botColor(health.bot.status) : undefined }}
          >
            {health ? formatBotStatus(health.bot.status) : '—'}
          </span>
        </SettingsRow>
        {health?.bot.uptime_seconds != null && (
          <SettingsRow label={t('status.botUptime')}>
            <span className={styles.statusValue}>{formatUptime(health.bot.uptime_seconds)}</span>
          </SettingsRow>
        )}
        <SettingsRow label={t('status.apiVersion')}>
          <span className={styles.statusValue}>{health?.version ?? '—'}</span>
        </SettingsRow>
      </div>

      <footer className={styles.footer}>
        <span className={styles.footerLine} />
        <span className={styles.version}>GAMETRACE {health?.version ?? '—'}</span>
        <span className={styles.footerLine} />
      </footer>
    </div>
  );
}
