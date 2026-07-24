import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Session } from '../../types/api';
import { SESSION_SOURCE_LABEL, SESSION_STATUS_LABEL } from '../../lib/sessionLabels';
import { useFormat } from '../../hooks/useFormat';
import { EmptyState } from '../ui';
import styles from './SessionList.module.css';

interface SessionListProps {
  sessions: Session[];
}

export function SessionList({ sessions }: SessionListProps) {
  const { t } = useTranslation('gameDetail');
  const { formatDuration, formatDateShort, formatTimeShort } = useFormat();

  if (sessions.length === 0) {
    return <EmptyState message={t('history.empty')} />;
  }

  return (
    <div className={styles.table}>
      <div className={styles.header}>
        <span>{t('history.colDate')}</span>
        <span>{t('history.colTime')}</span>
        <span>{t('history.colDuration')}</span>
        <span>{t('history.colStatus')}</span>
        <span>{t('history.colSource')}</span>
      </div>
      {sessions.map((session) => {
        const statusLabel = SESSION_STATUS_LABEL[session.status];
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
            <span
              className={styles.source}
              title={
                session.source === 'BOT' ? t('history.sourceBot') : t('history.sourceManual')
              }
            >
              {SESSION_SOURCE_LABEL[session.source]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
