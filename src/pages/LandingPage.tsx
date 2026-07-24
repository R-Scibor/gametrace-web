import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useHealth } from '../hooks/useHealth';
import { Button } from '../components/ui';
import { WelcomeOnboarding } from '../components/welcome/WelcomeOnboarding';
import { APK_DOWNLOAD_PATH, isApkDownloadReady } from '../lib/apkDownload';
import { getDiscordBotInviteUrl } from '../lib/discordInvites';
import styles from './LandingPage.module.css';

const BOT_INVITE_URL = getDiscordBotInviteUrl();

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden width="22" height="22">
    <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.011c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.245.198.372.292a.077.077 0 0 1-.006.127c-.598.35-1.22.642-1.873.892a.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.077.077 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.42 0 1.332-.955 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.42 0 1.332-.946 2.418-2.157 2.418Z" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden width="22" height="22">
    <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
    <line x1="10.5" y1="18.5" x2="13.5" y2="18.5" />
  </svg>
);

const MonitorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden width="22" height="22">
    <rect x="2.5" y="3.5" width="19" height="13" rx="2" />
    <line x1="8.5" y1="20.5" x2="15.5" y2="20.5" />
    <line x1="12" y1="16.5" x2="12" y2="20.5" />
  </svg>
);

const lineIcon = (paths: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden width="20" height="20">
    {paths}
  </svg>
);

const HeatmapIcon = () =>
  lineIcon(
    <>
      <rect x="3" y="3" width="5" height="5" rx="1" />
      <rect x="9.5" y="3" width="5" height="5" rx="1" />
      <rect x="16" y="3" width="5" height="5" rx="1" />
      <rect x="3" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="16" y="9.5" width="5" height="5" rx="1" />
      <rect x="3" y="16" width="5" height="5" rx="1" />
      <rect x="9.5" y="16" width="5" height="5" rx="1" />
      <rect x="16" y="16" width="5" height="5" rx="1" />
    </>,
  );

const TrendIcon = () =>
  lineIcon(
    <>
      <polyline points="3 16 8 11 12 13 21 4" />
      <polyline points="16 4 21 4 21 9" />
    </>,
  );

const LibraryIcon = () =>
  lineIcon(
    <>
      <rect x="3" y="3" width="7" height="8" rx="1" />
      <rect x="14" y="3" width="7" height="8" rx="1" />
      <rect x="3" y="13" width="7" height="8" rx="1" />
      <rect x="14" y="13" width="7" height="8" rx="1" />
    </>,
  );

const BarsIcon = () =>
  lineIcon(
    <>
      <line x1="5" y1="21" x2="5" y2="13" />
      <line x1="12" y1="21" x2="12" y2="6" />
      <line x1="19" y1="21" x2="19" y2="15" />
    </>,
  );

const MicIcon = () =>
  lineIcon(
    <>
      <rect x="9" y="3" width="6" height="10" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <line x1="12" y1="17" x2="12" y2="20.5" />
      <line x1="9" y1="20.5" x2="15" y2="20.5" />
    </>,
  );

const PulseIcon = () =>
  lineIcon(<polyline points="2 12 7 12 10 5 14 19 17 12 22 12" />);

