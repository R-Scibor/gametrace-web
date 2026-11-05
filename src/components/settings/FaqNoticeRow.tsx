import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SettingsRow } from './SettingsRow';
import styles from './PrivacyNoticeRow.module.css';

export function FaqNoticeRow() {
  const { t } = useTranslation('settings');

  return (
    <SettingsRow label={t('privacy.faq')} subtext={t('privacy.faqSubtext')}>
      <Link className={styles.link} to="/faq">
        {t('privacy.faqOpen')}
      </Link>
    </SettingsRow>
  );
}
