import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateSettings } from '../api/profile';
import { qk } from '../lib/queryKeys';
import { useToastStore } from '../store/toastStore';
import type { ProfileSettingsUpdate } from '../types/api';

export function useProfile() {
  return useQuery({
    queryKey: qk.profile,
    queryFn: getMe,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: (payload: ProfileSettingsUpdate) => updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.profile });
      pushToast({ type: 'success', message: 'Ustawienia zapisane.' });
    },
    onError: () => {
      pushToast({ type: 'error', message: 'Nie udało się zapisać ustawień.' });
    },
  });
}