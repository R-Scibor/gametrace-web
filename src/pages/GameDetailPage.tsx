import { useMemo, useState } from 'react';
import { Link, useLocation, useParams, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGame, useUpdateGamePreference } from '../hooks/useGames';
import { useGameSessions } from '../hooks/useGameSessions';
import { useGameStats } from '../hooks/useGameStats';
import { Cover } from '../components/Cover';
import { AdminGlobalCoverUpload } from '../components/admin/AdminGlobalCoverUpload';
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
  const location = useLocation();
  const gameFromNav = (location.state as { game?: Game } | null)?.game;
  const [mergeOpen, setMergeOpen] = useState(false);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const { data: game, isLoading: gameLoading } = useGame(id, gameFromNav);
  const { data: stats, isLoading: statsLoading } = useGameStats(id);
  const {
    data: sessionPages,
    isLoading: sessionsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGameSessions(id);
  const prefMut = useUpdateGamePreference(id);

  const sessions = useMemo(() => sessionPages?.pages.flat() ?? [], [sessionPages]);

  if (gameLoading || statsLoading || sessionsLoading) return <GameDetailSkeleton />;
  if (!game) return <Navigate to="/library" replace />;

  const sessionCount = stats?.session_count ?? 0;
  const totalSeconds = stats?.total_seconds ?? 0;
  const avgSeconds = sessionCount ? Math.round(totalSeconds / sessionCount) : 0;
  const canAccept = game.enrichment_status === 'NEEDS_REVIEW' && game.is_accepted !== true;

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
          {canAccept && <span className={styles.reviewBadge}>DO SPRAWDZENIA</span>}
          {game.is_ignored && <span className={styles.ignoredBadge}>IGNOROWANA</span>}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{sessionCount}</span>
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
          <div className={styles.coverSection}>
            <p className={styles.coverSectionLabel}>Okładka lokalna</p>
            <CoverUpload gameId={id} coverUrl={game.cover_image_url} gameName={game.primary_name} />
          </div>
          {isAdmin && (
            <div className={styles.coverSection}>
              <p className={styles.coverSectionLabel}>Okładka globalna</p>
              <AdminGlobalCoverUpload
                gameId={id}
                gameName={game.primary_name}
                coverUrl={game.cover_image_url}
                coverSource={game.cover_source}
              />
            </div>
          )}
          <div className={styles.actionButtons}>
            {canAccept && (
              <Button
                type="button"
                disabled={prefMut.isPending}
                onClick={() => prefMut.mutate({ is_ignored: false, is_accepted: true })}
              >
                ZAAKCEPTUJ GRĘ
              </Button>
            )}
            {isAdmin && (
              <Button type="button" variant="secondary" onClick={() => setMergeOpen(true)}>
                POŁĄCZ Z GRĄ
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              disabled={prefMut.isPending}
              onClick={() => prefMut.mutate({ is_ignored: !game.is_ignored })}
            >
              {game.is_ignored ? 'PRZYWRÓĆ DO BIBLIOTEKI' : 'IGNORUJ GRĘ'}
            </Button>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader title="Historia sesji" />
        <SessionList sessions={sessions} />
        {hasNextPage && (
          <div className={styles.loadMore}>
            <Button
              variant="secondary"
              loading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              ZAŁADUJ WIĘCEJ
            </Button>
          </div>
        )}
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