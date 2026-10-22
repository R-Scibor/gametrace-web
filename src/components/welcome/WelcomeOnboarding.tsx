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
  const { t } = useTranslation('welcome');
  const { t: tAuth } = useTranslation('auth');
  const navigate = useNavigate();
  const discordEnabled = isDiscordLoginEnabled();
  const defaultStep2Mode: Step2Mode = discordEnabled ? 'choose' : 'code';

  const [step, setStep] = useState<StepId>(1);
  const [step2Mode, setStep2Mode] = useState<Step2Mode>(defaultStep2Mode);
  const [discordStarting, setDiscordStarting] = useState(false);
  const [discordError, setDiscordError] = useState<string | null>(null);
  const [commandStatus, setCommandStatus] = useState<'idle' | 'selected' | 'copied'>('idle');
  const [botInviteOpened, setBotInviteOpened] = useState(false);
  const [serverJoinOpened, setServerJoinOpened] = useState(false);
  const commandInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const steps = [
    { id: 1 as const, label: t('onboarding.steps.discord') },
    { id: 2 as const, label: t('onboarding.steps.register') },
    { id: 3 as const, label: t('onboarding.steps.client') },
  ];

  const discordPathOpened = botInviteOpened || serverJoinOpened;

  const resetAndClose = () => {
    setStep(1);
    setStep2Mode(defaultStep2Mode);
    setDiscordStarting(false);
    setDiscordError(null);
    setCommandStatus('idle');
    setBotInviteOpened(false);
    setServerJoinOpened(false);
    onClose();
  };

  const handleBack = () => {
    if (step === 2 && discordEnabled && step2Mode !== 'choose') {
      setStep2Mode('choose');
      setDiscordError(null);
      return;
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

  const step1Body =
    SERVER_JOIN_URL && BOT_INVITE_URL
      ? t('onboarding.step1.bodyBoth')
      : SERVER_JOIN_URL
        ? t('onboarding.step1.bodyServerOnly')
        : t('onboarding.step1.bodyBotOnly');

  const commandHint =
    commandStatus === 'copied'
      ? t('onboarding.step2.hintCopied')
      : commandStatus === 'selected'
        ? t('onboarding.step2.hintSelected')
        : t('onboarding.step2.hintIdle');

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
            <p className={styles.eyebrow}>{t('onboarding.eyebrow')}</p>
            <h2 id="onboarding-title" className={styles.title}>
              {t('onboarding.title')}
            </h2>
            <p className={styles.subtitle}>{t('onboarding.subtitle')}</p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={resetAndClose}
            aria-label={t('onboarding.closeAria')}
          >
            ×
          </button>
        </header>

        <div className={styles.progress} aria-label={t('onboarding.progressAria')}>
          {steps.map((item, index) => (
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
              {index < steps.length - 1 && (
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
            onClick={handleBack}
          >
            {t('onboarding.back')}
          </button>
        )}

        {step === 1 && (
          <section className={styles.step}>
            <h3 className={styles.stepTitle}>{t('onboarding.step1.title')}</h3>
            <p className={styles.stepBody}>{step1Body}</p>
            <div className={styles.stepActions}>
              {SERVER_JOIN_URL ? (
                <button
                  type="button"
                  className={[
                    styles.stepBtn,
                    discordPathOpened ? styles.stepBtnNeutral : styles.stepBtnOrange,
                  ].join(' ')}
                  onClick={openServerJoin}
                >
                  {t('onboarding.step1.joinServer')}
                </button>
              ) : null}
              {BOT_INVITE_URL ? (
                <button
                  type="button"
                  className={[
                    styles.stepBtn,
                    discordPathOpened ? styles.stepBtnNeutral : styles.stepBtnOrange,
                  ].join(' ')}
                  onClick={openBotInvite}
                >
                  {t('onboarding.step1.addBot')}
                </button>
              ) : null}
              <button
                type="button"
                className={[
                  styles.stepBtn,
                  discordPathOpened ? styles.stepBtnOrange : styles.stepBtnNeutral,
                ].join(' ')}
                onClick={() => {
                  setStep2Mode(defaultStep2Mode);
                  setDiscordError(null);
                  setStep(2);
                }}
              >
                {t('onboarding.step1.alreadyHaveBot')}
              </button>
            </div>
            {serverJoinOpened && (
              <p className={styles.stepHint}>{t('onboarding.step1.hintServer')}</p>
            )}
            {botInviteOpened && (
              <p className={styles.stepHint}>{t('onboarding.step1.hintBot')}</p>
            )}
          </section>
        )}

        {step === 2 && (
          step2Mode === 'choose' ? (
            <section className={styles.step}>
              <h3 className={styles.stepTitle}>{t('onboarding.step2.chooseTitle')}</h3>
              <p className={styles.stepBody}>{t('onboarding.step2.chooseBody')}</p>
              <div className={styles.stepActions}>
                <Button variant="secondary" onClick={() => setStep2Mode('code')}>
                  {t('onboarding.step2.chooseCode')}
                </Button>
                <Button onClick={() => setStep2Mode('discord')}>
                  {t('onboarding.step2.chooseDiscord')}
                </Button>
              </div>
            </section>
          ) : step2Mode === 'discord' ? (
            <section className={styles.step}>
              <h3 className={styles.stepTitle}>{tAuth('botContact.title')}</h3>
              <p className={styles.stepBody}>{tAuth('botContact.body')}</p>
              <p className={styles.stepHint}>{tAuth('botContact.permission')}</p>
              {discordError ? (
                <p className={styles.stepError} role="alert">
                  {discordError}
                </p>
              ) : null}
              <div className={styles.linkGroup}>
                {SERVER_JOIN_URL ? (
                  <Button variant="secondary" onClick={openServerJoin}>
                    {tAuth('botContact.join')}
                  </Button>
                ) : null}
                {BOT_INVITE_URL ? (
                  <Button variant="secondary" onClick={openBotInvite}>
                    {tAuth('botContact.addBot')}
                  </Button>
                ) : null}
              </div>
              <div className={styles.stepActions}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDiscordError(null);
                    setStep2Mode('choose');
                  }}
                  disabled={discordStarting}
                >
                  {tAuth('botContact.back')}
                </Button>
                <Button onClick={() => void handleDiscordRedirect()} disabled={discordStarting}>
                  {discordStarting ? tAuth('discord.starting') : tAuth('botContact.continue')}
                </Button>
              </div>
            </section>
          ) : (
            <section className={styles.step}>
              <h3 className={styles.stepTitle}>{t('onboarding.step2.title')}</h3>
              <p className={styles.stepBody}>{t('onboarding.step2.body')}</p>
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
                  aria-label={t('onboarding.step2.commandAria')}
                  aria-describedby="onboarding-login-command-hint"
                  onFocus={(e) => {
                    e.target.select();
                    setCommandStatus('selected');
                  }}
                  onClick={handleCommandField}
                />
              </label>
              <p id="onboarding-login-command-hint" className={styles.commandHint}>
                {commandHint}
              </p>
              <div className={styles.stepActions}>
                <Button onClick={() => setStep(3)}>{t('onboarding.step2.haveCode')}</Button>
              </div>
            </section>
          )
        )}

        {step === 3 && (
          <section className={styles.step}>
            <h3 className={styles.stepTitle}>{t('onboarding.step3.title')}</h3>
            <p className={styles.stepBody}>{t('onboarding.step3.body')}</p>
            <div className={styles.clientGrid}>
              <article className={styles.clientCard}>
                <p className={styles.clientLabel}>{t('onboarding.step3.webLabel')}</p>
                <p className={styles.clientBody}>{t('onboarding.step3.webBody')}</p>
                <div className={styles.clientGrow} aria-hidden />
                <div className={styles.clientFooter}>
                  <Button onClick={isAuthenticated ? goToDashboard : goToLogin}>
                    {isAuthenticated ? t('onboarding.step3.openWeb') : t('onboarding.step3.loginWeb')}
                  </Button>
                </div>
              </article>
              <article className={styles.clientCard}>
                <p className={styles.clientLabel}>{t('onboarding.step3.appLabel')}</p>
                <p className={styles.clientBody}>{t('onboarding.step3.appBody')}</p>
                <div className={styles.clientGrow}>
                  <ApkQrCode visible={apkAvailable === true} />
                </div>
                <div className={styles.clientFooter}>
                  <Button disabled={apkAvailable !== true} onClick={handleApkDownload}>
                    {apkAvailable === null
                      ? t('onboarding.step3.checking')
                      : t('onboarding.step3.downloadApk')}
                  </Button>
                </div>
              </article>
            </div>
          </section>
        )}

        <footer className={styles.footer}>
          <button type="button" className={styles.footerLink} onClick={goToLogin}>
            {t('onboarding.footerLogin')}
          </button>
        </footer>
      </div>
    </div>
  );
}
