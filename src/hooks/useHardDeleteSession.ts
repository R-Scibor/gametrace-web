import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hardDeleteSession } from '../api/sessions';
import i18n from '../i18n';
import { qk } from '../lib/queryKeys';
import { useToastStore } from '../store/toastStore';

export function useHardDeleteSession() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: hardDeleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.trash });
      pushToast({ type: 'success', message: i18n.t('trash:toast.hardDeleted') });
    },
    onError: () => {
      pushToast({ type: 'error', message: i18n.t('trash:toast.hardDeleteFailed') });
    },
  });
}