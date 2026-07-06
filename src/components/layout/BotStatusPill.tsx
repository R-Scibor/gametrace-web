import { useHealth } from '../../hooks/useHealth';
import { botColor, formatBotStatus, formatUptime } from '../../lib/bot';
import styles from './BotStatusPill.module.css';

export function BotStatusPill() {
  const { data, isLoading } = useHealth();
  
  if (isLoading || !data) {
    return (
      <div className={styles.pill}>
        <div className={styles.dot} style={{ backgroundColor: 'var(--text3)' }} />
        <span>BOT OFFLINE</span>
      </div>
    );
  }
  
  const status = data.bot.status;
  const color = botColor(status);
  const uptime = formatUptime(data.bot.uptime_seconds);

  return (
    <div className={styles.pill}>
      <div className={styles.dot} style={{ backgroundColor: color }} />
      <span>BOT {formatBotStatus(status)} • {uptime}</span>
    </div>
  );
}
