import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ConflictResponse } from '../types/api';
import { Cover } from './Cover';
import { useFormat } from '../hooks/useFormat';
import styles from './ConflictNotice.module.css';

interface ConflictNoticeProps {
  conflict: ConflictResponse;
  kind: 'overlap' | 'writer';
}

export function ConflictNotice({ conflict, kind }: ConflictNoticeProps) {
  const { t } = useTranslation('common');
  const { formatDate } = useFormat();
  const session = conflict.conflicting_session;
  const trashed = session.deleted_at != null;
  const ongoing = session.status === 'ONGOING';

  if (kind === 'writer' && trashed) {
    return (
      <div className={styles.notice} role="alert">
        <h3 className={styles.heading}>{t('conflict.writerHeading')}</h3>
        <p className={styles.message}>{t('conflict.writerTrashed')}</p>
      </div>
    );
  }

  if (kind === 'writer' && !ongoing) {
    return (
      <div className={styles.notice} role="alert">
        <h3 className={styles.heading}>{t('conflict.writerHeading')}</h3>
        <p className={styles.message}>{t('conflict.writerMessage')}</p>
      </div>
    );
  }

  const href = ongoing ? `/library/${session.game.id}` : `/sessions/${session.id}/edit`;
  const action = ongoing ? t('conflict.viewGame') : t('conflict.edit');

  const range =
    session.end_time
      ? `${formatDate(session.start_time)} – ${formatDate(session.end_time)}`
      : formatDate(session.start_time);

  return (
    <div className={styles.notice} role="alert">
      <h3 className={styles.heading}>
        {kind === 'writer' ? t('conflict.writerHeading') : t('conflict.heading')}
      </h3>
      {kind === 'overlap' && <p className={styles.message}>{t('conflict.message')}</p>}
      {ongoing && <p className={styles.message}>{t('conflict.ongoing')}</p>}
      <Link to={href} className={styles.row}>
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
        <span className={styles.action}>{action}</span>
      </Link>
    </div>
  );
}
