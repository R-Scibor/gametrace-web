import { Link } from 'react-router-dom';
import type { ActiveSessionBrief } from '../../types/api';
import { Cover } from '../Cover';
import { LiveTimer } from '../LiveTimer';
import { useFormat } from '../../hooks/useFormat';
import styles from './ActiveSessionCard.module.css';

interface ActiveSessionCardProps {
  session: ActiveSessionBrief;
}

export function ActiveSessionCard({ session }: ActiveSessionCardProps) {
  const { formatTimeShort } = useFormat();

  return (
    <Link to={`/library/${session.game_id}`} className={styles.card}>
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
          <div className={styles.liveRow}>
            <span className={styles.liveDot} />
            <span className={styles.liveLabel}>AKTYWNA SESJA</span>
          </div>
          <span className={styles.name}>{session.game_name}</span>
          <LiveTimer startIso={session.start_time} className={styles.timer} />
          <span className={styles.startedAt}>od {formatTimeShort(session.start_time)}</span>
        </div>
      </div>
      <div className={styles.footer}>
        <span className={styles.footerLabel}>⬡ WYKRYTO PRZEZ BOTA</span>
        <span className={styles.footerAction}>szczegóły →</span>
      </div>
    </Link>
  );
}