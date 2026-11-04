import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Session } from '../../types/api';
import { Cover } from '../Cover';
import { EmptyState, Skeleton } from '../ui';
import { useFormat } from '../../hooks/useFormat';
import styles from './RecentSessionsList.module.css';

interface RecentSessionsListProps {
  sessions: Session[];
  loading?: boolean;
  disabled?: boolean;
}

const HexagonIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="12"
    height="12"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);

const PencilIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="11"
    height="11"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

export function RecentSessionsList({ sessions, loading, disabled }: RecentSessionsListProps) {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const { formatDuration, formatSessionWindow } = useFormat();

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
    return <EmptyState message={t('empty')} />;
  }

  return (
    <div className={styles.list}>
      {sessions.map((session) => {
        const isError = session.status === 'ERROR';
        const to = isError ? `/sessions/${session.id}/edit` : `/library/${session.game_id}`;
        const rowClassName = [styles.row, isError ? styles.rowError : ''].filter(Boolean).join(' ');

        const content = (
          <>
            <div className={styles.coverWrap}>
              <Cover
                gameId={session.game.id}
                coverImageUrl={session.game.cover_image_url}
                placeholderChar={session.game.primary_name}
                className={styles.cover}
              />
            </div>
            <div className={styles.body}>
              <div className={styles.meta}>
                <span className={styles.name}>{session.game.primary_name}</span>
                <span className={styles.date}>
                  <span className={styles.sourceIcon} aria-hidden>
                    {session.source === 'BOT' ? <HexagonIcon /> : <PencilIcon />}
                  </span>
                  {formatSessionWindow(session.start_time, session.end_time)}
                </span>
              </div>
              {isError ? (
                <span className={styles.errorBadge}>{tCommon('session.status.ERROR')}</span>
              ) : (
                <span className={styles.duration}>{formatDuration(session.duration_seconds)}</span>
              )}
            </div>
          </>
        );

        if (disabled) {
          return (
            <div key={session.id} className={rowClassName}>
              {content}
            </div>
          );
        }

        return (
          <Link key={session.id} to={to} className={rowClassName}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}