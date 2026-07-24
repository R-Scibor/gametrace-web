import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GameStatEntry } from '../../types/api';
import { formatDuration } from '../../lib/format';
import styles from './GameRankingTable.module.css';

type SortKey = 'name' | 'time';
type SortDir = 'asc' | 'desc';

interface GameRankingTableProps {
  games: GameStatEntry[];
  disabled?: boolean;
}

function sortIndicator(active: boolean, dir: SortDir): string {
  if (!active) return '';
  return dir === 'asc' ? ' ↑' : ' ↓';
}

export function GameRankingTable({ games, disabled }: GameRankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const max = Math.max(...games.map((g) => g.total_seconds), 1);

  const sorted = useMemo(() => {
    const copy = [...games];
    copy.sort((a, b) => {
      const cmp =
        sortKey === 'time'
          ? a.total_seconds - b.total_seconds
          : a.game_name.localeCompare(b.game_name, 'pl');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [games, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'time' ? 'desc' : 'asc');
    }
  };

  if (games.length === 0) {
    return <p className={styles.empty}>Brak danych.</p>;
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
          Gra{sortIndicator(sortKey === 'name', sortDir)}
        </button>
        <button
          type="button"
          className={styles.th}
          onClick={() => toggleSort('time')}
          aria-sort={sortKey === 'time' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          Czas{sortIndicator(sortKey === 'time', sortDir)}
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