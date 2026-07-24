import { useQuery } from '@tanstack/react-query';
import {
  getStatsSummary,
  getHeatmap,
  getStreak,
  getTrend,
  getGenres,
  getThemes,
  getCompanies,
  getReleaseYears,
} from '../api/stats';
import { qk } from '../lib/queryKeys';

interface QueryOptions {
  enabled?: boolean;
}

export function useStatsSummary(days = 30, options: QueryOptions = {}) {
  return useQuery({
    queryKey: qk.stats('summary', { days }),
    queryFn: () => getStatsSummary(days),
    enabled: options.enabled ?? true,
  });
}

export function useHeatmap(days?: number, options: QueryOptions = {}) {
  return useQuery({
    queryKey: qk.stats('heatmap', { days }),
    queryFn: () => getHeatmap(days),
    enabled: options.enabled ?? true,
  });
}

export function useStreak() {
  return useQuery({
    queryKey: qk.stats('streak'),
    queryFn: getStreak,
  });
}

export function useTrend(days?: number, options: QueryOptions = {}) {
  return useQuery({
    queryKey: qk.stats('trend', { days }),
    queryFn: () => getTrend(days),
    enabled: options.enabled ?? true,
  });
}

export function useGenres(days?: number, options: QueryOptions = {}) {
  return useQuery({
    queryKey: qk.stats('genres', { days }),
    queryFn: () => getGenres(days),
    enabled: options.enabled ?? true,
  });
}

export function useThemes(days?: number, options: QueryOptions = {}) {
  return useQuery({
    queryKey: qk.stats('themes', { days }),
    queryFn: () => getThemes(days),
    enabled: options.enabled ?? true,
  });
}

export function useCompanies(
  role: 'developer' | 'publisher',
  limit?: number,
  days?: number,
  options: QueryOptions = {},
) {
  return useQuery({
    queryKey: qk.stats('companies', { role, limit, days }),
    queryFn: () => getCompanies(role, limit, days),
    enabled: options.enabled ?? true,
  });
}

export function useReleaseYears(days?: number, options: QueryOptions = {}) {
  return useQuery({
    queryKey: qk.stats('release-years', { days }),
    queryFn: () => getReleaseYears(days),
    enabled: options.enabled ?? true,
  });
}