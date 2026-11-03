import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui';
import { WelcomeOnboarding } from '../components/welcome/WelcomeOnboarding';
import { APK_DOWNLOAD_PATH, isApkDownloadReady } from '../lib/apkDownload';
import { getDiscordBotInviteUrl } from '../lib/discordInvites';
import styles from './LandingPage.module.css';

const BOT_INVITE_URL = getDiscordBotInviteUrl();

/** Example journals for the hero. Not a live account. */
const SPECIMENS = [
  {
    game: 'Baldur’s Gate 3',
    cover: '/landing/baldurs-gate-3.jpg',
    duration: '2h 14m',
    sessions: '8',
    average: '1h 40m',
  },
  {
    game: 'Kingdom Come: Deliverance II',
    cover: '/landing/kingdom-come-deliverance-2.jpg',
    duration: '3h 05m',
    sessions: '5',
    average: '2h 20m',
  },
];

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

interface HeatCell {
  date: string;
  hours: string;
  level: number;
}

const HEATMAP_PREVIEW_CELLS: HeatCell[] = (() => {
  const levels = [
    0, 1, 2, 0, 3, 4, 2, 1, 0, 0, 2, 3, 4, 3, 2, 1,
    1, 2, 0, 1, 4, 3, 0, 2, 1, 0, 3, 4, 2, 0, 1, 3,
    0, 0, 2, 3, 2, 1, 0, 1, 3, 4, 1, 2, 0, 1, 4, 2,
    2, 3, 4, 1, 0, 2, 3, 0, 1, 2, 4, 3, 1, 0, 2, 1,
    1, 0, 2, 4, 3, 1, 2, 3, 4, 2, 0, 1, 3, 4, 2, 0,
    0, 2, 1, 3, 4, 2, 1, 0, 2, 4, 3, 1, 0, 2, 3, 4,
    3, 4, 2, 1, 0, 3, 4, 2, 1, 0, 2, 3, 4, 1, 0, 2,
  ];
  const hoursMap: Record<number, string> = {
    0: 'brak sesji',
    1: '45m (1 sesja)',
    2: '1h 50m (1 sesja)',
    3: '3h 20m (2 sesje)',
    4: '5h 40m (3 sesje)',
  };
  const months = ['lip', 'sie', 'wrz', 'paź', 'lis'];
  const start = new Date(2026, 6, 15);
  return levels.map((level, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const date = `${d.getDate()} ${months[d.getMonth() - 6]}`;
    return { date, hours: hoursMap[level], level };
  });
})();