export function LandingPage() {
  const { t } = useTranslation('welcome');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: health } = useHealth();
  const [apkAvailable, setApkAvailable] = useState<boolean | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(
    () => searchParams.get('onboarding') === '1',
  );

  useEffect(() => {
    if (searchParams.get('onboarding') !== '1') return;

    const next = new URLSearchParams(searchParams);
    next.delete('onboarding');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

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

  const platforms = [
    {
      id: 'bot',
      icon: <DiscordIcon />,
      label: t('platforms.bot.label'),
      status: t('platforms.bot.status'),
      body: t('platforms.bot.body'),
      points: [
        t('platforms.bot.point1'),
        t('platforms.bot.point2'),
        t('platforms.bot.point3'),
      ],
    },
    {
      id: 'app',
      icon: <PhoneIcon />,
      label: t('platforms.app.label'),
      status: t('platforms.app.status'),
      body: t('platforms.app.body'),
      points: [
        t('platforms.app.point1'),
        t('platforms.app.point2'),
        t('platforms.app.point3'),
      ],
    },
    {
      id: 'web',
      icon: <MonitorIcon />,
      label: t('platforms.web.label'),
      status: t('platforms.web.status'),
      body: t('platforms.web.body'),
      points: [
        t('platforms.web.point1'),
        t('platforms.web.point2'),
        t('platforms.web.point3'),
      ],
    },
  ];

  const features = [
    {
      icon: <HeatmapIcon />,
      title: t('features.heatmap.title'),
      body: t('features.heatmap.body'),
    },
    {
      icon: <TrendIcon />,
      title: t('features.trends.title'),
      body: t('features.trends.body'),
    },
    {
      icon: <LibraryIcon />,
      title: t('features.library.title'),
      body: t('features.library.body'),
    },
    {
      icon: <BarsIcon />,
      title: t('features.rankings.title'),
      body: t('features.rankings.body'),
    },
    {
      icon: <MicIcon />,
      title: t('features.voice.title'),
      body: t('features.voice.body'),
    },
    {
      icon: <PulseIcon />,
      title: t('features.autoDetect.title'),
      body: t('features.autoDetect.body'),
    },
  ];

  const metrics = [
    { value: '247h', label: t('metrics.totalTime') },
    { value: '12 dni', label: t('metrics.streak') },
    { value: '6h 20m', label: t('metrics.recordSession') },
    { value: '1h 48m', label: t('metrics.avgSession') },
    { value: '84', label: t('metrics.gamesInLibrary') },
    { value: '1 320', label: t('metrics.sessions') },
  ];

  const steps = [
    {
      n: '01',
      title: t('steps.server.title'),
      body: t('steps.server.body'),
    },
    {
      n: '02',
      title: t('steps.login.title'),
      body: t('steps.login.body'),
    },
    {
      n: '03',
      title: t('steps.client.title'),
      body: t('steps.client.body'),
    },
  ];

  const feed = [
    { game: 'Baldur’s Gate 3', meta: '2h 14m', live: true },
    { game: 'Helldivers 2', meta: t('feed.metaYesterday48'), live: false },
    { game: 'Factorio', meta: t('feed.metaYesterday3h'), live: false },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden />
      <div className={styles.glow} aria-hidden />

      <div className={styles.content}>
        <div className={styles.topBar}>
          <span className={styles.topBarBrand}>
            <span className={styles.topBarMark} aria-hidden />
            GAMETRACE<span className={styles.topBarSubtitle}>{t('topBar.subtitle')}</span>
          </span>
          <button
            type="button"
            className={styles.topBarLogin}
            onClick={() => navigate(isAuthenticated ? '/' : '/login')}
          >
            {isAuthenticated ? t('topBar.dashboard') : t('topBar.login')}
            <span className={styles.topBarLoginArrow} aria-hidden>→</span>
          </button>
        </div>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>
              {t('hero.titleLine1')}<span className={styles.titleAccent}>.</span>
              <br />
              {t('hero.titleLine2')}<span className={styles.titleAccent}>.</span>
            </h1>
            <p className={styles.lead}>{t('hero.lead')}</p>
            <div className={styles.heroActions}>
              <Button className={styles.ctaGlow} onClick={() => setOnboardingOpen(true)}>
                {t('hero.start')}
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
                  {t('hero.goToDashboard')}
                </a>
              ) : (
                <a
                  href="/login"
                  className={styles.secondaryLink}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/login');
                  }}
                >
                  {t('hero.haveAccount')}
                </a>
              )}
              <button
                type="button"
                className={styles.learnMoreLink}
                onClick={() => document.getElementById('funkcje')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t('hero.learnMore')}
              </button>
            </div>
          </div>

          <aside className={styles.feed} aria-hidden>
            <div className={styles.feedBar}>
              <span className={styles.feedDot} />
              <span className={styles.feedTitle}>{t('feed.title')}</span>
              <span className={styles.feedLive}>{t('feed.live')}</span>
            </div>
            <ul className={styles.feedList}>
              {feed.map((row) => (
                <li key={row.game} className={styles.feedRow}>
                  <span className={styles.feedGame}>
                    {row.live && <span className={styles.feedRowDot} />}
                    {row.game}
                  </span>
                  <span className={styles.feedMeta}>{row.meta}</span>
                </li>
              ))}
            </ul>
            <div className={styles.feedFoot}>
              <span>this-week</span>
              <span className={styles.feedFootValue}>14h 27m</span>
            </div>
          </aside>
        </header>

        <section className={styles.section} id="funkcje">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('sections.features')}</h2>
            <span className={styles.sectionRule} />
          </div>
          <div className={styles.featureGrid}>
            {features.map((f) => (
              <article key={f.title} className={styles.featureCard}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureBody}>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="statystyki">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('sections.metrics')}</h2>
            <span className={styles.metricTag}>{t('sections.metricsTag')}</span>
            <span className={styles.sectionRule} />
          </div>
          <div className={styles.metricGrid} aria-hidden>
            {metrics.map((m) => (
              <div key={m.label} className={styles.metricTile}>
                <span className={styles.metricValue}>{m.value}</span>
                <span className={styles.metricLabel}>{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} id="jak-zaczac">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('sections.howToStart')}</h2>
            <span className={styles.sectionRule} />
          </div>
          <ol className={styles.steps}>
            {steps.map((step) => (
              <li key={step.n} className={styles.step}>
                <span className={styles.stepNum}>{step.n}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepBody}>{step.body}</p>
              </li>
            ))}
          </ol>
          <div className={styles.stepsCta}>
            <Button className={styles.ctaGlow} onClick={() => setOnboardingOpen(true)}>
              {t('hero.start')}
            </Button>
          </div>
        </section>

        <section className={styles.section} id="platformy">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('sections.platforms')}</h2>
            <span className={styles.sectionRule} />
          </div>
          <div className={styles.platformGrid}>
            {platforms.map((p) => (
              <article key={p.id} className={styles.platformCard}>
                <div className={styles.platformHead}>
                  <span className={styles.platformIcon}>{p.icon}</span>
                  <span className={styles.platformStatus}>{p.status}</span>
                </div>
                <p className={styles.platformLabel}>{p.label}</p>
                <p className={styles.platformBody}>{p.body}</p>
                <ul className={styles.platformPoints}>
                  {p.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                {p.id === 'bot' && BOT_INVITE_URL ? (
                  <Button
                    variant="secondary"
                    onClick={() => window.open(BOT_INVITE_URL, '_blank', 'noopener,noreferrer')}
                  >
                    {t('platforms.addBot')}
                  </Button>
                ) : null}
                {p.id === 'app' && (
                  <Button
                    disabled={apkAvailable !== true}
                    onClick={async () => {
                      if (await isApkDownloadReady()) {
                        window.location.assign(APK_DOWNLOAD_PATH);
                      } else {
                        setApkAvailable(false);
                      }
                    }}
                  >
                    {apkAvailable === null ? t('platforms.checking') : t('platforms.downloadApk')}
                  </Button>
                )}
                {p.id === 'web' && (
                  <Button onClick={() => navigate(isAuthenticated ? '/' : '/login')}>
                    {isAuthenticated ? t('platforms.openWeb') : t('platforms.loginWeb')}
                  </Button>
                )}
              </article>
            ))}
          </div>
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

      <WelcomeOnboarding
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        apkAvailable={apkAvailable}
        isAuthenticated={isAuthenticated}
        onApkUnavailable={() => setApkAvailable(false)}
      />
    </div>
  );
}
