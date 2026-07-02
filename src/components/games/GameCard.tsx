import { Link } from 'react-router-dom';
import type { Game } from '../../types/api';
import { Cover } from '../Cover';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const needsReview =
    game.enrichment_status === 'NEEDS_REVIEW' && game.is_accepted !== true && !game.is_ignored;

  return (
    <Link to={`/library/${game.id}`} state={{ game }} className={styles.card}>
      <div
        className={[
          styles.coverWrapper,
          needsReview ? styles.coverReview : '',
          game.is_ignored ? styles.coverIgnored : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Cover
          gameId={game.id}
          coverImageUrl={game.cover_image_url}
          placeholderChar={game.primary_name}
        />
        {needsReview && <span className={styles.reviewBadge} aria-label="Do sprawdzenia">⚠</span>}
        {game.is_ignored && <span className={styles.ignoredBadge}>UKRYTE</span>}
      </div>
      <div className={styles.title} title={game.primary_name}>
        {game.primary_name}
      </div>
    </Link>
  );
}