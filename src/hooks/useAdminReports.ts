import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  deleteAdminReport,
  getAdminReportFacets,
  getAdminReports,
  patchAdminReport,
} from '../api/admin';
import i18n from '../i18n';
import { qk } from '../lib/queryKeys';
import { useToastStore } from '../store/toastStore';
import type { AdminReportPatch, AdminReportsQuery, ReportStatus } from '../types/api';

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

export function useAdminReportFacets(status?: ReportStatus) {
  return useQuery({
    queryKey: qk.adminReportFacets(status),
    queryFn: () => getAdminReportFacets(status),
  });
}

function invalidateReportCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: qk.adminReportsPrefix });
  queryClient.invalidateQueries({ queryKey: qk.adminOverview });
}

export function usePatchAdminReport() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: number } & AdminReportPatch) => patchAdminReport(id, body),
    onSuccess: (_data, vars) => {
      invalidateReportCaches(queryClient);
      if (vars.status !== undefined) {
        const key =
          vars.status === 'closed'
            ? 'admin:reports.toast.closed'
            : vars.status === 'triaged'
              ? 'admin:reports.toast.triaged'
              : 'admin:reports.toast.reopened';
        pushToast({ type: 'success', message: i18n.t(key) });
      } else if (vars.admin_note !== undefined) {
        pushToast({
          type: 'success',
          message: i18n.t('admin:reports.toast.noteSaved'),
        });
      }
    },
    onError: (err) => {
      const httpStatus = axios.isAxiosError(err) ? err.response?.status : undefined;
      pushToast({
        type: 'error',
        message:
          httpStatus === 403
            ? i18n.t('admin:common.forbidden')
            : httpStatus === 404
              ? i18n.t('admin:reports.toast.notFound')
              : i18n.t('admin:reports.toast.updateFailed'),
      });
      if (httpStatus === 404) {
        invalidateReportCaches(queryClient);
      }
    },
  });
}

export function useDeleteAdminReport() {
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.pushToast);

  return useMutation({
    mutationFn: (id: number) => deleteAdminReport(id),
    onSuccess: () => {
      invalidateReportCaches(queryClient);
      pushToast({
        type: 'success',
        message: i18n.t('admin:reports.toast.deleted'),
      });
    },
    onError: (err) => {
      const httpStatus = axios.isAxiosError(err) ? err.response?.status : undefined;
      pushToast({
        type: 'error',
        message:
          httpStatus === 403
            ? i18n.t('admin:common.forbidden')
            : httpStatus === 404
              ? i18n.t('admin:reports.toast.notFound')
              : i18n.t('admin:reports.toast.deleteFailed'),
      });
      if (httpStatus === 404) {
        invalidateReportCaches(queryClient);
      }
    },
  });
}
