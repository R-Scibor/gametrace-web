import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ActiveSessionBrief, GameStats } from '../../types/api';
import { Cover } from '../Cover';
import { LiveTimer } from '../LiveTimer';
import { useFormat } from '../../hooks/useFormat';
import { EMPTY_VALUE } from '../../lib/format';
import styles from './ActiveSessionCard.module.css';

interface ActiveSessionCardProps {
  session: ActiveSessionBrief;
  stats?: GameStats | null;
}

export function ActiveSessionCard({ session, stats }: ActiveSessionCardProps) {
  const { t } = useTranslation('dashboard');
  const { formatHours, formatTimeShort } = useFormat();
  const avgSeconds =
    stats && stats.session_count > 0 ? stats.total_seconds / stats.session_count : null;
  const sessionCount = stats ? String(stats.session_count) : EMPTY_VALUE;
  const avg = avgSeconds != null ? `${formatHours(avgSeconds)}h` : EMPTY_VALUE;

  return (
    <Link to={`/library/${session.game_id}`} className={styles.card}>
      <div className={styles.coverWrap}>
        <Cover
          gameId={session.game_id}
          coverImageUrl={session.cover_image_url}
          placeholderChar={session.game_name}
          className={styles.cover}
        />
      </div>
      <div className={styles.body}>
        <div className={styles.identity}>
          <div className={styles.head}>
            <span className={styles.name}>{session.game_name}</span>
            <span className={styles.mark}>
              <span className={styles.liveDot} />
              {t('active.label')}
            </span>
          </div>
          <LiveTimer startIso={session.start_time} className={styles.timer} />
          <span className={styles.leadNote}>
            {t('active.startedAt', { time: formatTimeShort(session.start_time) })}
          </span>
          <span className={styles.details}>{t('active.details')}</span>
        </div>
        <dl className={styles.block}>
          <div>
            <dt>{t('hero.sessions')}</dt>
            <dd>{sessionCount}</dd>
          </div>
          <div>
            <dt>{t('hero.avgSession')}</dt>
            <dd>{avg}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}