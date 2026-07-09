import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { adminUploadCover } from '../api/admin';
import { fileToBase64 } from '../lib/files';
import { qk } from '../lib/queryKeys';
import { useGamesStore } from '../store/gamesStore';
import { useToastStore } from '../store/toastStore';

export function useAdminUploadCover(gameId: number) {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);
  const invalidateGames = useGamesStore((s) => s.invalidate);

  return useMutation({
    mutationFn: async (file: File) => {
      const { base64, extension } = await fileToBase64(file);
      return adminUploadCover(gameId, { image_base64: base64, extension });
    },
    onSuccess: (game) => {
      queryClient.setQueryData(qk.game(gameId), game);
      queryClient.invalidateQueries({ queryKey: ['games'] });
      invalidateGames();
      pushToast({ type: 'success', message: 'Globalna okładka zapisana.' });
    },
    onError: (err) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const message =
        status === 403
          ? 'Brak uprawnień.'
          : status === 422
            ? 'Nieprawidłowy plik obrazu.'
            : 'Nie udało się zapisać globalnej okładki.';
      pushToast({ type: 'error', message });
    },
  });
}