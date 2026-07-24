import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { GameStats, Session } from '../../types/api';
import { Cover } from '../Cover';
import { useFormat } from '../../hooks/useFormat';
import styles from './HeroSpotlight.module.css';

interface HeroSpotlightProps {
  session: Session;
  stats: GameStats | null | undefined;
  disabled?: boolean;
}

export function HeroSpotlight({ session, stats, disabled }: HeroSpotlightProps) {
  const { t } = useTranslation('dashboard');
  const { formatHours, formatRecency } = useFormat();

  const avgSeconds =
    stats && stats.session_count > 0 ? stats.total_seconds / stats.session_count : null;

  const body = (
    <>
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
          <span className={styles.eyebrow}>{t('hero.lastPlayed')}</span>
          <span className={styles.name}>{session.game.primary_name}</span>
          <span className={styles.recency}>
            {formatRecency(session.end_time ?? session.start_time)}
          </span>
          <div className={styles.bottom}>
            <div>
              <span className={styles.statLabel}>{t('hero.total')}</span>
              <div className={styles.bigRow}>
                <span className={styles.big}>{stats ? formatHours(stats.total_seconds) : '—'}</span>
                <span className={styles.bigUnit}>h</span>
              </div>
            </div>
            <div className={styles.sideStats}>
              <div>
                <span className={styles.statLabel}>{t('hero.sessions')}</span>
                <span className={styles.statValue}>{stats ? stats.session_count : '—'}</span>
              </div>
              <div>
                <span className={styles.statLabel}>{t('hero.avgSession')}</span>
                <span className={styles.statValue}>
                  {avgSeconds != null ? `${formatHours(avgSeconds)}h` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (disabled) {
    return <div className={styles.card}>{body}</div>;
  }

  return (
    <Link to={`/library/${session.game_id}`} className={styles.card}>
      {body}
    </Link>
  );
}