import { Link } from 'react-router-dom';
import type { GameStats, Session } from '../../types/api';
import { Cover } from '../Cover';
import { useFormat } from '../../hooks/useFormat';
import styles from './HeroSpotlight.module.css';

interface HeroSpotlightProps {
  session: Session;
  stats: GameStats | null | undefined;
}

export function HeroSpotlight({ session, stats }: HeroSpotlightProps) {
  const { formatHours, formatRecency } = useFormat();

  const avgSeconds =
    stats && stats.session_count > 0 ? stats.total_seconds / stats.session_count : null;

  return (
    <Link to={`/library/${session.game_id}`} className={styles.card}>
      <div className={styles.row}>
        <div className={styles.coverWrap}>
          <Cover
            gameId={session.game_id}
            coverImageUrl={session.game.cover_image_url}
            placeholderChar={session.game.primary_name}
            className={styles.cover}
          />
        </div>
        <div className={styles.meta}>
          <span className={styles.name}>{session.game.primary_name}</span>
          <span className={styles.recency}>
            {formatRecency(session.end_time ?? session.start_time)}
          </span>
          <div className={styles.bottom}>
            <div>
              <span className={styles.statLabel}>ŁĄCZNIE</span>
              <div className={styles.bigRow}>
                <span className={styles.big}>{stats ? formatHours(stats.total_seconds) : '—'}</span>
                <span className={styles.bigUnit}>h</span>
              </div>
            </div>
            <div className={styles.sideStats}>
              <div>
                <span className={styles.statLabel}>SESJE</span>
                <span className={styles.statValue}>{stats ? stats.session_count : '—'}</span>
              </div>
              <div>
                <span className={styles.statLabel}>ŚR. SESJA</span>
                <span className={styles.statValue}>
                  {avgSeconds != null ? `${formatHours(avgSeconds)}h` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}