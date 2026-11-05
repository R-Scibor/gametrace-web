import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { ApkQrCode } from './ApkQrCode';
import { APK_DOWNLOAD_PATH, isApkDownloadReady } from '../../lib/apkDownload';
import { copyFromInput } from '../../lib/copyToClipboard';
import { getDiscordBotInviteUrl, getDiscordServerJoinUrl } from '../../lib/discordInvites';
import {
  isDiscordLoginEnabled,
  isSecureContextAvailable,
  redirectToDiscord,
} from '../../lib/discordOAuth';
import styles from './WelcomeOnboarding.module.css';

const BOT_INVITE_URL = getDiscordBotInviteUrl();
const SERVER_JOIN_URL = getDiscordServerJoinUrl();

type StepId = 1 | 2 | 3;
type Step2Mode = 'choose' | 'code' | 'discord';

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden width="16" height="16">
    <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.011c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.245.198.372.292a.077.077 0 0 1-.006.127c-.598.35-1.22.642-1.873.892a.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.077.077 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.42 0 1.332-.955 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.42 0 1.332-.946 2.418-2.157 2.418Z" />
  </svg>
);

const ClydeIcon = () => (
  <svg viewBox="0 0 127.14 96.36" fill="currentColor" aria-hidden width="22" height="17">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    width="14"
    height="14"
  >
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
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

const AlertIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

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
  const { t, i18n } = useTranslation('welcome');
  const { t: tAuth } = useTranslation('auth');
  const navigate = useNavigate();
  const currentLanguage = i18n.language.startsWith('en') ? 'en' : 'pl';
  const discordEnabled = isDiscordLoginEnabled();
  const defaultStep2Mode: Step2Mode = discordEnabled ? 'choose' : 'code';

  const [step, setStep] = useState<StepId>(1);
  const [step2Mode, setStep2Mode] = useState<Step2Mode>(defaultStep2Mode);
  const [discordStarting, setDiscordStarting] = useState(false);
  const [discordError, setDiscordError] = useState<string | null>(null);
  const [commandStatus, setCommandStatus] = useState<'idle' | 'selected' | 'copied'>('idle');
  const [botInviteOpened, setBotInviteOpened] = useState(false);
  const [serverJoinOpened, setServerJoinOpened] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const commandInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const resetAndClose = () => {
    setStep(1);
    setStep2Mode(defaultStep2Mode);
    setDiscordStarting(false);
    setDiscordError(null);
    setCommandStatus('idle');
    setBotInviteOpened(false);
    setServerJoinOpened(false);
    setShowQr(false);
    onClose();
  };

  const handleBack = () => {
    if (step === 2 && step2Mode === 'discord') {
      setStep2Mode('choose');
      setDiscordError(null);
      return;
    }
    if (step === 3) {
      setShowQr(false);
    }
    setStep((current) => (current - 1) as StepId);
  };

  const openBotInvite = () => {
    if (!BOT_INVITE_URL) return;
    window.open(BOT_INVITE_URL, '_blank', 'noopener,noreferrer');
    setBotInviteOpened(true);
  };

  const openServerJoin = () => {
    if (!SERVER_JOIN_URL) return;
    window.open(SERVER_JOIN_URL, '_blank', 'noopener,noreferrer');
    setServerJoinOpened(true);
  };

  const handleDiscordRedirect = async () => {
    setDiscordError(null);
    if (!isSecureContextAvailable()) {
      setDiscordError(tAuth('errors.discordInsecure'));
      return;
    }
    setDiscordStarting(true);
    try {
      await redirectToDiscord();
    } catch {
      setDiscordStarting(false);
      setDiscordError(tAuth('errors.loginFailed'));
    }
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

  const commandHint =
    commandStatus === 'copied'
      ? t('onboarding.step2.hintCopied')
      : commandStatus === 'selected'
        ? t('onboarding.step2.hintSelected')
        : t('onboarding.step2.hintIdle');

  const progressLabel =
    step === 1
      ? t('onboarding.steps.discord')
      : step === 2
        ? t('onboarding.steps.account')
        : t('onboarding.steps.client');

  const discordPathOpened = botInviteOpened || serverJoinOpened;

  const goToStep2 = () => {
    setStep2Mode(defaultStep2Mode);
    setDiscordError(null);
    setStep(2);
  };

  const isDiscordConfirm = step === 2 && step2Mode === 'discord';

  return (
    <div className={styles.overlay} onClick={resetAndClose} role="presentation">
      <div
        className={[styles.panel, isDiscordConfirm ? styles.panelNarrow : ''].filter(Boolean).join(' ')}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={progressLabel}
      >
        <div className={styles.top}>
          <div className={styles.topLeft}>
            {step > 1 && (
              <button
                type="button"
                className={styles.backBtn}
                onClick={handleBack}
                aria-label={t('onboarding.back')}
              >
                <ArrowLeftIcon />
              </button>
            )}

            <div className={styles.prog} aria-label={t('onboarding.progressAria')}>
              <b className={[styles.progBar, step >= 1 ? styles.progBarOn : ''].filter(Boolean).join(' ')} />
              <b className={[styles.progBar, step >= 2 ? styles.progBarOn : ''].filter(Boolean).join(' ')} />
              <b className={[styles.progBar, step >= 3 ? styles.progBarOn : ''].filter(Boolean).join(' ')} />
              <span className={styles.progText}>{progressLabel}</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={resetAndClose}
            aria-label={t('onboarding.closeAria')}
          >
            <CloseIcon />
          </button>
        </div>

        {step === 1 && (
          <section className={styles.step}>
            <p className={styles.eyebrow}>{t('onboarding.step1.eyebrow')}</p>
            <h1 className={styles.title}>{t('onboarding.step1.title')}</h1>
            <p className={styles.lead}>{t('onboarding.step1.body')}</p>

            <div className={styles.step1Actions}>
              {SERVER_JOIN_URL ? (
                <Button
                  className={styles.startBtn}
                  variant={serverJoinOpened ? 'secondary' : 'primary'}
                  onClick={openServerJoin}
                >
                  <DiscordIcon />
                  {t('onboarding.step1.joinServer')}
                </Button>
              ) : null}
              {BOT_INVITE_URL ? (
                <Button
                  className={styles.startBtn}
                  variant={botInviteOpened ? 'secondary' : 'primary'}
                  onClick={openBotInvite}
                >
                  <DiscordIcon />
                  {t('onboarding.step1.addBot')}
                </Button>
              ) : null}
            </div>

            {discordPathOpened && (
              <div className={styles.discordActivePanel}>
                <p className={styles.discordActiveHint}>
                  {serverJoinOpened ? t('onboarding.step1.hintServer') : t('onboarding.step1.hintBot')}
                </p>
              </div>
            )}

            <Button
              variant={discordPathOpened ? 'primary' : 'secondary'}
              className={discordPathOpened ? styles.advanceBtnPrimary : styles.advanceBtnSecondary}
              onClick={goToStep2}
            >
              {discordPathOpened
                ? `${t('onboarding.step1.alreadyHaveBot')} — ${t('onboarding.step1.nextStep')}`
                : t('onboarding.step1.alreadyHaveBot')}
              <ArrowRightIcon />
            </Button>

            <ul className={styles.checks}>
              <li>
                <CheckIcon />
                {t('onboarding.step1.benefit1')}
              </li>
              <li>
                <CheckIcon />
                {t('onboarding.step1.benefit2')}
              </li>
              <li>
                <CheckIcon />
                {t('onboarding.step1.benefit3')}
              </li>
            </ul>
          </section>
        )}

        {step === 2 &&
          (isDiscordConfirm ? (
            <section className={styles.step}>
              <p className={styles.eyebrow}>{t('onboarding.discordConfirm.eyebrow')}</p>
              <p className={styles.discordConfirmLead}>{t('onboarding.discordConfirm.lead')}</p>
              {discordError ? (
                <div className={styles.discordNoticeBox} role="alert">
                  <div className={styles.discordNoticeTitle}>
                    <AlertIcon />
                    <strong>{discordError}</strong>
                  </div>
                  <p className={styles.discordNoticeHint}>
                    {t('onboarding.discordConfirm.insecureHint')}
                  </p>
                  <button
                    type="button"
                    className={styles.discordNoticeAction}
                    onClick={() => {
                      setDiscordError(null);
                      setStep2Mode('choose');
                    }}
                  >
                    <span>{t('onboarding.discordConfirm.tryCodeAlternative')}</span>
                    <ArrowRightIcon />
                  </button>
                </div>
              ) : null}
              <div>
                <button
                  type="button"
                  className={`${styles.dc} ${styles.dcInline}`}
                  onClick={() => void handleDiscordRedirect()}
                  disabled={discordStarting}
                >
                  <ClydeIcon />
                  {discordStarting
                    ? t('onboarding.discordConfirm.starting')
                    : t('onboarding.discordConfirm.button')}
                </button>
              </div>
            </section>
          ) : (
            <section className={styles.step}>
              <p className={styles.eyebrow}>{t('onboarding.step2.eyebrow')}</p>
              <h1 className={styles.title}>{t('onboarding.step2.title')}</h1>
              <p className={styles.lead}>{t('onboarding.step2.body')}</p>

              <div className={styles.step2Grid}>
                <div className={styles.step2Col}>
                  <span className={styles.step2Tag}>{t('onboarding.step2.option1')}</span>
                  <h3>{t('onboarding.step2.discordTitle')}</h3>
                  <p>{t('onboarding.step2.discordBody')}</p>
                  <ul className={styles.oauthList}>
                    <li className={styles.oauthItem}>
                      <CheckIcon />
                      <span>{t('onboarding.step2.oauthPoint1')}</span>
                    </li>
                    <li className={styles.oauthItem}>
                      <CheckIcon />
                      <span>{t('onboarding.step2.oauthPoint2')}</span>
                    </li>
                    <li className={styles.oauthItem}>
                      <CheckIcon />
                      <span>{t('onboarding.step2.oauthPoint3')}</span>
                    </li>
                  </ul>
                  <div className={styles.step2Bottom}>
                    <button
                      type="button"
                      className={styles.dc}
                      onClick={() => setStep2Mode('discord')}
                    >
                      <ClydeIcon />
                      {t('onboarding.step2.discordButton')}
                    </button>
                  </div>
                </div>

                <div className={styles.step2Col}>
                  <span className={styles.step2Tag}>{t('onboarding.step2.option2')}</span>
                  <h3>{t('onboarding.step2.codeTitle')}</h3>
                  <p>{t('onboarding.step2.codeBody')}</p>
                  <div className={styles.step2Bottom}>
                    <div
                      className={styles.chip}
                      onClick={handleCommandField}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCommandField();
                        }
                      }}
                    >
                      <input
                        ref={commandInputRef}
                        readOnly
                        value="/login"
                        className={styles.chipInput}
                        aria-label={t('onboarding.step2.commandAria')}
                        onFocus={(e) => {
                          e.target.select();
                          setCommandStatus('selected');
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCommandField();
                        }}
                      />
                      <small>
                        {commandStatus === 'copied'
                          ? t('onboarding.step2.tagCopied')
                          : t('onboarding.step2.tagCopy')}
                      </small>
                    </div>
                    <p className={styles.hint}>{commandHint}</p>
                    <Button
                      className={styles.codeAdvanceBtn}
                      onClick={() => setStep(3)}
                    >
                      {t('onboarding.step2.haveCode')}
                      <ArrowRightIcon />
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          ))}

        {step === 3 && (
          <section className={styles.step}>
            <p className={styles.lead} style={{ margin: '0 0 18px' }}>
              {t('onboarding.step3.intro')}
            </p>
            <div className={styles.clients}>
              <div className={styles.clientCol}>
                <div className={styles.stage}>
                  <div className={styles.browserFrame}>
                    <img
                      src={`/landing/app-dashboard-${currentLanguage}.webp`}
                      alt={t('clients.web.alt')}
                      width={1280}
                      height={800}
                    />
                  </div>
                  <div className={styles.fade} aria-hidden />
                </div>
                <p className={styles.eyebrow} style={{ margin: '18px 0 0' }}>
                  {t('clients.web.eyebrow')}
                </p>
                <h3>{t('clients.web.title')}</h3>
                <p className={styles.clientLead}>{t('clients.web.body')}</p>
                <div className={styles.webActions}>
                  <Button
                    className={styles.clientBtn}
                    onClick={isAuthenticated ? goToDashboard : goToLogin}
                  >
                    {isAuthenticated
                      ? t('onboarding.step3.openWeb')
                      : t('onboarding.step3.loginWeb')}
                  </Button>
                </div>
              </div>

              <div className={styles.clientCol}>
                <div className={styles.stage}>
                  {showQr ? (
                    <div className={styles.qrStage}>
                      <ApkQrCode visible size={136} caption={t('qr.defaultCaption')} />
                    </div>
                  ) : (
                    <div className={styles.phoneStage}>
                      <div className={styles.phoneFrame}>
                        <img
                          src={`/landing/app-mobile-${currentLanguage}.webp`}
                          alt={t('clients.app.alt')}
                          width={600}
                          height={1244}
                        />
                      </div>
                    </div>
                  )}
                  <div className={styles.fade} aria-hidden />
                </div>
                <p className={styles.eyebrow} style={{ margin: '18px 0 0' }}>
                  {t('clients.app.eyebrow')}
                </p>
                <h3>{t('clients.app.title')}</h3>
                <p className={styles.clientLead}>{t('clients.app.body')}</p>
                <div className={styles.androidActions}>
                  <Button
                    variant="secondary"
                    className={styles.qrToggleBtn}
                    disabled={apkAvailable !== true}
                    onClick={() => setShowQr((p) => !p)}
                  >
                    {showQr
                      ? t('onboarding.step3.qrButtonHide')
                      : t('onboarding.step3.qrButton')}
                  </Button>
                  <Button
                    variant="secondary"
                    className={styles.clientBtn}
                    disabled={apkAvailable !== true}
                    onClick={handleApkDownload}
                  >
                    {apkAvailable === null
                      ? t('onboarding.step3.checking')
                      : t('onboarding.step3.downloadApk')}
                  </Button>
                </div>
                {apkAvailable === false ? (
                  <p className={styles.apkUnavailableHint}>
                    {t('onboarding.step3.apkUnavailableNote')}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
