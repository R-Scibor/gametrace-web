import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hardDeleteSession } from '../api/sessions';
import { qk } from '../lib/queryKeys';
import { useToastStore } from '../store/toastStore';

export function useHardDeleteSession() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: hardDeleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.trash });
      pushToast({ type: 'success', message: 'Sesja trwale usunięta.' });
    },
    onError: () => {
      pushToast({ type: 'error', message: 'Nie udało się usunąć sesji.' });
    },
  });
}