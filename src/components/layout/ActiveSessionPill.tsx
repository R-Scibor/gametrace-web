import { Link } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import { LiveTimer } from '../LiveTimer';
import styles from './ActiveSessionPill.module.css';

export function ActiveSessionPill() {
  const { data } = useDashboard();
  const session = data?.active_session;

  if (!session) return null;

  return (
    <Link to={`/library/${session.game_id}`} className={styles.pill}>
      <span>AKTYWNA SESJA: {session.game_name}</span>
      <LiveTimer startIso={session.start_time} />
    </Link>
  );
}