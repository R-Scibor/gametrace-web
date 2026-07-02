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

export function useStatsSummary(days = 30) {
  return useQuery({
    queryKey: qk.stats('summary', { days }),
    queryFn: () => getStatsSummary(days),
  });
}

export function useHeatmap(days?: number) {
  return useQuery({
    queryKey: qk.stats('heatmap', { days }),
    queryFn: () => getHeatmap(days),
  });
}

export function useStreak() {
  return useQuery({
    queryKey: qk.stats('streak'),
    queryFn: getStreak,
  });
}

export function useTrend(days?: number) {
  return useQuery({
    queryKey: qk.stats('trend', { days }),
    queryFn: () => getTrend(days),
  });
}

export function useGenres(days?: number) {
  return useQuery({
    queryKey: qk.stats('genres', { days }),
    queryFn: () => getGenres(days),
  });
}

export function useThemes(days?: number) {
  return useQuery({
    queryKey: qk.stats('themes', { days }),
    queryFn: () => getThemes(days),
  });
}

export function useCompanies(role: 'developer' | 'publisher', limit?: number, days?: number) {
  return useQuery({
    queryKey: qk.stats('companies', { role, limit, days }),
    queryFn: () => getCompanies(role, limit, days),
  });
}

export function useReleaseYears(days?: number) {
  return useQuery({
    queryKey: qk.stats('release-years', { days }),
    queryFn: () => getReleaseYears(days),
  });
}