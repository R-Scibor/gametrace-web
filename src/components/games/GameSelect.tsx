import { useGamesAll } from '../../hooks/useGames';
import { Skeleton } from '../ui';
import styles from './GameSelect.module.css';

interface GameSelectProps {
  id?: string;
  value: number | '';
  onChange: (gameId: number) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export function GameSelect({ id, value, onChange, disabled, 'aria-label': ariaLabel }: GameSelectProps) {
  const { data: games, isLoading } = useGamesAll();

  if (isLoading) {
    return <Skeleton height={44} />;
  }

  const sorted = [...(games || [])].sort((a, b) => a.primary_name.localeCompare(b.primary_name));

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={styles.select}
      disabled={disabled}
      required
      aria-label={ariaLabel}
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