import { useMemo, useState } from 'react';
import { useGamesPaginated } from '../hooks/useGames';
import { SectionHeader, EmptyState, Skeleton, Button } from '../components/ui';
import { GameCard } from '../components/games/GameCard';
import type { EnrichmentStatus } from '../types/api';
import styles from './LibraryPage.module.css';

type LibraryTab = 'all' | 'review';

function LibrarySkeleton() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} height={260} />
      ))}
    </div>
  );
}

export function LibraryPage() {
  const [tab, setTab] = useState<LibraryTab>('all');
  const [query, setQuery] = useState('');
  const status: EnrichmentStatus | undefined = tab === 'review' ? 'NEEDS_REVIEW' : undefined;
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGamesPaginated(status);

  const games = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const totalCount = data?.pages[0]?.total;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter((game) => game.primary_name.toLowerCase().includes(q));
  }, [games, query]);

  const showSearchEmpty = !isLoading && games.length > 0 && filtered.length === 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <SectionHeader title="Biblioteka" style={{ margin: 0 }} />
        <div className={styles.tabs}>
          <button
            type="button"
            className={[styles.tab, tab === 'all' ? styles.tabActive : ''].filter(Boolean).join(' ')}
            onClick={() => setTab('all')}
          >
            Wszystkie
          </button>
          <button
            type="button"
            className={[styles.tab, tab === 'review' ? styles.tabActive : ''].filter(Boolean).join(' ')}
            onClick={() => setTab('review')}
          >
            Do sprawdzenia
          </button>
        </div>
      </div>

      <div className={styles.searchWrap}>
        <span className={styles.searchBar} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.search}
          placeholder="Szukaj gry..."
          aria-label="Szukaj gry"
        />
      </div>

      {isLoading && <LibrarySkeleton />}

      {!isLoading && (isError || !data) && (
        <EmptyState message="Błąd ładowania biblioteki." />
      )}

      {!isLoading && !isError && games.length === 0 && (
        <EmptyState
          message={
            tab === 'review'
              ? 'Brak gier wymagających sprawdzenia.'
              : 'Brak gier w bibliotece. Dodaj nową sesję, aby zacząć śledzić!'
          }
        />
      )}

      {showSearchEmpty && (
        <EmptyState message={`Brak wyników dla „${query.trim()}”.`} />
      )}

      {!isLoading && filtered.length > 0 && (
        <>
          <p className={styles.count}>
            {query.trim()
              ? filtered.length
              : totalCount != null
                ? totalCount
                : filtered.length}
            {!query.trim() && hasNextPage ? '+' : ''} {(query.trim() ? filtered.length : (totalCount ?? filtered.length)) === 1 ? 'gra' : 'gier'}
          </p>
          <div className={styles.grid}>
            {filtered.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
          {!query.trim() && hasNextPage && (
            <div className={styles.loadMore}>
              <Button
                variant="secondary"
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                ZAŁADUJ WIĘCEJ
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}