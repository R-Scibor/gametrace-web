import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ActiveSessionBrief } from '../../types/api';
import { Cover } from '../Cover';
import { LiveTimer } from '../LiveTimer';
import { useFormat } from '../../hooks/useFormat';
import styles from './ActiveSessionCard.module.css';

interface ActiveSessionCardProps {
  session: ActiveSessionBrief;
}

export function ActiveSessionCard({ session }: ActiveSessionCardProps) {
  const { t } = useTranslation('dashboard');
  const { formatTimeShort } = useFormat();

  return (
    <Link to={`/library/${session.game_id}`} className={styles.card}>
      <div className={styles.topBar}>
        <span className={styles.liveDot} />
        <span className={styles.liveLabel}>{t('active.label')}</span>
        <span className={styles.liveBadge}>{t('active.live')}</span>
      </div>
      <div className={styles.row}>
        <div className={styles.coverWrap}>
          <Cover
            gameId={session.game_id}
            coverImageUrl={session.cover_image_url}
            placeholderChar={session.game_name}
            className={styles.cover}
          />
        </div>
        <div className={styles.meta}>
          <span className={styles.name}>{session.game_name}</span>
          <LiveTimer startIso={session.start_time} className={styles.timer} />
          <span className={styles.startedAt}>
            {t('active.startedAt', { time: formatTimeShort(session.start_time) })}
          </span>
        </div>
      </div>
      <div className={styles.footer}>
        <span className={styles.footerAction}>{t('active.details')}</span>
      </div>
    </Link>
  );
}