import { useQuery } from '@tanstack/react-query';
import { 
  getStatsSummary, getHeatmap, getStreak, getWeeklyTrend, 
  getGenres, getThemes, getCompanies, getReleaseYears 
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

export function useWeeklyTrend(weeks?: number) {
  return useQuery({
    queryKey: qk.stats('weekly-trend', { weeks }),
    queryFn: () => getWeeklyTrend(weeks),
  });
}

export function useGenres() {
  return useQuery({
    queryKey: qk.stats('genres'),
    queryFn: getGenres,
  });
}

export function useThemes() {
  return useQuery({
    queryKey: qk.stats('themes'),
    queryFn: getThemes,
  });
}

export function useCompanies(role: 'developer' | 'publisher', limit?: number) {
  return useQuery({
    queryKey: qk.stats('companies', { role, limit }),
    queryFn: () => getCompanies(role, limit),
  });
}

export function useReleaseYears() {
  return useQuery({
    queryKey: qk.stats('release-years'),
    queryFn: getReleaseYears,
  });
}
