import { Link } from 'react-router-dom';
import type { Session } from '../../types/api';
import { Cover } from '../Cover';
import { EmptyState, Skeleton } from '../ui';
import { useFormat } from '../../hooks/useFormat';
import styles from './RecentSessionsList.module.css';

interface RecentSessionsListProps {
  sessions: Session[];
  loading?: boolean;
}

export function RecentSessionsList({ sessions, loading }: RecentSessionsListProps) {
  const { formatDuration, formatDateShort } = useFormat();

  if (loading) {
    return (
      <div className={styles.list}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={60} />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return <EmptyState message="Brak sesji do wyświetlenia" />;
  }

  return (
    <div className={styles.list}>
      {sessions.map((session) => {
        const isError = session.status === 'ERROR';
        const to = isError ? `/sessions/${session.id}/edit` : `/library/${session.game_id}`;

        return (
          <Link
            key={session.id}
            to={to}
            className={[styles.row, isError ? styles.rowError : ''].filter(Boolean).join(' ')}
          >
            <Cover
              coverImageUrl={session.game.cover_image_url}
              placeholderChar={session.game.primary_name}
              className={styles.cover}
            />
            <div className={styles.meta}>
              <span className={styles.name}>{session.game.primary_name}</span>
              <span className={styles.date}>
                {session.source === 'BOT' ? '⬡' : '✎'} {formatDateShort(session.start_time)}
              </span>
            </div>
            {isError ? (
              <span className={styles.errorBadge}>BŁĄD</span>
            ) : (
              <span className={styles.duration}>{formatDuration(session.duration_seconds)}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}