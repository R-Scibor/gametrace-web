import { useMemo, useState } from 'react';
import { Link, useLocation, useParams, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGame, useUpdateGamePreference } from '../hooks/useGames';
import { useGameSessions } from '../hooks/useGameSessions';
import { useGameStats } from '../hooks/useGameStats';
import { formatDuration, formatDateShort, formatRecency } from '../lib/format';
import { Cover } from '../components/Cover';
import { AdminGlobalCoverUpload } from '../components/admin/AdminGlobalCoverUpload';
import { CoverUpload } from '../components/library/CoverUpload';
import { MergeDialog } from '../components/library/MergeDialog';
import { SectionHeader, Skeleton, Button } from '../components/ui';
import { SessionList } from '../components/games/SessionList';
import type { Game } from '../types/api';
import styles from './GameDetailPage.module.css';

function GameDetailSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <Skeleton height={224} width={168} />
          <div className={styles.info} style={{ flex: 1 }}>
            <Skeleton height={14} width={140} />
            <Skeleton height={40} width="55%" style={{ marginTop: 10 }} />
            <div className={styles.metrics} style={{ marginTop: 18 }}>
              <Skeleton height={44} width={70} />
              <Skeleton height={44} width={70} />
              <Skeleton height={44} width={70} />
            </div>
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
  const lastPlayed = stats?.last_played ?? game.last_played ?? null;

  const metrics = [
    { label: 'SESJE', value: String(sessionCount) },
    { label: 'ŁĄCZNIE', value: formatDuration(totalSeconds) },
    { label: 'ŚREDNIO', value: sessionCount ? formatDuration(avgSeconds) : '—' },
    { label: 'PIERWSZY RAZ', value: stats?.first_played ? formatDateShort(stats.first_played) : '—' },
    { label: 'OSTATNIO', value: lastPlayed ? formatDateShort(lastPlayed) : '—' },
  ];

  return (
    <div className={styles.container}>
      <Link to="/library" className={styles.backLink}>
        ← Biblioteka
      </Link>

      <section className={styles.hero}>
        {game.cover_image_url && (
          <div
            className={styles.backdrop}
            style={{ backgroundImage: `url(${game.cover_image_url})` }}
            aria-hidden
          />
        )}
        <div className={styles.heroScrim} aria-hidden />
        <div className={styles.heroContent}>
          <div className={styles.coverWrapper}>
            <Cover
              gameId={id}
              coverImageUrl={game.cover_image_url}
              placeholderChar={game.primary_name}
              className={styles.cover}
            />
          </div>
          <div className={styles.info}>
            <span className={styles.eyebrow}>
              {lastPlayed ? `OSTATNIO GRANE · ${formatRecency(lastPlayed)}` : 'W BIBLIOTECE'}
            </span>
            <h1 className={styles.title}>{game.primary_name}</h1>
            {(canAccept || game.is_ignored) && (
              <div className={styles.badges}>
                {canAccept && <span className={styles.reviewBadge}>DO SPRAWDZENIA</span>}
                {game.is_ignored && <span className={styles.ignoredBadge}>IGNOROWANA</span>}
              </div>
            )}
            <div className={styles.metrics}>
              {metrics.map((m) => (
                <div key={m.label} className={styles.metric}>
                  <span className={styles.metricValue}>{m.value}</span>
                  <span className={styles.metricLabel}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className={styles.actionsPanel}>
        <SectionHeader title="Akcje" />
        <div className={styles.actionsGrid}>
          <div className={styles.coverSection}>
            <p className={styles.coverSectionLabel}>Okładka lokalna</p>
            <CoverUpload gameId={id} coverUrl={game.cover_image_url} gameName={game.primary_name} />
          </div>
          <div className={styles.coverSection}>
            <p className={styles.coverSectionLabel}>Okładka globalna</p>
            {isAdmin ? (
              <AdminGlobalCoverUpload
                gameId={id}
                gameName={game.primary_name}
                coverUrl={game.cover_image_url}
                coverSource={game.cover_source}
              />
            ) : (
              <div className={styles.readonlyPreview}>
                <Cover
                  coverImageUrl={game.cover_image_url}
                  placeholderChar={game.primary_name}
                  className={styles.cover}
                />
              </div>
            )}
          </div>
          <div className={styles.actionButtons}>
            <p className={styles.coverSectionLabel}>Zarządzanie</p>
            {canAccept && (
              <div className={styles.actionItem}>
                <Button
                  type="button"
                  disabled={prefMut.isPending}
                  onClick={() => prefMut.mutate({ is_ignored: false, is_accepted: true })}
                >
                  ZAAKCEPTUJ GRĘ
                </Button>
                <p className={styles.actionHint}>Dodaj rozpoznaną grę do biblioteki i statystyk.</p>
              </div>
            )}
            {isAdmin && (
              <div className={styles.actionItem}>
                <Button type="button" variant="secondary" onClick={() => setMergeOpen(true)}>
                  POŁĄCZ Z GRĄ
                </Button>
                <p className={styles.actionHint}>
                  Scal duplikat z inną grą — sesje i statystyki trafią do wybranego tytułu.
                </p>
              </div>
            )}
            <div className={styles.actionItem}>
              <Button
                type="button"
                variant="secondary"
                disabled={prefMut.isPending}
                onClick={() => prefMut.mutate({ is_ignored: !game.is_ignored })}
              >
                {game.is_ignored ? 'PRZYWRÓĆ DO BIBLIOTEKI' : 'IGNORUJ GRĘ'}
              </Button>
              <p className={styles.actionHint}>
                {game.is_ignored
                  ? 'Przywróć grę do biblioteki i wliczaj ją do statystyk.'
                  : 'Ukryj grę w bibliotece i pomiń ją w statystykach.'}
              </p>
            </div>
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