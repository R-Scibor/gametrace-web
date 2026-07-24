import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useHealth } from '../hooks/useHealth';
import { Button } from '../components/ui';
import { formatLinkCode, isCompleteLinkCode, normalizeLinkCode } from '../lib/linkCode';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const { isAuthenticated, handleLinkLogin, loading, error } = useAuth();
  const { data: health } = useHealth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const canSubmit = !loading && isCompleteLinkCode(code);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok = await handleLinkLogin(code);
    if (ok) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.center}>
        <div className={styles.wordmark}>
          <Link to="/welcome" className={styles.titleLink} aria-label={t('homeAria')}>
            <h1 className={styles.title}>
              Game<span className={styles.titleAccent}>Trace</span>
            </h1>
          </Link>
          <p className={styles.tagline}>{t('tagline')}</p>
          <div className={styles.rule} />
        </div>

        <div className={styles.errorSlot}>
          {error && <p className={styles.error}>{error}</p>}
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          <label htmlFor="link-code" className={styles.label}>
            {t('codeLabel')}
          </label>
          <div className={styles.inputWrapper}>
            <div className={styles.orangeBar} />
            <input
              id="link-code"
              type="text"
              inputMode="numeric"
              value={formatLinkCode(code)}
              onChange={(e) => setCode(normalizeLinkCode(e.target.value))}
              className={styles.input}
              placeholder="231 996"
              disabled={loading}
              autoFocus
              autoComplete="one-time-code"
              maxLength={7}
            />
          </div>
          <Button type="submit" disabled={!canSubmit}>
            {loading ? t('connecting') : t('submit')}
          </Button>
        </form>

        <div className={styles.helper}>
          <p className={styles.helperTitle}>{t('helperTitle')}</p>
          <ol className={styles.helperSteps}>
            <li>
              {t('helperStep1Before')} <strong>{t('helperStep1Strong')}</strong>{' '}
              {t('helperStep1Mid')}{' '}
              <span className={styles.helperAccent}>/login</span>
            </li>
            <li>
              {t('helperStep2Before')} <strong>{t('helperStep2Strong')}</strong>{' '}
              {t('helperStep2After')}
            </li>
            <li>{t('helperStep3')}</li>
          </ol>
          <p className={styles.helperNote}>
            {t('helperNoteBefore')}{' '}
            <Link to="/welcome?onboarding=1" className={styles.helperLink}>
              {t('helperNoteLink')}
            </Link>
            {t('helperNoteAfter')}
          </p>
          <Link to="/welcome" className={styles.backLink}>
            {t('backLink')}
          </Link>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.footerDot} />
          <span>{t('connectionStable')}</span>
        </div>
        <span>v{health?.version ?? '...'}</span>
      </footer>
    </div>
  );
}
