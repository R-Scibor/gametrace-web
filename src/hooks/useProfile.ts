import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateSettings } from '../api/profile';
import i18n from '../i18n';
import { qk } from '../lib/queryKeys';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import type { ProfileSettingsUpdate } from '../types/api';

export function useProfile() {
  const setIsAdmin = useAuthStore((s) => s.setIsAdmin);
  const query = useQuery({
    queryKey: qk.profile,
    queryFn: getMe,
  });

  useEffect(() => {
    if (query.data?.is_admin !== undefined) {
      setIsAdmin(query.data.is_admin);
    }
  }, [query.data?.is_admin, setIsAdmin]);

  return query;
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: (payload: ProfileSettingsUpdate) => updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.profile });
      pushToast({ type: 'success', message: i18n.t('common:toast.settingsSaved') });
    },
    onError: () => {
      pushToast({ type: 'error', message: i18n.t('common:toast.settingsSaveFailed') });
    },
  });
}