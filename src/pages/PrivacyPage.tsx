import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setActiveLanguage } from '../i18n';
import type { Language } from '../i18n/resolve';
import { LanguageSelect } from '../components/ui/LanguageSelect';
import styles from './PrivacyPage.module.css';

/** Public contact for official-host privacy questions (same as portfolio). */
export const PRIVACY_CONTACT_EMAIL = 'sciborr08@gmail.com';

const SECTION_ORDER = [
  'about',
  'controller',
  'data',
  'noSale',
  'deletion',
  'contact',
  'more',
] as const;

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

  const dataItems = t('sections.data.items', { returnObjects: true });
  const items = Array.isArray(dataItems) ? (dataItems as string[]) : [];

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
          <p className={styles.meta}>{t('lastUpdated')}</p>
        </header>

        <p className={styles.stubBanner} role="status">
          {t('stubBanner')}
        </p>

        <article className={styles.article}>
          {SECTION_ORDER.map((key) => (
            <section key={key} className={styles.section} id={key === 'deletion' ? 'account-deletion' : undefined}>
              <h2 className={styles.sectionTitle}>{t(`sections.${key}.title`)}</h2>
              {key === 'data' ? (
                <>
                  <p className={styles.body}>{t('sections.data.intro')}</p>
                  <ul className={styles.list}>
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : key === 'contact' ? (
                <>
                  <p className={styles.body}>{t('sections.contact.body')}</p>
                  <p className={styles.contactLine}>
                    <span className={styles.contactLabel}>{t('sections.contact.emailLabel')}: </span>
                    <a className={styles.email} href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
                      {PRIVACY_CONTACT_EMAIL}
                    </a>
                  </p>
                </>
              ) : (
                <p className={styles.body}>{t(`sections.${key}.body`)}</p>
              )}
            </section>
          ))}
        </article>
      </div>

      <footer className={styles.footer} role="contentinfo">
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <span className={styles.footerDot} aria-hidden />
            <span>GAMETRACE</span>
          </div>
          <Link to="/privacy" className={styles.footerLink}>
            {t('title')}
          </Link>
        </div>
      </footer>
    </div>
  );
}
