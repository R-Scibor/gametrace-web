import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui';
import { ApkQrCode } from '../components/welcome/ApkQrCode';
import { APK_DOWNLOAD_PATH, isApkDownloadReady } from '../lib/apkDownload';
import { useHealth } from '../hooks/useHealth';
import { useAuthStore } from '../store/authStore';
import styles from './DownloadPage.module.css';

export function DownloadPage() {
  const { t } = useTranslation('download');
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: health } = useHealth();
  const [apkAvailable, setApkAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    isApkDownloadReady()
      .then((ready) => {
        if (!cancelled) setApkAvailable(ready);
      })
      .catch(() => {
        if (!cancelled) setApkAvailable(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDownload = async () => {
    if (await isApkDownloadReady()) {
      window.location.assign(APK_DOWNLOAD_PATH);
      return;
    }
    setApkAvailable(false);
  };

  const primaryLabel =
    apkAvailable === null
      ? t('primary.checking')
      : apkAvailable
        ? t('primary.download')
        : t('primary.unavailable');

  const statusLabel =
    apkAvailable === null
      ? t('status.checking')
      : apkAvailable
        ? t('status.ready')
        : t('status.unavailable');

  const installSteps = [
    {
      n: '01',
      title: t('install.step1.title'),
      body: t('install.step1.body'),
    },
    {
      n: '02',
      title: t('install.step2.title'),
      body: t('install.step2.body'),
    },
    {
      n: '03',
      title: t('install.step3.title'),
      body: t('install.step3.body'),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden />
      <div className={styles.glow} aria-hidden />

      <div className={styles.content}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowPulse} />
              {t('eyebrow')}
            </p>
            <h1 className={styles.title}>
              {t('titleLine1')}<span className={styles.titleAccent}>.</span>
              <br />
              {t('titleLine2')}<span className={styles.titleAccent}>.</span>
            </h1>
            <p className={styles.lead}>{t('lead')}</p>

            {apkAvailable === false && (
              <p className={styles.unavailable} role="status">
                {t('unavailable')}
              </p>
            )}

            <div className={styles.heroActions}>
              <Button
                className={apkAvailable === true ? styles.ctaGlow : undefined}
                disabled={apkAvailable !== true}
                onClick={handleDownload}
              >
                {primaryLabel}
              </Button>
              {isAuthenticated ? (
                <a
                  href="/"
                  className={styles.secondaryLink}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/');
                  }}
                >
                  {t('goToDashboard')}
                </a>
              ) : (
                <a
                  href="/welcome"
                  className={styles.secondaryLink}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/welcome');
                  }}
                >
                  {t('seeInBrowser')}
                </a>
              )}
            </div>
          </div>

          <aside
            className={[styles.handoff, apkAvailable === true ? styles.handoffReady : ''].join(' ')}
            aria-label={t('handoff.ariaLabel')}
          >
            <div className={styles.handoffBar}>
              <span className={styles.handoffDot} />
              <span className={styles.handoffTitle}>{t('handoff.title')}</span>
              <span
                className={[
                  styles.handoffStatus,
                  apkAvailable === true ? styles.handoffStatusReady : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {apkAvailable === true ? '● ' : ''}
                {statusLabel}
              </span>
            </div>
            <div className={styles.handoffBody}>
              <ApkQrCode size={176} visible />
              <p className={styles.handoffHint}>{t('handoff.hint')}</p>
            </div>
            <div className={styles.handoffFoot}>
              <span>gametrace · download</span>
              <span className={styles.handoffFootValue}>/download/</span>
            </div>
          </aside>
        </header>

        <section className={styles.installSection}>
          <details className={styles.installDetails}>
            <summary className={styles.installSummary}>{t('install.summary')}</summary>
            <ol className={styles.installSteps}>
              {installSteps.map((step) => (
                <li key={step.n} className={styles.installStep}>
                  <span className={styles.installNum}>{step.n}</span>
                  <div>
                    <h2 className={styles.installTitle}>{step.title}</h2>
                    <p className={styles.installBody}>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </details>
        </section>
      </div>

      <footer className={styles.footer} role="contentinfo">
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <span className={styles.footerDot} aria-hidden />
            <span>GAMETRACE</span>
          </div>
          <span className={styles.footerMeta}>v{health?.version ?? '…'}</span>
        </div>
      </footer>
    </div>
  );
}
