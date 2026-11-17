import { useHealth } from './useHealth';
import { graceDaysFrom } from '../lib/accountDeletion';

/** Account deletion grace period in days, read from `/health` with a fallback while it loads. */
export function useGraceDays(): number {
  const { data: health } = useHealth();
  return graceDaysFrom(health);
}
