import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { GameStats, Session } from '../../types/api';
import { Cover } from '../Cover';
import { useFormat } from '../../hooks/useFormat';
import { EMPTY_VALUE } from '../../lib/format';
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
  const total = stats ? formatHours(stats.total_seconds) : EMPTY_VALUE;
  const sessionCount = stats ? String(stats.session_count) : EMPTY_VALUE;
  const avg = avgSeconds != null ? `${formatHours(avgSeconds)}h` : EMPTY_VALUE;
  const recency = formatRecency(session.end_time ?? session.start_time);

  const body = (
    <>
      <div className={styles.coverWrap}>
        <Cover
          gameId={session.game_id}
          coverImageUrl={session.game.cover_image_url}
          placeholderChar={session.game.primary_name}
          className={styles.cover}
        />
      </div>
      <div className={styles.body}>
        <div className={styles.identity}>
          <div className={styles.head}>
            <span className={styles.name}>{session.game.primary_name}</span>
            <span className={styles.mark}>{recency}</span>
          </div>
          <span
            className={[styles.hours, !stats && styles.hoursEmpty]
              .filter(Boolean)
              .join(' ')}
          >
            {stats ? `${total}h` : total}
          </span>
          <span className={styles.leadNote}>{t('hero.total')}</span>
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
