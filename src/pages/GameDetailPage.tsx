import { Link, useParams, Navigate } from 'react-router-dom';
import { useGamesAll } from '../hooks/useGames';
import { useGameSessions } from '../hooks/useGameSessions';
import { Cover } from '../components/Cover';
import { SectionHeader, Skeleton } from '../components/ui';
import { SessionList } from '../components/games/SessionList';
import { formatDuration } from '../lib/format';
import type { Game } from '../types/api';
import styles from './GameDetailPage.module.css';

function GameDetailSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <Skeleton height={200} width={140} />
        <div className={styles.info} style={{ flex: 1 }}>
          <Skeleton height={32} width="60%" />
          <div className={styles.stats}>
            <Skeleton height={60} />
            <Skeleton height={60} />
            <Skeleton height={60} />
          </div>
        </div>
      </div>
      <Skeleton height={20} width={200} />
      <Skeleton height={120} />
    </div>
  );
}

export function GameDetailPage() {
  const { gameId } = useParams();
  const id = Number(gameId);

  const { data: games, isLoading: gamesLoading } = useGamesAll();
  const { data: sessions, isLoading: sessionsLoading } = useGameSessions(id);

  if (gamesLoading || sessionsLoading) return <GameDetailSkeleton />;

  const gameFromList = games?.find((g) => g.id === id);

  const game: Game | null = gameFromList ?? (sessions?.[0]?.game
    ? {
        id,
        primary_name: sessions[0].game.primary_name,
        cover_image_url: sessions[0].game.cover_image_url,
        cover_source: 'EXTERNAL',
        enrichment_status: 'ENRICHED',
      }
    : null);

  if (!game) return <Navigate to="/library" replace />;

  const completed = sessions?.filter((s) => s.duration_seconds) || [];
  const totalSeconds = completed.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  const avgSeconds = completed.length ? Math.round(totalSeconds / completed.length) : 0;

  return (
    <div className={styles.container}>
      <Link to="/library" className={styles.backLink}>
        ← Biblioteka
      </Link>

      <div className={styles.hero}>
        <div className={styles.coverWrapper}>
          <Cover coverImageUrl={game.cover_image_url} placeholderChar={game.primary_name} />
        </div>
        <div className={styles.info}>
          <h1 className={styles.title}>{game.primary_name}</h1>
          {game.enrichment_status === 'NEEDS_REVIEW' && (
            <span className={styles.reviewBadge}>DO SPRAWDZENIA</span>
          )}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{sessions?.length || 0}</span>
              <span className={styles.statLabel}>SESJE</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatDuration(totalSeconds)}</span>
              <span className={styles.statLabel}>ŁĄCZNIE</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatDuration(avgSeconds)}</span>
              <span className={styles.statLabel}>ŚREDNIO</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader title="Historia sesji" />
        <SessionList sessions={sessions || []} />
      </div>
    </div>
  );
}