import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Game } from '../../types/api';
import { useGamesPicker } from '../../hooks/useGames';
import { Skeleton } from '../ui';
import styles from './GameSelect.module.css';

interface GameSelectProps {
  id?: string;
  value: number | '';
  onChange: (gameId: number) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

const MAX_RESULTS = 50;

export function GameSelect({ id, value, onChange, disabled, 'aria-label': ariaLabel }: GameSelectProps) {
  const { data: games, isLoading } = useGamesPicker();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = id ? `${id}-listbox` : undefined;

  const list = games ?? [];
  const selected = value === '' ? null : list.find((g) => g.id === value) ?? null;

  const filtered = useMemo(() => {
    const all = games ?? [];
    const q = query.trim().toLowerCase();
    const base = q ? all.filter((g) => g.primary_name.toLowerCase().includes(q)) : all;
    return base.slice(0, MAX_RESULTS);
  }, [games, query]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  if (isLoading) return <Skeleton height={46} />;

  const choose = (game: Game) => {
    onChange(game.id);
    setQuery('');
    setOpen(false);
    setEditing(false);
  };

  const startEditing = () => {
    setEditing(true);
    setQuery('');
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered[activeIndex]) {
        e.preventDefault();
        choose(filtered[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setEditing(false);
    }
  };

  if (selected && !editing) {
    return (
      <div className={styles.root} ref={rootRef}>
        <button
          type="button"
          id={id}
          className={styles.chip}
          onClick={startEditing}
          disabled={disabled}
          aria-label={ariaLabel ?? 'Wybrana gra — zmień'}
        >
          <span className={styles.chipRule} aria-hidden />
          <span className={styles.chipName}>{selected.primary_name}</span>
          <span className={styles.chipAction}>zmień</span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        className={styles.input}
        placeholder="Szukaj gry..."
        value={query}
        disabled={disabled}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul className={styles.dropdown} id={listId} role="listbox">
          {filtered.length === 0 ? (
            <li className={styles.empty}>Brak wyników</li>
          ) : (
            filtered.map((game, i) => (
              <li
                key={game.id}
                role="option"
                aria-selected={i === activeIndex}
                className={[styles.option, i === activeIndex ? styles.optionActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(game);
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {game.primary_name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
