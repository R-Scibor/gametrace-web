import { Link } from 'react-router-dom';
import type { Session, SessionStatus } from '../../types/api';
import { useFormat } from '../../hooks/useFormat';
import { EmptyState } from '../ui';
import styles from './SessionList.module.css';

interface SessionListProps {
  sessions: Session[];
}

const STATUS_LABEL: Record<SessionStatus, string | null> = {
  COMPLETED: null,
  ONGOING: 'TRWA',
  ERROR: 'BŁĄD',
};

const SOURCE_LABEL: Record<Session['source'], string> = {
  BOT: '⬡ BOT',
  MANUAL: '✎ RĘCZNA',
};

export function SessionList({ sessions }: SessionListProps) {
  const { formatDuration, formatDateShort, formatTimeShort } = useFormat();

  if (sessions.length === 0) {
    return <EmptyState message="Brak historii sesji dla tej gry." />;
  }

  return (
    <div className={styles.table}>
      <div className={styles.header}>
        <span>Data</span>
        <span>Godzina</span>
        <span>Czas</span>
        <span>Status</span>
        <span>Źródło</span>
      </div>
      {sessions.map((session) => {
        const statusLabel = STATUS_LABEL[session.status];
        const isError = session.status === 'ERROR';
        return (
          <Link
            key={session.id}
            to={`/sessions/${session.id}/edit`}
            className={[styles.row, isError ? styles.rowError : ''].filter(Boolean).join(' ')}
          >
            <span className={styles.date}>{formatDateShort(session.start_time)}</span>
            <span className={styles.time}>{formatTimeShort(session.start_time)}</span>
            <span className={styles.duration}>
              {session.duration_seconds ? formatDuration(session.duration_seconds) : '—'}
            </span>
            <span className={styles.statusCell}>
              {statusLabel ? (
                <span
                  className={[
                    styles.status,
                    session.status === 'ERROR' ? styles.statusError : '',
                    session.status === 'ONGOING' ? styles.statusOngoing : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {statusLabel}
                </span>
              ) : (
                <span className={styles.statusMuted}>—</span>
              )}
            </span>
            <span className={styles.source} title={session.source === 'BOT' ? 'Bot Discord' : 'Ręczna'}>
              {SOURCE_LABEL[session.source]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}