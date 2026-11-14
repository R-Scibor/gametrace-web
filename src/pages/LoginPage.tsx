import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useHealth } from '../hooks/useHealth';
import { Button } from '../components/ui';
import { LanguageSelect } from '../components/ui/LanguageSelect';
import { setActiveLanguage } from '../i18n';
import type { Language } from '../i18n/resolve';
import { DiscordLoginButton } from '../components/auth/DiscordLoginButton';
import { formatLinkCode, isCompleteLinkCode, normalizeLinkCode } from '../lib/linkCode';
import { useAuthStore } from '../store/authStore';
import { WALL_COLUMNS } from './loginWallData';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const { isAuthenticated, handleLinkLogin, loading, error, setError } = useAuth();
  const { data: health } = useHealth();
  const [code, setCode] = useState('');
  const pendingDeletion = useAuthStore((s) => s.pendingDeletion);

  const currentLanguage = (i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'pl') as Language;

  if (isAuthenticated) {
    return <Navigate to={pendingDeletion ? '/account/pending-deletion' : '/'} replace />;
  }

  const canSubmit = !loading && isCompleteLinkCode(code);

  // No navigation on success: `handleLinkLogin` flips `isAuthenticated`, and the
  // guard above then routes — one place decides where an authenticated user goes.
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await handleLinkLogin(code);
  };

  return (
    <div className={styles.viewport}>
      {/* ----------------------------------------------------------- */}
      {/* LEFT STAGE: 3D Off-Angle Cover Wall (Ambient Visual Drift)  */}
      {/* ----------------------------------------------------------- */}
      <div className={styles.stageLeft} aria-hidden="true">
        <div className={styles.wallPerspective}>
          <div className={styles.wallTilt}>
            {WALL_COLUMNS.map((col, colIdx) => (
              <div
                key={colIdx}
                className={`${styles.marqueeTrack} ${
                  colIdx === 0
                    ? styles.driftCol0
                    : colIdx === 1
                    ? styles.driftCol1
                    : styles.driftCol2
                }`}
              >
                {/* Set A */}
                {col.map((item) => (
                  <div key={`a-${item.id}`} className={styles.gameCard}>
                    <img
                      src={item.coverUrl}
                      alt=""
                      loading="eager"
                      className={styles.cardCover}
                    />
                    <div className={styles.cardGradient} />
                    <div className={styles.metascoreBadge}>
                      <span className={styles.metascoreLabel}>Meta</span>
                      {item.metascore}
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardStudio}>{item.studio}</div>
                      <div className={styles.cardTitle}>{item.title}</div>
                    </div>
                  </div>
                ))}
                {/* Set B (Exact duplicate for subpixel seamless loop) */}
                {col.map((item) => (
                  <div key={`b-${item.id}`} className={styles.gameCard}>
                    <img
                      src={item.coverUrl}
                      alt=""
                      loading="eager"
                      className={styles.cardCover}
                    />
                    <div className={styles.cardGradient} />
                    <div className={styles.metascoreBadge}>
                      <span className={styles.metascoreLabel}>Meta</span>
                      {item.metascore}
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardStudio}>{item.studio}</div>
                      <div className={styles.cardTitle}>{item.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Seamless Edge Vignettes */}
        <div className={styles.vignetteRight} />
        <div className={styles.vignetteTop} />
        <div className={styles.vignetteBottom} />
      </div>

      {/* ----------------------------------------------------------- */}
      {/* RIGHT STAGE: Authentic GameTrace Login Console             */}
      {/* ----------------------------------------------------------- */}
      <div className={styles.stageRight}>
        {/* Top-Right Language Switcher */}
        <div className={styles.topBar}>
          <LanguageSelect
            value={currentLanguage}
            onChange={(lng) => setActiveLanguage(lng)}
            variant="segmented"
          />
        </div>

        {/* Center Console Container */}
        <main className={styles.loginContainer}>
          {/* Wordmark Header */}
          <div className={styles.wordmarkHeader}>
            <Link to="/welcome" className={styles.brandLink} aria-label={t('homeAria')}>
              <img
                src="/logo-icon.png"
                alt=""
                className={styles.brandLogo}
                width={72}
                height={40}
              />
              <h1 className={styles.brandName}>
                Game<span className={styles.brandAccent}>Trace</span>
              </h1>
            </Link>
            <p className={styles.brandTagline}>{t('tagline')}</p>
            <div className={styles.brandRule} />
          </div>

          {/* Dynamic Error Feedback */}
          <div className={styles.errorSlot}>
            {error && <p className={styles.error}>{error}</p>}
          </div>

          {/* Primary PIN Form */}
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.fieldLabelRow}>
              <label htmlFor="link-code" className={styles.label}>
                {t('codeLabel')}
              </label>
              <span className={styles.fieldHint}>{t('codeHint', '[ 6 CYFR ]')}</span>
            </div>
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
            <Button
              type="submit"
              disabled={!canSubmit}
              className={styles.submitBtn}
            >
              {loading ? t('connecting') : t('submit')}
            </Button>
          </form>

          {/* Discord OAuth Integration */}
          <DiscordLoginButton disabled={loading} onError={setError} />

          {/* Instruction Guide */}
          <div className={styles.helper}>
            <p className={styles.helperTitle}>{t('helperTitle')}</p>
            <ol className={styles.helperSteps}>
              <li className={styles.helperStep}>
                <span className={styles.stepNum}>1.</span>
                <span>
                  {t('helperStep1Before')} <strong>{t('helperStep1Strong')}</strong>{' '}
                  {t('helperStep1Start')}{' '}
                  <span className={styles.cmdPill}>{t('helperStep1BtnStart')}</span>{' '}
                  {t('helperStep1Notice')}{' '}
                  <span className={styles.cmdPill}>{t('helperStep1BtnGet')}</span>{' '}
                  {t('helperStep1Or')}{' '}
                  <span className={styles.cmdPill}>{t('helperStep1BtnWez')}</span>{' '}
                  {t('helperStep1Alt')}{' '}
                  <span className={styles.cmdPill}>/login</span>{' '}
                  {t('helperStep1After')}
                </span>
              </li>
              <li className={styles.helperStep}>
                <span className={styles.stepNum}>2.</span>
                <span>
                  {t('helperStep2Before')} <strong>{t('helperStep2Strong')}</strong>{' '}
                  {t('helperStep2After')}
                </span>
              </li>
              <li className={styles.helperStep}>
                <span className={styles.stepNum}>3.</span>
                <span>{t('helperStep3')}</span>
              </li>
            </ol>
            <p className={styles.helperNote}>
              {t('helperNoteBefore')}{' '}
              <Link to="/welcome?onboarding=1" className={styles.helperLink}>
                {t('helperNoteLink')}
              </Link>
              {t('helperNoteAfter')}
            </p>
          </div>
        </main>

        {/* Console Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerLeft}>
            <span className={styles.footerBrand}>GameTrace</span>
            <span>v{health?.version ?? '...'}</span>
          </div>
          <Link to="/privacy" className={styles.footerLink}>
            {t('privacyLink')}
          </Link>
        </footer>
      </div>
    </div>
  );
}
