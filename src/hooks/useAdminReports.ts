import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { getAdminReports, patchAdminReport } from '../api/admin';
import i18n from '../i18n';
import { qk } from '../lib/queryKeys';
import { useToastStore } from '../store/toastStore';
import type { AdminReportsQuery } from '../types/api';

export function useAdminReports(
  filter: AdminReportsQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: qk.adminReports(filter),
    queryFn: () => getAdminReports(filter),
    enabled: options?.enabled,
  });
}

export function useTriageReport() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'triaged' | 'closed' }) =>
      patchAdminReport(id, { status }),
    onSuccess: (_data, { status }) => {
      queryClient.invalidateQueries({ queryKey: qk.adminReportsPrefix });
      // The overview's open_reports_count is downstream of this mutation.
      queryClient.invalidateQueries({ queryKey: qk.adminOverview });
      pushToast({
        type: 'success',
        message: status === 'closed' ? i18n.t('admin:reports.toast.closed') : i18n.t('admin:reports.toast.triaged'),
      });
    },
    onError: (err) => {
      const httpStatus = axios.isAxiosError(err) ? err.response?.status : undefined;
      pushToast({
        type: 'error',
        message:
          httpStatus === 403 ? i18n.t('admin:common.forbidden') : i18n.t('admin:reports.toast.updateFailed'),
      });
    },
  });
}
