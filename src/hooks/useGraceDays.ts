import { useHealth } from './useHealth';
import { graceDaysFrom } from '../lib/accountDeletion';

/** Account deletion grace period in days, read from `/health` with a '-' fallback while it loads or when missing. */
export function useGraceDays(): number | string {
  const { data: health } = useHealth();
  return graceDaysFrom(health);
}
