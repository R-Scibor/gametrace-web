import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { SectionHeader, Button, ErrorBanner } from '../components/ui';
import { transcribeAudio } from '../api/voice';
import { resolveGame } from '../api/games';
import { useVoiceRecord, VoicePermissionError } from '../hooks/useVoiceRecord';
import styles from './VoicePage.module.css';

type VoiceState = 'idle' | 'recording' | 'processing';

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function VoicePage() {
  const navigate = useNavigate();
  const { isRecording, start, stop } = useVoiceRecord();
  const [elapsed, setElapsed] = useState(0);
  const [permissionError, setPermissionError] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const transcribeMut = useMutation({
    mutationFn: transcribeAudio,
    onSuccess: async (data) => {
      let gameId = '';
      if (data.game) {
        try {
          const resolved = await resolveGame(data.game);
          if (resolved) gameId = String(resolved.game_id);
        } catch {
          // ignore resolve failure
        }
      }

      const params = new URLSearchParams();
      if (gameId) params.append('gameId', gameId);

      if (data.date && data.start_time) {
        params.append('startTime', `${data.date}T${data.start_time}`);
        if (data.end_time) params.append('endTime', `${data.date}T${data.end_time}`);
      }

      if (data.raw_transcript) params.append('note', data.raw_transcript);

      navigate(`/sessions/new?${params.toString()}`);
    },
  });

  const state: VoiceState = transcribeMut.isPending
    ? 'processing'
    : isRecording
      ? 'recording'
      : 'idle';

  useEffect(() => {
    if (!isRecording) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
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
          setRecordError('Nagrywanie nie powiodło się.');
        }
      }
      return;
    }

    try {
      const blob = await stop();
      transcribeMut.mutate(blob);
    } catch {
      setRecordError('Nagrywanie nie powiodło się.');
    }
  };

  const statusLabel =
    state === 'recording' ? 'NAGRYWANIE' : state === 'processing' ? 'PRZETWARZANIE' : 'GOTOWY';

  return (
    <div className={styles.container}>
      <SectionHeader title="Sesja głosowa" />

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

        <button
          type="button"
          className={[styles.recordBtn, isRecording ? styles.recordBtnActive : '']
            .filter(Boolean)
            .join(' ')}
          onClick={handleRecordToggle}
          disabled={state === 'processing'}
          aria-label={isRecording ? 'Zakończ nagrywanie' : 'Rozpocznij nagrywanie'}
        >
          {state === 'processing' ? '...' : isRecording ? '■' : '●'}
        </button>

        <p className={styles.hint}>
          Przykład: „Grałem w Wiedźmina dzisiaj od 18 do 20”. Naciśnij, aby nagrać, i ponownie aby
          zakończyć.
        </p>

        {permissionError && (
          <ErrorBanner
            label="BRAK DOSTĘPU"
            message="Zezwól na mikrofon w ustawieniach przeglądarki."
          />
        )}
        {recordError && <ErrorBanner message={recordError} />}
        {transcribeMut.isError && (
          <ErrorBanner message="Nie udało się przetworzyć nagrania. Spróbuj ponownie." />
        )}

        <Button onClick={handleRecordToggle} disabled={state === 'processing'} variant="primary">
          {state === 'processing'
            ? 'PRZETWARZANIE...'
            : isRecording
              ? 'ZAKOŃCZ I PRZETWÓRZ'
              : 'ROZPOCZNIJ NAGRYWANIE'}
        </Button>
      </div>
    </div>
  );
}