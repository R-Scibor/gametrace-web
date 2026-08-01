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
      let gameName = '';
      if (data.game) {
        try {
          const resolved = await resolveGame(data.game);
          if (resolved) gameId = String(resolved.game_id);
        } catch {
          // ignore resolve failure
        }
        // On a miss (or a failed resolve) carry the transcribed title forward so
        // the picker can escalate instead of dead-ending on an empty field.
        if (!gameId) gameName = data.game;
      }

      const params = new URLSearchParams();
      if (gameId) params.append('gameId', gameId);
      // URLSearchParams.toString() percent-encodes; do NOT encodeURIComponent here
      // or spaces and diacritics get double-encoded.
      if (gameName) params.append('gameName', gameName);

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