import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { GameStatEntry } from '../../types/api';
import { formatDuration } from '../../lib/format';
import { intlLocale } from '../../i18n/resolve';
import styles from './GameRankingTable.module.css';

type SortKey = 'name' | 'time';
type SortDir = 'asc' | 'desc';

interface GameRankingTableProps {
  games: GameStatEntry[];
  disabled?: boolean;
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return null;
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginLeft: 5, verticalAlign: 'middle', display: 'inline-block' }}
      aria-hidden
    >
      {dir === 'asc' ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
    </svg>
  );
}

export function GameRankingTable({ games, disabled }: GameRankingTableProps) {
  const { t, i18n } = useTranslation('analytics');
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const max = Math.max(...games.map((g) => g.total_seconds), 1);

  const sorted = useMemo(() => {
    const collator = new Intl.Collator(intlLocale(i18n.language));
    const copy = [...games];
    copy.sort((a, b) => {
      const cmp =
        sortKey === 'time'
          ? a.total_seconds - b.total_seconds
          : collator.compare(a.game_name, b.game_name);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [games, sortKey, sortDir, i18n.language]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'time' ? 'desc' : 'asc');
    }
  };

  if (games.length === 0) {
    return <p className={styles.empty}>{t('ranking.empty')}</p>;
  }

  return (
    <div className={styles.table}>
      <div className={styles.header} role="row">
        <button
          type="button"
          className={styles.th}
          onClick={() => toggleSort('name')}
          aria-sort={sortKey === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          {t('ranking.game')}
          <SortIndicator active={sortKey === 'name'} dir={sortDir} />
        </button>
        <button
          type="button"
          className={styles.th}
          onClick={() => toggleSort('time')}
          aria-sort={sortKey === 'time' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          {t('ranking.time')}
          <SortIndicator active={sortKey === 'time'} dir={sortDir} />
        </button>
      </div>
      {sorted.map((game) => {
        const ratio = game.total_seconds / max;
        const content = (
          <>
            <span className={styles.name}>{game.game_name}</span>
            <div className={styles.timeCell}>
              <div className={styles.track}>
                <div
                  className={styles.fill}
                  style={{ width: `${Math.max(ratio * 100, 1)}%` }}
                />
              </div>
              <span className={styles.time}>{formatDuration(game.total_seconds)}</span>
            </div>
          </>
        );

        if (disabled) {
          return (
            <div key={game.game_id} className={styles.row}>
              {content}
            </div>
          );
        }

        return (
          <Link key={game.game_id} to={`/library/${game.game_id}`} className={styles.row}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
