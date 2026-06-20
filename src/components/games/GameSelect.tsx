import { useGamesAll } from '../../hooks/useGames';
import { Skeleton } from '../ui';
import styles from './GameSelect.module.css';

interface GameSelectProps {
  value: number | '';
  onChange: (gameId: number) => void;
  disabled?: boolean;
}

export function GameSelect({ value, onChange, disabled }: GameSelectProps) {
  const { data: games, isLoading } = useGamesAll();

  if (isLoading) {
    return <Skeleton height={44} />;
  }

  const sorted = [...(games || [])].sort((a, b) => a.primary_name.localeCompare(b.primary_name));

  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={styles.select}
      disabled={disabled}
      required
    >
      <option value="" disabled>
        Wybierz grę...
      </option>
      {sorted.map((g) => (
        <option key={g.id} value={g.id}>
          {g.primary_name}
        </option>
      ))}
    </select>
  );
}