import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useGamesAll, useGamePreference } from '../hooks/useGames';
import { useGameSessions } from '../hooks/useGameSessions';
import { Cover } from '../components/Cover';
import { CoverUpload } from '../components/library/CoverUpload';
import { MergeDialog } from '../components/library/MergeDialog';
import { SectionHeader, Skeleton, Button } from '../components/ui';
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
  const [mergeOpen, setMergeOpen] = useState(false);
  const [ignored, setIgnored] = useState<boolean | null>(null);

  const { data: games, isLoading: gamesLoading } = useGamesAll();
  const { data: sessions, isLoading: sessionsLoading } = useGameSessions(id);
  const prefMut = useGamePreference(id);

  if (gamesLoading || sessionsLoading) return <GameDetailSkeleton />;

  const gameFromList = games?.find((g) => g.id === id);
  const likelyIgnored = !gameFromList && (sessions?.length ?? 0) > 0;

  const game: Game | null = gameFromList ?? (sessions?.[0]?.game
    ? {
        id,
        primary_name: sessions[0].game.primary_name,
        cover_image_url: sessions[0].game.cover_image_url,
        cover_source: 'EXTERNAL',
        enrichment_status: 'ENRICHED',
        is_ignored: likelyIgnored,
        is_accepted: true,
      }
    : null);

  if (!game) return <Navigate to="/library" replace />;

  const completed = sessions?.filter((s) => s.duration_seconds) || [];
  const totalSeconds = completed.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  const avgSeconds = completed.length ? Math.round(totalSeconds / completed.length) : 0;
  const isIgnored = ignored ?? gameFromList?.is_ignored ?? likelyIgnored;

  const toggleIgnore = () => {
    const next = !isIgnored;
    prefMut.mutate(next, { onSuccess: () => setIgnored(next) });
  };

  return (
    <div className={styles.container}>
      <Link to="/library" className={styles.backLink}>
        ← Biblioteka
      </Link>

      <div className={styles.hero}>
        <div className={styles.coverWrapper}>
          <Cover gameId={id} coverImageUrl={game.cover_image_url} placeholderChar={game.primary_name} />
        </div>
        <div className={styles.info}>
          <h1 className={styles.title}>{game.primary_name}</h1>
          {game.enrichment_status === 'NEEDS_REVIEW' && (
            <span className={styles.reviewBadge}>DO SPRAWDZENIA</span>
          )}
          {isIgnored && <span className={styles.ignoredBadge}>IGNOROWANA</span>}
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

      <div className={styles.actionsPanel}>
        <SectionHeader title="Akcje" />
        <div className={styles.actionsGrid}>
          <CoverUpload gameId={id} coverUrl={game.cover_image_url} gameName={game.primary_name} />
          <div className={styles.actionButtons}>
            <Button type="button" variant="secondary" onClick={() => setMergeOpen(true)}>
              POŁĄCZ Z GRĄ
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={prefMut.isPending}
              onClick={toggleIgnore}
            >
              {isIgnored ? 'PRZYWRÓĆ DO BIBLIOTEKI' : 'IGNORUJ GRĘ'}
            </Button>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader title="Historia sesji" />
        <SessionList sessions={sessions || []} />
      </div>

      {mergeOpen && (
        <MergeDialog
          sourceId={id}
          sourceName={game.primary_name}
          onClose={() => setMergeOpen(false)}
        />
      )}
    </div>
  );
}