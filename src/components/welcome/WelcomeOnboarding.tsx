import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ApkQrCode } from './ApkQrCode';
import { APK_DOWNLOAD_PATH, isApkDownloadReady } from '../../lib/apkDownload';
import { copyFromInput } from '../../lib/copyToClipboard';
import styles from './WelcomeOnboarding.module.css';

const BOT_INVITE_URL =
  'https://discord.com/oauth2/authorize?client_id=1486092367072334014&permissions=2048&integration_type=0&scope=bot+applications.commands';

/** Public GameTrace Discord (bot already present). Never-expire invite. */
const SERVER_JOIN_URL = 'https://discord.gg/ZhHu2zWbKd';

const STEPS = [
  { id: 1, label: 'Discord' },
  { id: 2, label: 'Rejestracja' },
  { id: 3, label: 'Klient' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

interface WelcomeOnboardingProps {
  open: boolean;
  onClose: () => void;
  apkAvailable: boolean | null;
  isAuthenticated: boolean;
  onApkUnavailable: () => void;
}

export function WelcomeOnboarding({
  open,
  onClose,
  apkAvailable,
  isAuthenticated,
  onApkUnavailable,
}: WelcomeOnboardingProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepId>(1);
  const [commandStatus, setCommandStatus] = useState<'idle' | 'selected' | 'copied'>('idle');
  const [botInviteOpened, setBotInviteOpened] = useState(false);
  const [serverJoinOpened, setServerJoinOpened] = useState(false);
  const commandInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const discordPathOpened = botInviteOpened || serverJoinOpened;

  const resetAndClose = () => {
    setStep(1);
    setCommandStatus('idle');
    setBotInviteOpened(false);
    setServerJoinOpened(false);
    onClose();
  };

  const openBotInvite = () => {
    window.open(BOT_INVITE_URL, '_blank', 'noopener,noreferrer');
    setBotInviteOpened(true);
  };

  const openServerJoin = () => {
    window.open(SERVER_JOIN_URL, '_blank', 'noopener,noreferrer');
    setServerJoinOpened(true);
  };

  const goToLogin = () => {
    resetAndClose();
    navigate('/login');
  };

  const goToDashboard = () => {
    resetAndClose();
    navigate('/');
  };

  const handleCommandField = async () => {
    const input = commandInputRef.current;
    if (!input) return;

    const copied = await copyFromInput(input);
    setCommandStatus(copied ? 'copied' : 'selected');
    window.setTimeout(() => setCommandStatus('idle'), copied ? 2000 : 4000);
  };

  const handleApkDownload = async () => {
    if (await isApkDownloadReady()) {
      window.location.assign(APK_DOWNLOAD_PATH);
      return;
    }
    onApkUnavailable();
  };

  return (
    <div className={styles.overlay} onClick={resetAndClose} role="presentation">
      <div
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>KONFIGURACJA</p>
            <h2 id="onboarding-title" className={styles.title}>
              Uruchom GameTrace
            </h2>
            <p className={styles.subtitle}>3 krótkie kroki — zajmie to chwilę.</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={resetAndClose} aria-label="Zamknij">
            ×
          </button>
        </header>

        <div className={styles.progress} aria-label="Postęp konfiguracji">
          {STEPS.map((item, index) => (
            <div key={item.id} className={styles.progressItem}>
              <span
                className={[
                  styles.progressDot,
                  step >= item.id ? styles.progressDotActive : '',
                  step === item.id ? styles.progressDotCurrent : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden
              />
              <span className={[styles.progressLabel, step === item.id ? styles.progressLabelActive : ''].join(' ')}>
                {item.label}
              </span>
              {index < STEPS.length - 1 && (
                <span
                  className={[styles.progressLine, step > item.id ? styles.progressLineActive : ''].join(' ')}
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>

        {step > 1 && (
          <button
            type="button"
            className={styles.backStep}
            onClick={() => setStep((current) => (current - 1) as StepId)}
          >
            ← Wstecz
          </button>
        )}

        {step === 1 && (
          <section className={styles.step}>
            <h3 className={styles.stepTitle}>Zaproś bota albo dołącz na serwer</h3>
            <p className={styles.stepBody}>
              GameTrace działa na Discordzie. Zaproś bota na swój serwer albo dołącz do publicznego serwera z
              botem — obie drogi działają tak samo.
            </p>
            <div className={styles.stepActions}>
              <button
                type="button"
                className={[
                  styles.stepBtn,
                  discordPathOpened ? styles.stepBtnNeutral : styles.stepBtnOrange,
                ].join(' ')}
                onClick={openServerJoin}
              >
                DOŁĄCZ DO SERWERA Z BOTEM
              </button>
              <button
                type="button"
                className={[
                  styles.stepBtn,
                  discordPathOpened ? styles.stepBtnNeutral : styles.stepBtnOrange,
                ].join(' ')}
                onClick={openBotInvite}
              >
                DODAJ BOTA DO SERWERA
              </button>
              <button
                type="button"
                className={[
                  styles.stepBtn,
                  discordPathOpened ? styles.stepBtnOrange : styles.stepBtnNeutral,
                ].join(' ')}
                onClick={() => setStep(2)}
              >
                MAM JUŻ BOTA → DALEJ
              </button>
            </div>
            {serverJoinOpened && (
              <p className={styles.stepHint}>
                Po dołączeniu do serwera wróć tutaj i kliknij dalej.
              </p>
            )}
            {botInviteOpened && (
              <p className={styles.stepHint}>
                Po dodaniu bota do swojego serwera wróć tutaj i kliknij dalej.
              </p>
            )}
          </section>
        )}

        {step === 2 && (
          <section className={styles.step}>
            <h3 className={styles.stepTitle}>Przedstaw się botowi</h3>
            <p className={styles.stepBody}>
              Na kanale serwera wyślij komendę poniżej. Bot odpowie kodem do logowania — nie pisz na privie.
            </p>
            <label
              className={[
                styles.commandBlock,
                commandStatus === 'copied' ? styles.commandBlockCopied : '',
              ]
                .filter(Boolean)
                .join(' ')}
              htmlFor="onboarding-login-command"
            >
              <input
                id="onboarding-login-command"
                ref={commandInputRef}
                readOnly
                value="/login"
                className={styles.commandInput}
                aria-label="Komenda /login"
                aria-describedby="onboarding-login-command-hint"
                onFocus={(e) => {
                  e.target.select();
                  setCommandStatus('selected');
                }}
                onClick={handleCommandField}
              />
            </label>
            <p id="onboarding-login-command-hint" className={styles.commandHint}>
              {commandStatus === 'copied'
                ? 'Skopiowano — wklej na Discordzie.'
                : commandStatus === 'selected'
                  ? 'Zaznaczono — Ctrl+C / Cmd+C, jeśli nie skopiowało się samo.'
                  : 'Kliknij pole, aby zaznaczyć komendę /login.'}
            </p>
            <div className={styles.stepActions}>
              <Button onClick={() => setStep(3)}>MAM JUŻ KOD → DALEJ</Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className={styles.step}>
            <h3 className={styles.stepTitle}>Wybierz klienta</h3>
            <p className={styles.stepBody}>Jedno konto — te same sesje w przeglądarce i w aplikacji.</p>
            <div className={styles.clientGrid}>
              <article className={styles.clientCard}>
                <p className={styles.clientLabel}>PRZEGLĄDARKA</p>
                <p className={styles.clientBody}>
                  Sesje, biblioteka i statystyki na dużym ekranie — ten sam pulpit co w aplikacji.
                </p>
                <div className={styles.clientGrow} aria-hidden />
                <div className={styles.clientFooter}>
                  <Button onClick={isAuthenticated ? goToDashboard : goToLogin}>
                    {isAuthenticated ? 'OTWÓRZ W PRZEGLĄDARCE' : 'ZALOGUJ W PRZEGLĄDARCE'}
                  </Button>
                </div>
              </article>
              <article className={styles.clientCard}>
                <p className={styles.clientLabel}>APLIKACJA</p>
                <p className={styles.clientBody}>
                  Sesje, biblioteka i statystyki w kieszeni — ten sam pulpit co w przeglądarce.
                </p>
                <div className={styles.clientGrow}>
                  <ApkQrCode visible={apkAvailable === true} />
                </div>
                <div className={styles.clientFooter}>
                  <Button disabled={apkAvailable !== true} onClick={handleApkDownload}>
                    {apkAvailable === null ? 'SPRAWDZANIE…' : 'POBIERZ APK'}
                  </Button>
                </div>
              </article>
            </div>
          </section>
        )}

        <footer className={styles.footer}>
          <button type="button" className={styles.footerLink} onClick={goToLogin}>
            Mam już konto → Zaloguj się
          </button>
        </footer>
      </div>
    </div>
  );
}