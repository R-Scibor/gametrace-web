import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Game, GameSort } from '../../types/api';
import { useFormat } from '../../hooks/useFormat';
import { Cover } from '../Cover';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: Game;
  sort?: GameSort;
  disabled?: boolean;
  coversOnly?: boolean;
}

const AlertIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="13"
    height="13"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export function GameCard({ game, sort = 'name', disabled, coversOnly = false }: GameCardProps) {
  const { t } = useTranslation('library');
  const { formatDuration, formatRecency } = useFormat();
  const needsReview =
    game.enrichment_status === 'NEEDS_REVIEW' && game.is_accepted !== true && !game.is_ignored;

  const meta =
    sort === 'playtime'
      ? formatDuration(game.total_seconds)
      : sort === 'last_played' && game.last_played
        ? formatRecency(game.last_played)
        : null;

  const body = (
    <>
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
        {needsReview && (
          <span className={styles.reviewBadge} aria-label={t('card.needsReviewAria')}>
            <AlertIcon />
          </span>
        )}
        {game.is_ignored && <span className={styles.ignoredBadge}>{t('card.ignored')}</span>}
      </div>
      {!coversOnly && (
        <div className={styles.details}>
          <div className={styles.title} title={game.primary_name}>
            {game.primary_name}
          </div>
          {meta && <div className={styles.meta}>{meta}</div>}
        </div>
      )}
    </>
  );

  const cardClassName = [styles.card, coversOnly ? styles.cardCoversOnly : ''].filter(Boolean).join(' ');

  if (disabled) {
    return (
      <div className={cardClassName} title={game.primary_name} aria-label={game.primary_name}>
        {body}
      </div>
    );
  }

  return (
    <Link
      to={`/library/${game.id}`}
      state={{ game }}
      className={cardClassName}
      title={game.primary_name}
      aria-label={game.primary_name}
    >
      {body}
    </Link>
  );
}