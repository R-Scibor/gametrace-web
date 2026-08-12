import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PRIVACY_POLICY_VERSION } from '../../lib/privacyPolicy';
import { SettingsRow } from './SettingsRow';
import styles from './PrivacyNoticeRow.module.css';

/**
 * The signed-in app had no route to the notice: /privacy was linked only from
 * the public pages, so a logged-in user had to log out to read it.
 *
 * Version and date are read from the privacy namespace and the shared constant
 * rather than restated here, so this row cannot drift from the published
 * document when the notice is revised.
 */
export function PrivacyNoticeRow() {
  const { t } = useTranslation('settings');
  const { t: tPrivacy } = useTranslation('privacy');

  const version = tPrivacy('versionLabel', { version: PRIVACY_POLICY_VERSION });

  return (
    <SettingsRow label={t('privacy.policy')} subtext={`${version} · ${tPrivacy('lastUpdated')}`}>
      <Link className={styles.link} to="/privacy">
        {t('privacy.open')}
      </Link>
    </SettingsRow>
  );
}
