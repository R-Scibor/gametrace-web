import { Link } from 'react-router-dom';
import type { Game } from '../../types/api';
import { Cover } from '../Cover';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const needsReview = game.enrichment_status === 'NEEDS_REVIEW';

  return (
    <Link to={`/library/${game.id}`} className={styles.card}>
      <div className={styles.coverWrapper}>
        <Cover
          gameId={game.id}
          coverImageUrl={game.cover_image_url}
          placeholderChar={game.primary_name}
        />
        {needsReview && <span className={styles.badge}>DO SPRAWDZENIA</span>}
      </div>
      <div className={styles.title} title={game.primary_name}>
        {game.primary_name}
      </div>
    </Link>
  );
}