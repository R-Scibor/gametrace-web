import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui';
import { LanguageSelect } from '../components/ui/LanguageSelect';
import { setActiveLanguage } from '../i18n';
import type { Language } from '../i18n/resolve';
import { WelcomeOnboarding } from '../components/welcome/WelcomeOnboarding';
import { APK_DOWNLOAD_PATH, isApkDownloadReady } from '../lib/apkDownload';
import { getDiscordBotInviteUrl, getDiscordServerJoinUrl } from '../lib/discordInvites';
import styles from './LandingPage.module.css';

const BOT_INVITE_URL = getDiscordBotInviteUrl();
const SERVER_JOIN_URL = getDiscordServerJoinUrl();

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

const ArrowRightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="13"
    height="13"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

interface HeatCell {
  date: string;
  hours: string;
  level: number;
}

interface HeatCellData {
  time: string;
  sessions: number;
}

const HEATMAP_LEVEL_META: Record<number, HeatCellData> = {
  0: { time: '0m', sessions: 0 },
  1: { time: '45m', sessions: 1 },
  2: { time: '1h 50m', sessions: 1 },
  3: { time: '3h 20m', sessions: 2 },
  4: { time: '5h 40m', sessions: 3 },
};

const HEATMAP_LEVELS = [
  0, 1, 2, 0, 3, 4, 2, 1, 0, 0, 2, 3, 4, 3, 2, 1,
  1, 2, 0, 1, 4, 3, 0, 2, 1, 0, 3, 4, 2, 0, 1, 3,
  0, 0, 2, 3, 2, 1, 0, 1, 3, 4, 1, 2, 0, 1, 4, 2,
  2, 3, 4, 1, 0, 2, 3, 0, 1, 2, 4, 3, 1, 0, 2, 1,
  1, 0, 2, 4, 3, 1, 2, 3, 4, 2, 0, 1, 3, 4, 2, 0,
  0, 2, 1, 3, 4, 2, 1, 0, 2, 4, 3, 1, 0, 2, 3, 4,
  3, 4, 2, 1, 0, 3, 4, 2, 1, 0, 2, 3, 4, 1, 0, 2,
];

