import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ConflictResponse } from '../types/api';
import { Cover } from './Cover';
import { useFormat } from '../hooks/useFormat';
import styles from './ConflictNotice.module.css';

interface ConflictNoticeProps {
  conflict: ConflictResponse;
}

export function ConflictNotice({ conflict }: ConflictNoticeProps) {
  const { t } = useTranslation('common');
  const { formatDate } = useFormat();
  const session = conflict.conflicting_session;
  const range =
    session.end_time
      ? `${formatDate(session.start_time)} – ${formatDate(session.end_time)}`
      : formatDate(session.start_time);

  return (
    <div className={styles.notice} role="alert">
      <h3 className={styles.heading}>{t('conflict.heading')}</h3>
      <p className={styles.message}>{conflict.detail}</p>
      <Link to={`/sessions/${session.id}/edit`} className={styles.row}>
        <Cover
          gameId={session.game.id}
          coverImageUrl={session.game.cover_image_url}
          placeholderChar={session.game.primary_name}
          className={styles.cover}
        />
        <div className={styles.meta}>
          <span className={styles.gameName}>{session.game.primary_name}</span>
          <span className={styles.timeRange}>{range}</span>
        </div>
        <span className={styles.action}>{t('conflict.edit')}</span>
      </Link>
    </div>
  );
}
