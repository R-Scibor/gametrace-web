import { useMemo, useState } from 'react';
import { Link, useLocation, useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGame, useUpdateGamePreference } from '../hooks/useGames';
import { useGameSessions } from '../hooks/useGameSessions';
import { useGameStats } from '../hooks/useGameStats';
import { formatDuration, formatDateShort, formatRecency } from '../lib/format';
import { Cover } from '../components/Cover';
import { GameActionsMenu } from '../components/games/GameActionsMenu';
import { CoverDialog } from '../components/games/CoverDialog';
import { ReportDuplicateDialog } from '../components/games/ReportDuplicateDialog';
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
  const { t } = useTranslation('gameDetail');
  const { gameId } = useParams();
  const id = Number(gameId);
  const location = useLocation();
  const gameFromNav = (location.state as { game?: Game } | null)?.game;

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
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const sessions = useMemo(() => sessionPages?.pages.flat() ?? [], [sessionPages]);

  if (gameLoading || statsLoading || sessionsLoading) return <GameDetailSkeleton />;
  if (!game) return <Navigate to="/library" replace />;

  const sessionCount = stats?.session_count ?? 0;
  const totalSeconds = stats?.total_seconds ?? 0;
  const avgSeconds = sessionCount ? Math.round(totalSeconds / sessionCount) : 0;
  const canAccept = game.enrichment_status === 'NEEDS_REVIEW' && game.is_accepted !== true;
  const lastPlayed = stats?.last_played ?? game.last_played ?? null;

  const metrics = [
    { label: t('metrics.sessions'), value: String(sessionCount) },
    { label: t('metrics.total'), value: formatDuration(totalSeconds) },
    { label: t('metrics.avg'), value: sessionCount ? formatDuration(avgSeconds) : '—' },
    {
      label: t('metrics.firstPlayed'),
      value: stats?.first_played ? formatDateShort(stats.first_played) : '—',
    },
    { label: t('metrics.lastPlayed'), value: lastPlayed ? formatDateShort(lastPlayed) : '—' },
  ];

  return (
    <div className={styles.container}>
      <Link to="/library" className={styles.backLink}>
        {t('back')}
      </Link>

      <section className={styles.hero}>
        <div className={styles.backdropWrapper} aria-hidden>
          {game.cover_image_url && (
            <div
              className={styles.backdrop}
              style={{ backgroundImage: `url(${game.cover_image_url})` }}
            />
          )}
          <div className={styles.heroScrim} />
        </div>

        <GameActionsMenu
          game={game}
          canAccept={canAccept}
          onOpenCoverDialog={() => setCoverDialogOpen(true)}
          onOpenReportDuplicate={() => setReportOpen(true)}
          prefMut={prefMut}
        />

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
              {lastPlayed
                ? t('eyebrow.lastPlayed', { recency: formatRecency(lastPlayed) })
                : t('eyebrow.inLibrary')}
            </span>
            <h1 className={styles.title}>{game.primary_name}</h1>
            {(canAccept || game.is_ignored) && (
              <div className={styles.badges}>
                {canAccept && <span className={styles.reviewBadge}>{t('badges.needsReview')}</span>}
                {game.is_ignored && <span className={styles.ignoredBadge}>{t('badges.ignored')}</span>}
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

      <div>
        <SectionHeader title={t('history.title')} />
        <SessionList sessions={sessions} />
        {hasNextPage && (
          <div className={styles.loadMore}>
            <Button
              variant="secondary"
              loading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              {t('history.loadMore')}
            </Button>
          </div>
        )}
      </div>

      <CoverDialog
        game={game}
        open={coverDialogOpen}
        onClose={() => setCoverDialogOpen(false)}
      />
      <ReportDuplicateDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        source={{ id: game.id, name: game.primary_name }}
      />
    </div>
  );
}
