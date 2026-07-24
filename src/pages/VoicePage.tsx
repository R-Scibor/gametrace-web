import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SectionHeader, Button, ErrorBanner } from '../components/ui';
import { useTranscribeVoice } from '../hooks/useTranscribeVoice';
import { useVoiceRecord, VoicePermissionError } from '../hooks/useVoiceRecord';
import styles from './VoicePage.module.css';

type VoiceState = 'idle' | 'recording' | 'processing';

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function VoicePage() {
  const { t } = useTranslation('voice');
  const { isRecording, start, stop } = useVoiceRecord();
  const [elapsed, setElapsed] = useState(0);
  const [permissionError, setPermissionError] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const transcribeMut = useTranscribeVoice();

  const state: VoiceState = transcribeMut.isPending
    ? 'processing'
    : isRecording
      ? 'recording'
      : 'idle';

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleRecordToggle = async () => {
    setPermissionError(false);
    setRecordError(null);

    if (!isRecording) {
      setElapsed(0);
      try {
        await start();
      } catch (err) {
        if (err instanceof VoicePermissionError) {
          setPermissionError(true);
        } else {
          setRecordError(t('errors.recordFailed'));
        }
      }
      return;
    }

    try {
      const blob = await stop();
      transcribeMut.mutate(blob);
    } catch {
      setRecordError(t('errors.recordFailed'));
    }
  };

  const statusLabel =
    state === 'recording'
      ? t('status.recording')
      : state === 'processing'
        ? t('status.processing')
        : t('status.ready');

  return (
    <div className={styles.container}>
      <SectionHeader title={t('title')} />

      <div className={styles.panel}>
        <div className={styles.statusStrip}>
          <span
            className={[styles.statusDot, state === 'recording' ? styles.statusDotActive : '']
              .filter(Boolean)
              .join(' ')}
          />
          <span className={styles.statusLabel}>{statusLabel}</span>
          {isRecording && <span className={styles.elapsed}>{formatElapsed(elapsed)}</span>}
        </div>

        <div className={styles.waveform}>
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className={[styles.bar, isRecording ? styles.barActive : ''].filter(Boolean).join(' ')}
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>

        <p className={styles.hint}>{t('hint')}</p>

        {permissionError && (
          <ErrorBanner
            label={t('permission.label')}
            message={t('permission.message')}
          />
        )}
        {recordError && <ErrorBanner message={recordError} />}
        {transcribeMut.isError && (
          <ErrorBanner message={t('errors.transcribeFailed')} />
        )}

        <Button onClick={handleRecordToggle} disabled={state === 'processing'} variant="primary">
          {state === 'processing'
            ? t('actions.processing')
            : isRecording
              ? t('actions.stop')
              : t('actions.start')}
        </Button>
      </div>
    </div>
  );
}
