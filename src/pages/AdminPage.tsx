import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminGameOpsPanel } from '../components/admin/AdminGameOpsPanel';
import { Cover } from '../components/Cover';
import { SectionHeader, Button, Skeleton } from '../components/ui';
import { useGame, useGameSearch } from '../hooks/useGames';
import type { Game } from '../types/api';
import styles from './AdminPage.module.css';

const STATUS_LABELS: Record<Game['enrichment_status'], string> = {
  ENRICHED: 'Wzbogacona',
  NEEDS_REVIEW: 'Do sprawdzenia',
  PENDING: 'Oczekuje',
};

export function AdminPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedFromSearch, setSelectedFromSearch] = useState<Game | null>(null);
  const [idInput, setIdInput] = useState('');
  const [idLookup, setIdLookup] = useState<number | null>(null);

  const { data: searchResults = [], isLoading: searchLoading } = useGameSearch(debouncedQuery);
  const {
    data: lookedUpGame,
    isLoading: lookupLoading,
    isFetched: lookupFetched,
  } = useGame(idLookup ?? 0);

  const selectedGame = useMemo(
    () => (idLookup !== null ? (lookedUpGame ?? null) : selectedFromSearch),
    [idLookup, lookedUpGame, selectedFromSearch],
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleIdLookup = () => {
    const parsed = Number(idInput.trim());
    if (!parsed || parsed < 1) return;
    setSelectedFromSearch(null);
    setIdLookup(parsed);
  };

  const showIdError = idLookup !== null && lookupFetched && !lookupLoading && !lookedUpGame;

  return (
    <div className={styles.container}>
      <p className={styles.intro}>Operacje globalne na katalogu gier.</p>

      <div className={styles.panel}>
        <SectionHeader title="Wybierz grę" />
        <div className={styles.pickerRow}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj gry..."
            className={styles.search}
            aria-label="Szukaj gry"
          />
          <div className={styles.idLookup}>
            <span className={styles.idLabel}>ID</span>
            <input
              type="text"
              inputMode="numeric"
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              className={styles.idInput}
              aria-label="ID gry"
            />
            <Button type="button" variant="secondary" onClick={handleIdLookup}>
              SZUKAJ
            </Button>
          </div>
        </div>

        {showIdError && <p className={styles.error}>Nie znaleziono gry.</p>}

        <ul className={styles.list}>
          {searchLoading && (
            <li>
              <Skeleton height={40} />
            </li>
          )}
          {!searchLoading &&
            searchResults.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  className={[
                    styles.listItem,
                    selectedGame?.id === g.id ? styles.listItemActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    setIdLookup(null);
                    setSelectedFromSearch(g);
                  }}
                >
                  <span>{g.primary_name}</span>
                  <span className={styles.status}>{g.enrichment_status}</span>
                </button>
              </li>
            ))}
          {!searchLoading && debouncedQuery && searchResults.length === 0 && (
            <li>
              <p className={styles.empty}>Brak pasujących gier</p>
            </li>
          )}
        </ul>
      </div>

      {idLookup !== null && lookupLoading && (
        <div className={styles.panel}>
          <Skeleton height={120} />
        </div>
      )}

      {selectedGame && (
        <div className={styles.panel}>
          <SectionHeader title="Operacje" />
          <div className={styles.selectedCard}>
            <div className={styles.cover}>
              <Cover
                gameId={selectedGame.id}
                coverImageUrl={selectedGame.cover_image_url}
                placeholderChar={selectedGame.primary_name}
              />
            </div>
            <div className={styles.selectedInfo}>
              <h2 className={styles.selectedName}>{selectedGame.primary_name}</h2>
              <p className={styles.meta}>
                ID: {selectedGame.id} · {STATUS_LABELS[selectedGame.enrichment_status]} ·{' '}
                {selectedGame.cover_source}
              </p>
              <Link to={`/library/${selectedGame.id}`} className={styles.libraryLink}>
                Otwórz w bibliotece →
              </Link>
            </div>
          </div>
          <AdminGameOpsPanel
            gameId={selectedGame.id}
            gameName={selectedGame.primary_name}
            coverUrl={selectedGame.cover_image_url}
            coverSource={selectedGame.cover_source}
          />
        </div>
      )}
    </div>
  );
}