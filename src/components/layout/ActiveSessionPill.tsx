import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../../hooks/useDashboard';
import { LiveTimer } from '../LiveTimer';
import styles from './ActiveSessionPill.module.css';

export function ActiveSessionPill() {
  const { t } = useTranslation('common');
  const { data } = useDashboard();
  const session = data?.active_session;

  if (!session) return null;

  return (
    <Link to={`/library/${session.game_id}`} className={styles.pill}>
      <span>{t('activeSession', { game: session.game_name })}</span>
      <LiveTimer startIso={session.start_time} />
    </Link>
  );
}