export function LandingPage() {
  const { t, i18n } = useTranslation('welcome');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [apkAvailable, setApkAvailable] = useState<boolean | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(
    () => searchParams.get('onboarding') === '1',
  );
  const [hoveredHeatCell, setHoveredHeatCell] = useState<HeatCell | null>(null);

  const currentLanguage = (i18n.language.startsWith('en') ? 'en' : 'pl') as Language;

  const heatmapCells: HeatCell[] = useMemo(() => {
    const locale = i18n.language.startsWith('en') ? 'en-US' : 'pl-PL';
    const start = new Date(2026, 6, 15);
    return HEATMAP_LEVELS.map((level, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const date = d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
      const meta = HEATMAP_LEVEL_META[level];
      const hours =
        level === 0
          ? t('previews.heatmap.noSessions')
          : t('previews.heatmap.sessionHours', { time: meta.time, count: meta.sessions });
      return { date, hours, level };
    });
  }, [i18n.language, t]);

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

  const goToLogin = () => navigate(isAuthenticated ? '/' : '/login');
  const downloadApk = async () => {
    if (await isApkDownloadReady()) {
      window.location.assign(APK_DOWNLOAD_PATH);
    } else {
      setApkAvailable(false);
    }
  };
  const openExternal = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden />
      <div className={styles.glow} aria-hidden />

      <div className={styles.content}>
        <div className={styles.topBar}>
          <Link to="/welcome" className={styles.topBarBrand} aria-label="GameTrace">
            <img
              src="/logo-icon.png"
              alt=""
              className={styles.topBarLogo}
              width={72}
              height={40}
            />
            <span className={styles.topBarWordmark}>
              Game<span className={styles.topBarAccent}>Trace</span>
            </span>
          </Link>
          <div className={styles.topBarActions}>
            <LanguageSelect
              value={currentLanguage}
              onChange={(lng) => setActiveLanguage(lng)}
              variant="segmented"
            />
            <button
              type="button"
              className={styles.topBarLogin}
              onClick={() => navigate(isAuthenticated ? '/' : '/login')}
            >
              {isAuthenticated ? t('topBar.dashboard') : t('topBar.login')}
              <span className={styles.topBarLoginArrow} aria-hidden>
                <ArrowRightIcon />
              </span>
            </button>
          </div>
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

          <div className={styles.storyList}>
            {/* Story 1: PC Discord Auto-Detect */}
            <article className={styles.storyRow}>
              <div className={styles.storyCopy}>
                <span className={styles.storyEyebrow}>
                  {currentLanguage === 'en' ? '01 / PC Auto-Detect' : '01 / Detekcja w tle'}
                </span>
                <h3 className={styles.storyHeading}>
                  {currentLanguage === 'en'
                    ? 'Play like you always do. We log the rest for you.'
                    : 'Grasz jak zawsze. Resztę zapisujemy za ciebie.'}
                </h3>
                <p className={styles.storyDescription}>
                  {currentLanguage === 'en'
                    ? 'Launch any game on PC and GameTrace captures the session automatically via Discord Rich Presence. When you close the game, your playtime is stored on your profile with zero timers and zero performance impact.'
                    : 'Odpalasz grę na PC, a GameTrace automatycznie rejestruje sesję przez Discord Rich Presence. Kiedy zamykasz grę, czas trafia prosto na Twoje konto. Bez stoperów, bez ręcznego wklepywania godzin i bez spadku FPS.'}
                </p>
                <ul className={styles.storyHighlights}>
                  <li className={styles.storyHighlightItem}>
                    <strong>{currentLanguage === 'en' ? 'Full automation ' : 'Pełna automatyzacja '}</strong>
                    <span>
                      {currentLanguage === 'en'
                        ? 'credits playtime to your account the moment the game closes'
                        : 'zapisuje czas gry na Twoim koncie od razu po jej wyłączeniu'}
                    </span>
                  </li>
                  <li className={styles.storyHighlightItem}>
                    <strong>{currentLanguage === 'en' ? 'Zero performance impact ' : 'Zero wpływu na wydajność, '}</strong>
                    <span>
                      {currentLanguage === 'en'
                        ? 'with nothing to install on your PC'
                        : 'bo niczego nie instalujesz na komputerze'}
                    </span>
                  </li>
                </ul>
              </div>

              <div className={styles.storyVisual}>
                <div className={styles.visualBar}>
                  <div className={styles.visualChannelTag}>
                    <span className={styles.visualDiscordDot} />
                    <span>Discord Rich Presence</span>
                  </div>
                  <span className={styles.visualBadgeLive}>
                    <span className={styles.visualDiscordDot} />
                    {t('previews.autoDetect.liveBadge')}
                  </span>
                </div>
                <div className={styles.visualGameCard}>
                  <img
                    src="/landing/kingdom-come-deliverance-2.jpg"
                    alt=""
                    className={styles.visualGameCover}
                  />
                  <div className={styles.visualGameDetails}>
                    <span className={styles.visualGameName}>Kingdom Come: Deliverance II</span>
                    <span className={styles.visualGameMeta}>{t('previews.autoDetect.processDetected')}</span>
                  </div>
                  <div className={styles.visualTimerBlock}>
                    <span className={styles.visualTimerValue}>1h 45m</span>
                    <span className={styles.visualTimerLabel}>{t('previews.autoDetect.inGame')}</span>
                  </div>
                </div>
                <div className={styles.visualNotice}>
                  <span className={styles.visualNoticeDot} />
                  <span>{t('previews.autoDetect.footnote')}</span>
                </div>
              </div>
            </article>

            {/* Story 2: Consoles & Offline Voice Log (Reversed) */}
            <article className={`${styles.storyRow} ${styles.reverse}`}>
              <div className={styles.storyCopy}>
                <span className={styles.storyEyebrow}>
                  {currentLanguage === 'en' ? '02 / Consoles & Offline' : '02 / Konsola & Offline'}
                </span>
                <h3 className={styles.storyHeading}>
                  {currentLanguage === 'en'
                    ? 'Playing off Discord? A single sentence is all it takes.'
                    : 'Grasz poza Discordem? Wystarczy jedno zdanie.'}
                </h3>
                <p className={styles.storyDescription}>
                  {currentLanguage === 'en'
                    ? 'Playing on PlayStation, Nintendo Switch, Steam Deck, or off Discord? Speak a single sentence into your phone or log manually. We’ll recognize the game and duration, and save the rest as a note.'
                    : 'Grasz na PlayStation, Switchu, Steam Decku albo bez uruchomionego Discorda? Powiedz jedno zdanie do telefonu lub dodaj wpis ręcznie. Rozpoznamy grę i czas, a resztę zapiszemy jako notatkę.'}
                </p>
                <ul className={styles.storyHighlights}>
                  <li className={styles.storyHighlightItem}>
                    <strong>{currentLanguage === 'en' ? 'Instant voice logging ' : 'Szybki zapis głosem '}</strong>
                    <span>
                      {currentLanguage === 'en'
                        ? 'lets you speak the title and duration naturally, without typing'
                        : 'pozwala podyktować tytuł i czas naturalnie, bez stukania w klawiaturę'}
                    </span>
                  </li>
                  <li className={styles.storyHighlightItem}>
                    <strong>{currentLanguage === 'en' ? 'App in your pocket ' : 'Aplikacja w kieszeni '}</strong>
                    <span>
                      {currentLanguage === 'en'
                        ? 'makes logging sessions and checking your library seamless on mobile'
                        : 'ułatwia dodawanie sesji i przeglądanie biblioteki prosto z telefonu'}
                    </span>
                  </li>
                </ul>
              </div>

              <div className={styles.storyVisual}>
                <div className={styles.visualBar}>
                  <div className={styles.visualChannelTag}>
                    <span className={styles.voiceWaveDot} />
                    <span>{currentLanguage === 'en' ? 'Voice Recording · Mobile App' : 'Nagrywanie głosem · Aplikacja mobilna'}</span>
                  </div>
                  <span className={styles.voiceBadgeReady}>
                    {currentLanguage === 'en' ? 'TRANSCRIBED' : 'ROZPOZNANO'}
                  </span>
                </div>
                <div className={styles.voiceSpeechBubble}>
                  <span className={styles.voiceWaveIcon} aria-hidden>
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className={styles.voiceQuoteText}>
                    {t('previews.voice.quote')}
                  </span>
                </div>
                <div className={styles.voiceFlowDivider}>
                  <span>{currentLanguage === 'en' ? 'Session Logged' : 'Zapisana sesja'}</span>
                </div>
                <div className={styles.voiceResultCard}>
                  <div className={styles.voiceResultInfo}>
                    <div className={styles.voiceResultRow}>
                      <span className={styles.voiceGameTitle}>{t('previews.voice.gameTitle')}</span>
                      <span className={styles.voiceTimeBadge}>2h 00m</span>
                    </div>
                    <div className={styles.voiceNoteTag}>
                      <strong>{currentLanguage === 'en' ? 'NOTE:' : 'NOTATKA:'}</strong>
                      <span>{currentLanguage === 'en' ? 'Baron quest' : 'quest z Baronem'}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.visualNotice}>
                  <span className={styles.visualNoticeDot} />
                  <span>{t('previews.voice.footnote')}</span>
                </div>
              </div>
            </article>

            {/* Story 3: Library & Activity Heatmap */}
            <article className={styles.storyRow}>
              <div className={styles.storyCopy}>
                <span className={styles.storyEyebrow}>
                  {currentLanguage === 'en' ? '03 / Library & Analytics' : '03 / Biblioteka & Statystyki'}
                </span>
                <h3 className={styles.storyHeading}>
                  {currentLanguage === 'en'
                    ? 'Your game library and habit map. Zero spreadsheets.'
                    : 'Twoja kolekcja i mapa nawyków. Bez Excela.'}
                </h3>
                <p className={styles.storyDescription}>
                  {currentLanguage === 'en'
                    ? 'Every game in your collection is enriched with official IGDB artwork, genres, studios, and release dates. Your hours automatically transform into an interactive GitHub-style heatmap, streaks, and marathon records.'
                    : 'Każda gra w Twojej bibliotece otrzymuje oficjalną okładkę z IGDB, studio, gatunek i rok wydania. Twoje sesje tworzą interaktywną mapę aktywności w stylu GitHuba, pokazując dzienne passy i rekordy maratonów.'}
                </p>
                <ul className={styles.storyHighlights}>
                  <li className={styles.storyHighlightItem}>
                    <strong>{currentLanguage === 'en' ? 'Official IGDB catalog ' : 'Oficjalny katalog IGDB '}</strong>
                    <span>
                      {currentLanguage === 'en'
                        ? 'provides HD covers, studios, release years, and duplicate merging'
                        : 'zapewnia okładki HD, studia, daty premier i łączenie duplikatów'}
                    </span>
                  </li>
                  <li className={styles.storyHighlightItem}>
                    <strong>{currentLanguage === 'en' ? 'Interactive activity map ' : 'Interaktywna mapa aktywności '}</strong>
                    <span>
                      {currentLanguage === 'en'
                        ? 'offers full clarity over your last 16 weeks of gaming habits'
                        : 'daje przejrzysty wgląd w Twój rytm grania z ostatnich 16 tygodni'}
                    </span>
                  </li>
                  <li className={styles.storyHighlightItem}>
                    <strong>{currentLanguage === 'en' ? 'Streaks and marathon records ' : 'Passy i rekordy '}</strong>
                    <span>
                      {currentLanguage === 'en'
                        ? 'show which titles hooked you the longest'
                        : 'pokazują, które tytuły wciągnęły Cię na najdłużej'}
                    </span>
                  </li>
                </ul>
              </div>

              <div className={styles.storyVisual}>
                <div className={styles.libraryStatsStrip}>
                  <div className={styles.libraryStatCol}>
                    <span className={styles.libraryStatVal}>84</span>
                    <span className={styles.libraryStatLabel}>{t('metrics.gamesInLibrary')}</span>
                  </div>
                  <div className={styles.libraryStatCol}>
                    <span className={styles.libraryStatVal}>1 320</span>
                    <span className={styles.libraryStatLabel}>{t('metrics.sessions')}</span>
                  </div>
                  <div className={styles.libraryStatCol}>
                    <span className={styles.libraryStatVal}>247h</span>
                    <span className={styles.libraryStatLabel}>{t('metrics.totalTime')}</span>
                  </div>
                  <div className={styles.libraryStatCol}>
                    <span className={styles.libraryStatVal}>
                      {t('previews.library.streakDays', { count: 12 })}
                    </span>
                    <span className={styles.libraryStatLabel}>{t('metrics.streak')}</span>
                  </div>
                </div>

                <div className={styles.heatmapContainer}>
                  <div className={styles.uiRow}>
                    <span className={styles.uiMetaTag}>
                      {hoveredHeatCell ? (
                        <span className={styles.uiHeatHoverReadout}>
                          <strong>{hoveredHeatCell.date}</strong>: {hoveredHeatCell.hours}
                        </span>
                      ) : (
                        t('previews.heatmap.lastWeeks')
                      )}
                    </span>
                    <div className={styles.uiHeatLegend} aria-hidden>
                      <span>{t('previews.heatmap.less')}</span>
                      <span className={styles.heatL0} />
                      <span className={styles.heatL1} />
                      <span className={styles.heatL2} />
                      <span className={styles.heatL3} />
                      <span className={styles.heatL4} />
                      <span>{t('previews.heatmap.more')}</span>
                    </div>
                  </div>
                  <div className={styles.uiHeatGrid}>
                    {heatmapCells.map((cell, i) => (
                      <span
                        key={i}
                        className={`${styles.uiHeatCell} ${styles[`heatL${cell.level}`]}`}
                        title={`${cell.date}: ${cell.hours}`}
                        onMouseEnter={() => setHoveredHeatCell(cell)}
                        onMouseLeave={() => setHoveredHeatCell(null)}
                      />
                    ))}
                  </div>
                </div>

                <div className={styles.libraryPreviewList}>
                  <div className={styles.libraryMiniGame}>
                    <img
                      src="/landing/baldurs-gate-3.jpg"
                      alt=""
                      className={styles.libraryMiniCover}
                    />
                    <div className={styles.libraryMiniInfo}>
                      <span className={styles.libraryMiniTitle}>Baldur’s Gate 3</span>
                      <span className={styles.libraryMiniMeta}>
                        64h 12m
                        <span className={styles.miniMetaDot} aria-hidden />
                        18 {t('metrics.sessions').toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <div className={styles.libraryMiniGame}>
                    <img
                      src="/landing/kingdom-come-deliverance-2.jpg"
                      alt=""
                      className={styles.libraryMiniCover}
                    />
                    <div className={styles.libraryMiniInfo}>
                      <span className={styles.libraryMiniTitle}>Kingdom Come: Deliverance II</span>
                      <span className={styles.libraryMiniMeta}>
                        18h 30m
                        <span className={styles.miniMetaDot} aria-hidden />
                        5 {t('metrics.sessions').toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.section} id="jak-zaczac">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('sections.howToStart')}</h2>
            <span className={styles.sectionRule} />
          </div>
          <div className={styles.startGrid}>
            <div className={styles.startCopy}>
              <span className={styles.eyebrow}>
                {currentLanguage === 'en' ? 'Discord Integration' : 'Integracja z Discordem'}
              </span>
              <h3 className={styles.startTitle}>{t('start.title')}</h3>
              <p className={styles.startBody}>{t('start.body')}</p>
            </div>
            <div className={styles.startActions}>
              {SERVER_JOIN_URL ? (
                <Button
                  className={styles.startBtn}
                  onClick={() => openExternal(SERVER_JOIN_URL)}
                >
                  <DiscordIcon />
                  {t('start.joinServer')}
                </Button>
              ) : null}
              {BOT_INVITE_URL ? (
                <Button
                  variant="secondary"
                  className={styles.startBtn}
                  onClick={() => openExternal(BOT_INVITE_URL)}
                >
                  <DiscordIcon />
                  {t('start.addBot')}
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <section className={styles.section} id="platformy">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('sections.everywhere')}</h2>
            <span className={styles.sectionRule} />
          </div>
          <div className={styles.clientGrid}>
            <article className={styles.clientItem}>
              <div className={styles.clientStage}>
                <div className={styles.browserFrame}>
                  <img
                    src={`/landing/app-dashboard-${currentLanguage}.webp`}
                    alt={t('clients.web.alt')}
                    loading="lazy"
                    width={1280}
                    height={800}
                  />
                </div>
                <div className={styles.clientFade} aria-hidden />
              </div>
              <div className={styles.clientInfo}>
                <span className={styles.eyebrow}>
                  {currentLanguage === 'en' ? 'Desktop' : 'Na komputerze'}
                </span>
                <h3 className={styles.clientTitle}>{t('clients.web.title')}</h3>
                <ul className={styles.clientFeatures}>
                  <li>{t('clients.web.feature1')}</li>
                  <li>{t('clients.web.feature2')}</li>
                  <li>{t('clients.web.feature3')}</li>
                </ul>
                <div className={styles.clientActions}>
                  <Button
                    className={styles.clientBtn}
                    onClick={goToLogin}
                  >
                    {isAuthenticated ? t('topBar.dashboard') : t('clients.web.login')}
                  </Button>
                </div>
              </div>
            </article>

            <article className={styles.clientItem}>
              <div className={styles.clientStage}>
                <div className={styles.phoneFrame}>
                  <img
                    src={`/landing/app-mobile-${currentLanguage}.webp`}
                    alt={t('clients.app.alt')}
                    loading="lazy"
                    width={600}
                    height={1244}
                  />
                </div>
                <div className={styles.clientFade} aria-hidden />
              </div>
              <div className={styles.clientInfo}>
                <span className={styles.eyebrow}>
                  {currentLanguage === 'en' ? 'Mobile' : 'W kieszeni'}
                </span>
                <h3 className={styles.clientTitle}>{t('clients.app.title')}</h3>
                <ul className={styles.clientFeatures}>
                  <li>{t('clients.app.feature1')}</li>
                  <li>{t('clients.app.feature2')}</li>
                  <li>{t('clients.app.feature3')}</li>
                </ul>
                <div className={styles.clientActions}>
                  {apkAvailable === true ? (
                    <Button
                      variant="secondary"
                      className={styles.clientBtn}
                      onClick={downloadApk}
                    >
                      {t('clients.app.download')}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        className={styles.clientBtn}
                        disabled
                      >
                        {apkAvailable === null ? t('clients.app.checking') : t('clients.app.download')}
                      </Button>
                      {apkAvailable === false ? (
                        <span className={styles.soonBadge}>{t('clients.app.soon')}</span>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>

      <footer className={styles.footer} role="contentinfo">
        <div className={styles.footerInner}>
          <div className={styles.footerLead}>
            <Link to="/welcome" className={styles.footerBrand} aria-label="GameTrace">
              <img src="/logo-icon.png" alt="" width={43} height={24} />
              <span>
                Game<span className={styles.topBarAccent}>Trace</span>
              </span>
            </Link>
            <p className={styles.footerTagline}>{t('footer.tagline')}</p>
          </div>
          <nav className={styles.footerCol} aria-label={t('footer.product')}>
            <h4>{t('footer.product')}</h4>
            {apkAvailable === true ? (
              <a href={APK_DOWNLOAD_PATH} className={styles.footerLink}>
                {t('footer.download')}
              </a>
            ) : null}
            <Link to={isAuthenticated ? '/' : '/login'} className={styles.footerLink}>
              {isAuthenticated ? t('topBar.dashboard') : t('footer.login')}
            </Link>
          </nav>
          {SERVER_JOIN_URL ? (
            <nav className={styles.footerCol} aria-label={t('footer.community')}>
              <h4>{t('footer.community')}</h4>
              <a href={SERVER_JOIN_URL} className={styles.footerLink} target="_blank" rel="noopener noreferrer">
                {t('footer.discord')}
              </a>
            </nav>
          ) : null}
          <nav className={styles.footerCol} aria-label={t('footer.info')}>
            <h4>{t('footer.info')}</h4>
            <Link to="/faq" className={styles.footerLink}>
              {t('footer.faq')}
            </Link>
            <Link to="/privacy" className={styles.footerLink}>
              {t('footer.privacy')}
            </Link>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <div>
            © 2026 Rafał Ścibor
            <small>{t('footer.igdb')}</small>
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
