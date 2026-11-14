import type { GameStats, Session } from '../../types/api';
import { UnifiedHeroCard } from './UnifiedHeroCard';

interface HeroSpotlightProps {
  session: Session;
  stats: GameStats | null | undefined;
  disabled?: boolean;
}

export function HeroSpotlight({ session, stats, disabled }: HeroSpotlightProps) {
  return (
    <UnifiedHeroCard
      mode="idle"
      gameId={session.game_id}
      gameName={session.game.primary_name}
      coverImageUrl={session.game.cover_image_url}
      idleSession={session}
      idleStats={stats}
      disabled={disabled}
    />
  );
}
