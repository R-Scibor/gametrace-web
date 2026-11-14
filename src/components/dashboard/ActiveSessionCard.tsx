import type { ActiveSessionBrief, GameStats } from '../../types/api';
import { UnifiedHeroCard } from './UnifiedHeroCard';

interface ActiveSessionCardProps {
  session: ActiveSessionBrief;
  stats?: GameStats | null;
}

export function ActiveSessionCard({ session }: ActiveSessionCardProps) {
  return (
    <UnifiedHeroCard
      mode="live"
      gameId={session.game_id}
      gameName={session.game_name}
      coverImageUrl={session.cover_image_url}
      liveSession={session}
    />
  );
}
