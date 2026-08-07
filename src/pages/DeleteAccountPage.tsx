import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setActiveLanguage } from '../i18n';
import type { Language } from '../i18n/resolve';
import { LanguageSelect } from '../components/ui/LanguageSelect';
import { listOf } from '../lib/i18nList';
import { ACCOUNT_DELETION_GRACE_DAYS } from '../lib/accountDeletion';
import { PRIVACY_CONTACT_EMAIL } from './PrivacyPage';
import styles from './DeleteAccountPage.module.css';

/** Public page behind Google Play's "Delete account URL". Must render for a
 *  signed-out visitor — a Play reviewer hits this cold. */
export function DeleteAccountPage() {
  const { t, i18n } = useTranslation('account');
  const language = (i18n.language === 'en' ? 'en' : 'pl') as Language;

  useEffect(() => {
    const prev = document.title;
    document.title = t('public.documentTitle');
    return () => {
      document.title = prev;
    };
  }, [t, i18n.language]);

  const steps = listOf(t('public.steps', { returnObjects: true }));
  const inventory = listOf(t('public.inventory', { returnObjects: true }));

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden />
      <div className={styles.glow} aria-hidden />

      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Link to="/welcome" className={styles.backLink}>{t('public.backHome')}</Link>
            <LanguageSelect
              value={language}
              onChange={(lng) => setActiveLanguage(lng)}
              aria-label={t('public.languageLabel')}
            />
          </div>
          <p className={styles.eyebrow}>{t('public.eyebrow')}</p>
          <h1 className={styles.title}>
            {t('public.title')}
            <span className={styles.titleAccent} aria-hidden>.</span>
          </h1>
        </header>

        <article className={styles.article}>
          <p className={styles.body}>{t('public.intro')}</p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('public.stepsTitle')}</h2>
            <ol className={styles.steps}>
              {steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('public.graceTitle')}</h2>
            <p className={styles.body}>
              {t('public.graceBody', { days: ACCOUNT_DELETION_GRACE_DAYS })}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('public.cancelTitle')}</h2>
            <p className={styles.body}>
              {t('public.cancelBody', { days: ACCOUNT_DELETION_GRACE_DAYS })}
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('public.inventoryTitle')}</h2>
            <ul className={styles.list}>
              {inventory.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className={styles.note}>{t('public.inventoryNote')}</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('public.noAccessTitle')}</h2>
            <p className={styles.body}>{t('public.noAccessBody')}</p>
            <p>
              <a className={styles.email} href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
                {PRIVACY_CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </article>

        <footer className={styles.footer}>
          <Link to="/privacy" className={styles.footerLink}>{t('public.privacyLink')}</Link>
        </footer>
      </div>
    </div>
  );
}
