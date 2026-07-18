import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { ApkQrCode } from '../components/welcome/ApkQrCode';
import { APK_DOWNLOAD_PATH, isApkDownloadReady } from '../lib/apkDownload';
import { useHealth } from '../hooks/useHealth';
import { useAuthStore } from '../store/authStore';
import styles from './DownloadPage.module.css';

const INSTALL_STEPS = [
  {
    n: '01',
    title: 'Pobierz plik',
    body: 'Stuknij Pobierz APK i zapisz plik na telefonie.',
  },
  {
    n: '02',
    title: 'Otwórz gametrace.apk',
    body: 'Znajdź plik w powiadomieniach albo w menedżerze plików i otwórz go.',
  },
  {
    n: '03',
    title: 'Zezwól na instalację',
    body: 'Jeśli system zapyta — zezwól na instalację z tej przeglądarki lub nieznanych źródeł.',
  },
] as const;

export function DownloadPage() {
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
    apkAvailable === null ? 'SPRAWDZANIE…' : apkAvailable ? 'POBIERZ APK' : 'APK NIEDOSTĘPNE';

  const statusLabel =
    apkAvailable === null ? 'SPRAWDZANIE' : apkAvailable ? 'APK GOTOWY' : 'NIEDOSTĘPNE';

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden />
      <div className={styles.glow} aria-hidden />

      <div className={styles.content}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowPulse} />
              GAMETRACE · APLIKACJA ANDROID
            </p>
            <h1 className={styles.title}>
              Pobierz aplikację<span className={styles.titleAccent}>.</span>
              <br />
              Ten sam dziennik, w kieszeni<span className={styles.titleAccent}>.</span>
            </h1>
            <p className={styles.lead}>
              Oficjalny APK GameTrace — sesje, biblioteka i statystyki jak w przeglądarce. Konto
              zakładasz przez Discorda.
            </p>

            {apkAvailable === false && (
              <p className={styles.unavailable} role="status">
                Plik APK jest chwilowo niedostępny. Spróbuj później albo skorzystaj z wersji w
                przeglądarce.
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
                  PRZEJDŹ DO PULPITU →
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
                  ZOBACZ GAMETRACE W PRZEGLĄDARCE →
                </a>
              )}
            </div>
          </div>

          <aside
            className={[styles.handoff, apkAvailable === true ? styles.handoffReady : ''].join(' ')}
            aria-label="Przenieś link na telefon"
          >
            <div className={styles.handoffBar}>
              <span className={styles.handoffDot} />
              <span className={styles.handoffTitle}>PRZENIEŚ NA TELEFON</span>
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
              <p className={styles.handoffHint}>
                Skan otwiera tę stronę na telefonie — potem stuknij Pobierz APK.
              </p>
            </div>
            <div className={styles.handoffFoot}>
              <span>gametrace · download</span>
              <span className={styles.handoffFootValue}>/download/</span>
            </div>
          </aside>
        </header>

        <section className={styles.installSection}>
          <details className={styles.installDetails}>
            <summary className={styles.installSummary}>Jak zainstalować</summary>
            <ol className={styles.installSteps}>
              {INSTALL_STEPS.map((step) => (
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
