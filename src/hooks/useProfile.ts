import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateSettings } from '../api/profile';
import { qk } from '../lib/queryKeys';
import type { ProfileSettingsUpdate } from '../types/api';

export function useProfile() {
  return useQuery({
    queryKey: qk.profile,
    queryFn: getMe,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfileSettingsUpdate) => updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.profile });
    },
  });
}