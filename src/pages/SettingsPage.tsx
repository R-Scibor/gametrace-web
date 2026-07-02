import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile, useUpdateSettings } from '../hooks/useProfile';
import { useHealth } from '../hooks/useHealth';
import { SectionHeader, Button, Skeleton } from '../components/ui';
import { TimezoneSelect } from '../components/ui/TimezoneSelect';
import { formatUptime, botColor } from '../lib/bot';
import styles from './SettingsPage.module.css';

function SettingsRow({
  label,
  subtext,
  children,
}: {
  label: string;
  subtext?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.rowInfo}>
        <span className={styles.rowLabel}>{label}</span>
        {subtext && <span className={styles.rowSubtext}>{subtext}</span>}
      </div>
      <div className={styles.rowControl}>{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const { user, logout } = useAuth();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: health } = useHealth();
  const updateSettings = useUpdateSettings();

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleTimezone = (tz: string) => {
    updateSettings.mutate({ timezone: tz });
  };

  const handleWeeklyReport = (enabled: boolean) => {
    updateSettings.mutate({ weekly_report_enabled: enabled });
  };

  if (profileLoading) {
    return (
      <div className={styles.container}>
        <SectionHeader title="Ustawienia" />
        <Skeleton height={300} />
      </div>
    );
  }

  const timezone = profile?.timezone ?? 'Europe/Warsaw';

  return (
    <div className={styles.container}>
      <SectionHeader title="Ustawienia" />

      <div className={styles.panel}>
        <h3 className={styles.sectionTitle}>Konto</h3>
        <SettingsRow label="Użytkownik" subtext={profile?.discord_id ? `ID: ${profile.discord_id}` : undefined}>
          <span className={styles.value}>{profile?.username ?? user?.username ?? '—'}</span>
        </SettingsRow>
      </div>

      <div className={styles.panel}>
        <h3 className={styles.sectionTitle}>Preferencje</h3>
        <SettingsRow label="Strefa czasowa" subtext={timezone}>
          <TimezoneSelect
            value={timezone}
            onChange={handleTimezone}
            disabled={updateSettings.isPending}
          />
        </SettingsRow>
        <SettingsRow label="Raport tygodniowy" subtext="Wysyłany przez bota na Discord">
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={profile?.weekly_report_enabled ?? false}
              onChange={(e) => handleWeeklyReport(e.target.checked)}
              disabled={updateSettings.isPending}
            />
            <span className={styles.toggleSlider} />
          </label>
        </SettingsRow>
      </div>

      <div className={styles.panel}>
        <h3 className={styles.sectionTitle}>Status</h3>
        <SettingsRow label="Bot">
          <span
            className={styles.statusValue}
            style={{ color: health ? botColor(health.bot.status) : undefined }}
          >
            {health ? health.bot.status.toUpperCase() : '—'}
          </span>
        </SettingsRow>
        {health?.bot.uptime_seconds != null && (
          <SettingsRow label="Bot aktywny od">
            <span className={styles.statusValue}>{formatUptime(health.bot.uptime_seconds)}</span>
          </SettingsRow>
        )}
        <SettingsRow label="Wersja API">
          <span className={styles.statusValue}>{health?.version ?? '—'}</span>
        </SettingsRow>
      </div>

      <Button onClick={handleLogout} variant="secondary" disabled={logoutLoading}>
        {logoutLoading ? 'WYLOGOWYWANIE...' : 'WYLOGUJ SIĘ'}
      </Button>

      <footer className={styles.footer}>
        <span className={styles.footerLine} />
        <span className={styles.version}>GAMETRACE {health?.version ?? '—'}</span>
        <span className={styles.footerLine} />
      </footer>
    </div>
  );
}