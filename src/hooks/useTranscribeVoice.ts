import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { transcribeAudio } from '../api/voice';
import { resolveGame } from '../api/games';
import { setVoiceTranscriptPrefill } from '../lib/voicePrefill';

export function useTranscribeVoice() {
  const navigate = useNavigate();

  return useMutation({
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

      if (data.raw_transcript) setVoiceTranscriptPrefill(data.raw_transcript);

      const qs = params.toString();
      navigate(qs ? `/sessions/new?${qs}` : '/sessions/new');
    },
  });
}