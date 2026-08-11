import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setActiveLanguage } from '../i18n';
import type { Language } from '../i18n/resolve';
import { LanguageSelect } from '../components/ui/LanguageSelect';
import { ACCOUNT_DELETION_GRACE_DAYS } from '../lib/accountDeletion';
import {
  parsePolicySections,
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_POLICY_VERSION,
} from '../lib/privacyPolicy';
import { PolicyBlocks } from '../components/privacy/PolicyBlocks';
import { PolicyToc } from '../components/privacy/PolicyToc';
import styles from './PrivacyPage.module.css';

// Re-exported because DeleteAccountPage and existing tests import it from here.
// The constant itself lives in lib/privacyPolicy so the validator can
// interpolate {{email}} without importing a page component.
export { PRIVACY_CONTACT_EMAIL };

export function PrivacyPage() {
  const { t, i18n } = useTranslation('privacy');
  const language = (i18n.language === 'en' ? 'en' : 'pl') as Language;

  useEffect(() => {
    const prev = document.title;
    document.title = t('documentTitle');
    return () => {
      document.title = prev;
    };
  }, [t, i18n.language]);

  const sections = useMemo(
    () =>
      parsePolicySections(t('sections', { returnObjects: true }), {
        days: ACCOUNT_DELETION_GRACE_DAYS,
        email: PRIVACY_CONTACT_EMAIL,
      }),
    [t, i18n.language],
  );

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden />
      <div className={styles.glow} aria-hidden />

      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Link to="/welcome" className={styles.backLink}>
              {t('backHome')}
            </Link>
            <div className={styles.langRow}>
              <LanguageSelect
                value={language}
                onChange={(lng) => setActiveLanguage(lng)}
                aria-label={t('languageLabel')}
              />
            </div>
          </div>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowPulse} aria-hidden />
            {t('eyebrow')}
          </p>
          <h1 className={styles.title}>
            {t('title')}
            <span className={styles.titleAccent}>.</span>
          </h1>
          <p className={styles.meta}>
            <span>{t('lastUpdated')}</span>
            <span className={styles.metaSep} aria-hidden>
              ·
            </span>
            <span>{t('versionLabel')}</span>
          </p>
        </header>

        <div className={styles.shell}>
          <PolicyToc sections={sections} label={t('tocLabel')} />

          <article className={styles.article}>
            {sections.map((section) => (
              <section key={section.id} className={styles.section} id={section.id}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <PolicyBlocks blocks={section.blocks} />
              </section>
            ))}
          </article>
        </div>
      </div>

      <footer className={styles.footer} role="contentinfo">
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <span className={styles.footerDot} aria-hidden />
            <span>GAMETRACE</span>
          </div>
          <span className={styles.footerVersion}>v{PRIVACY_POLICY_VERSION}</span>
        </div>
      </footer>
    </div>
  );
}
