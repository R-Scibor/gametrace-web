import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  const { t } = useTranslation('common');

  useEffect(() => {
    const prev = document.title;
    document.title = `${t('notFound.title')} | GameTrace`;
    return () => {
      document.title = prev;
    };
  }, [t]);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>{t('notFound.title')}</h1>
        <p className={styles.lead}>{t('notFound.description')}</p>
        <div className={styles.actions}>
          <Link to="/" className={styles.primaryLink}>
            {t('notFound.dashboardCta')}
          </Link>
        </div>
      </div>
    </div>
  );
}