export function LandingPage() {
  const { t } = useTranslation('welcome');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [apkAvailable, setApkAvailable] = useState<boolean | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(
    () => searchParams.get('onboarding') === '1',
  );
  const [hoveredHeatCell, setHoveredHeatCell] = useState<HeatCell | null>(null);

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
      id: 'autoDetect',
      tag: t('features.autoDetect.tag'),
      title: t('features.autoDetect.title'),
      body: t('features.autoDetect.body'),
    },
    {
      id: 'voice',
      tag: t('features.voice.tag'),
      title: t('features.voice.title'),
      body: t('features.voice.body'),
    },
    {
      id: 'library',
      tag: t('features.library.tag'),
      title: t('features.library.title'),
      body: t('features.library.body'),
    },
    {
      id: 'heatmap',
      tag: t('features.heatmap.tag'),
      title: t('features.heatmap.title'),
      body: t('features.heatmap.body'),
    },
  ];

  const renderFeaturePreview = (id: string) => {
    switch (id) {
      case 'autoDetect':
        return (
          <div className={styles.uiAutoDetect}>
            <div className={styles.uiRow}>
              <div className={styles.uiDiscordStatus}>
                <span className={styles.uiDiscordDot} />
                <span className={styles.uiDiscordName}>Discord Rich Presence</span>
              </div>
              <span className={styles.uiBadgeLive}>AKTYWNA</span>
            </div>
            <div className={styles.uiDetectedGame}>
              <img
                src="/landing/kingdom-come-deliverance-2.jpg"
                alt=""
                className={styles.uiGameThumb}
              />
              <div className={styles.uiDetectedInfo}>
                <span className={styles.uiGameTitle}>Kingdom Come: Deliverance II</span>
                <span className={styles.uiGameSub}>Wykryto proces gry • PC</span>
              </div>
              <div className={styles.uiLiveDuration}>
                <span className={styles.uiLiveClock}>1h 45m</span>
                <span className={styles.uiLiveLabel}>W GRZE</span>
              </div>
            </div>
            <div className={styles.uiFootNote}>
              <span>Czas zostanie przypisany do konta po wyłączeniu gry</span>
            </div>
          </div>
        );

      case 'voice':
        return (
          <div className={styles.uiVoice}>
            <div className={styles.uiVoiceTranscript}>
              <span className={styles.uiMicWave} aria-hidden>
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className={styles.uiTranscriptQuote}>
                „Wiedźmin 3, dwie godziny, quest z Baronem”
              </span>
            </div>
            <div className={styles.uiParsedCard}>
              <div className={styles.uiParsedGame}>
                <span className={styles.uiParsedLabel}>ROZPOZNANA GRA</span>
                <span className={styles.uiParsedTitle}>Wiedźmin 3: Dziki Gon</span>
              </div>
              <div className={styles.uiParsedMeta}>
                <div className={styles.uiParsedStat}>
                  <span className={styles.uiParsedLabel}>CZAS SESJI</span>
                  <span className={styles.uiParsedVal}>2h 00m</span>
                </div>
              </div>
            </div>
            <div className={styles.uiFootNote}>
              <span>Transkrypcja trafi automatycznie do notatek sesji</span>
            </div>
          </div>
        );

      case 'library':
        return (
          <div className={styles.uiLibrary}>
            <div className={styles.uiRow}>
              <span className={styles.uiMetaTag}>KATALOG IGDB</span>
              <span className={styles.uiCountTag}>KOLEKCJA GIER</span>
            </div>
            <div className={styles.uiLibStatsStrip}>
              <div className={styles.uiStatItem}>
                <span className={styles.uiStatVal}>84</span>
                <span className={styles.uiStatLabel}>{t('metrics.gamesInLibrary')}</span>
              </div>
              <div className={styles.uiStatItem}>
                <span className={styles.uiStatVal}>1 320</span>
                <span className={styles.uiStatLabel}>{t('metrics.sessions')}</span>
              </div>
              <div className={styles.uiStatItem}>
                <span className={styles.uiStatVal}>247h</span>
                <span className={styles.uiStatLabel}>{t('metrics.totalTime')}</span>
              </div>
            </div>
            <div className={styles.uiLibList}>
              <div className={styles.uiLibItem}>
                <img
                  src="/landing/baldurs-gate-3.jpg"
                  alt=""
                  className={styles.uiLibCover}
                />
                <div className={styles.uiLibInfo}>
                  <div className={styles.uiLibTitleRow}>
                    <span className={styles.uiLibTitle}>Baldur’s Gate 3</span>
                    <span className={styles.uiLibYear}>2023</span>
                  </div>
                  <span className={styles.uiLibStudio}>Larian Studios • RPG</span>
                </div>
                <div className={styles.uiLibStats}>
                  <span className={styles.uiLibHours}>64h 12m</span>
                  <span className={styles.uiLibSessions}>18 sesji</span>
                </div>
              </div>
              <div className={styles.uiLibItem}>
                <img
                  src="/landing/kingdom-come-deliverance-2.jpg"
                  alt=""
                  className={styles.uiLibCover}
                />
                <div className={styles.uiLibInfo}>
                  <div className={styles.uiLibTitleRow}>
                    <span className={styles.uiLibTitle}>Kingdom Come: Deliverance II</span>
                    <span className={styles.uiLibYear}>2025</span>
                  </div>
                  <span className={styles.uiLibStudio}>Warhorse Studios • Action RPG</span>
                </div>
                <div className={styles.uiLibStats}>
                  <span className={styles.uiLibHours}>18h 30m</span>
                  <span className={styles.uiLibSessions}>5 sesji</span>
                </div>
              </div>
            </div>
            <div className={styles.uiFootTags}>
              <span>0 DUPLIKATÓW</span>
              <span>POŁĄCZONE Z IGDB</span>
            </div>
          </div>
        );

      case 'heatmap':
        return (
          <div className={styles.uiHeatmap}>
            <div className={styles.uiRow}>
              <span className={styles.uiMetaTag}>
                {hoveredHeatCell ? (
                  <span className={styles.uiHeatHoverReadout}>
                    <strong>{hoveredHeatCell.date}</strong>: {hoveredHeatCell.hours}
                  </span>
                ) : (
                  'OSTATNIE 16 TYGODNI'
                )}
              </span>
              <div className={styles.uiHeatLegend} aria-hidden>
                <span>Mniej</span>
                <span className={styles.heatL0} />
                <span className={styles.heatL1} />
                <span className={styles.heatL2} />
                <span className={styles.heatL3} />
                <span className={styles.heatL4} />
                <span>Więcej</span>
              </div>
            </div>
            <div className={styles.uiHeatGrid}>
              {HEATMAP_PREVIEW_CELLS.map((cell, i) => (
                <span
                  key={i}
                  className={`${styles.uiHeatCell} ${styles[`heatL${cell.level}`]}`}
                  title={`${cell.date}: ${cell.hours}`}
                  onMouseEnter={() => setHoveredHeatCell(cell)}
                  onMouseLeave={() => setHoveredHeatCell(null)}
                />
              ))}
            </div>
            <div className={styles.uiHeatStats}>
              <div className={styles.uiHeatStat}>
                <span className={styles.uiHeatVal}>🔥 12 DNI</span>
                <span className={styles.uiHeatSub}>{t('metrics.streak')}</span>
              </div>
              <div className={styles.uiHeatStat}>
                <span className={styles.uiHeatVal}>6h 20m</span>
                <span className={styles.uiHeatSub}>{t('metrics.recordSession')}</span>
              </div>
              <div className={styles.uiHeatStat}>
                <span className={styles.uiHeatVal}>1h 48m</span>
                <span className={styles.uiHeatSub}>{t('metrics.avgSession')}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden />
      <div className={styles.glow} aria-hidden />

      <div className={styles.content}>
        <div className={styles.topBar}>
          <span className={styles.topBarBrand}>
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
              {t('hero.title')}<span className={styles.titleAccent}>.</span>
            </h1>
            <p className={styles.lead}>{t('hero.lead')}</p>
            <div className={styles.heroActions}>
              <Button
                className={styles.heroStart}
                onClick={() => setOnboardingOpen(true)}
              >
                {t('hero.start')}
              </Button>
            </div>
          </div>

          <div className={styles.specimenStack}>
            {SPECIMENS.map((item) => (
              <aside key={item.game} className={styles.specimen} aria-label={item.game}>
                <img className={styles.specimenCover} src={item.cover} alt="" />
                <div className={styles.specimenBody}>
                  <div className={styles.specimenIdentity}>
                    <p className={styles.specimenName}>{item.game}</p>
                    <p className={styles.specimenDetected}>{t('specimen.detected')}</p>
                    <p className={styles.specimenDuration}>{item.duration}</p>
                    <p className={styles.specimenWhen}>{t('specimen.when')}</p>
                  </div>
                  <dl className={styles.specimenBlock}>
                    <div>
                      <dt>{t('specimen.sessions')}</dt>
                      <dd>{item.sessions}</dd>
                    </div>
                    <div>
                      <dt>{t('specimen.average')}</dt>
                      <dd>{item.average}</dd>
                    </div>
                  </dl>
                </div>
              </aside>
            ))}
          </div>
        </header>

        <section className={styles.section} id="funkcje">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('sections.features')}</h2>
            <span className={styles.sectionRule} />
          </div>
          <div className={styles.featureGrid}>
            {features.map((f) => (
              <article key={f.id} className={styles.featureCard}>
                <div className={styles.featureCardTop}>
                  <span className={styles.featureTag}>{f.tag}</span>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureBody}>{f.body}</p>
                </div>
                <div className={styles.featurePreview}>
                  {renderFeaturePreview(f.id)}
                </div>
              </article>
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
                    variant="secondary"
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
                    {isAuthenticated ? t('topBar.dashboard') : t('topBar.login')}
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
            <span>GAMETRACE</span>
          </div>
          <div className={styles.footerRight}>
            <a
              href="/privacy"
              className={styles.footerLink}
              onClick={(e) => {
                e.preventDefault();
                navigate('/privacy');
              }}
            >
              {t('footer.privacy')}
            </a>
          </div>
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
