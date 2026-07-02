import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGamesPaginated } from '../hooks/useGames';
import { SectionHeader, EmptyState, Skeleton, Button } from '../components/ui';
import { GameCard } from '../components/games/GameCard';
import { useGamesStore } from '../store/gamesStore';
import type { EnrichmentStatus } from '../types/api';
import styles from './LibraryPage.module.css';

type LibraryTab = 'all' | 'review' | 'other';

function LibrarySkeleton() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} height={260} />
      ))}
    </div>
  );
}

function tabToFilter(tab: LibraryTab, q?: string) {
  if (tab === 'review') return { status: 'NEEDS_REVIEW' as EnrichmentStatus, q };
  if (tab === 'other') return { inLibrary: false, q };
  return { q };
}

export function LibraryPage() {
  const [tab, setTab] = useState<LibraryTab>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const queryClient = useQueryClient();
  const gamesStale = useGamesStore((s) => s.stale);
  const markFresh = useGamesStore((s) => s.markFresh);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!gamesStale) return;
    void queryClient.invalidateQueries({ queryKey: ['games'] });
    markFresh();
  }, [gamesStale, markFresh, queryClient]);

  const filter = useMemo(() => tabToFilter(tab, debouncedQuery || undefined), [tab, debouncedQuery]);
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGamesPaginated(filter);

  const games = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const totalCount = data?.pages[0]?.total;

  const emptyMessage =
    tab === 'review'
      ? 'Brak gier wymagających sprawdzenia.'
      : tab === 'other'
        ? 'Brak gier poza biblioteką.'
        : debouncedQuery
          ? `Brak wyników dla „${debouncedQuery}".`
          : 'Brak gier w bibliotece. Dodaj nową sesję, aby zacząć śledzić!';

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
          <button
            type="button"
            className={[styles.tab, tab === 'other' ? styles.tabActive : ''].filter(Boolean).join(' ')}
            onClick={() => setTab('other')}
          >
            Inne
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
        <EmptyState message={emptyMessage} />
      )}

      {!isLoading && games.length > 0 && (
        <>
          <p className={styles.count}>
            {totalCount ?? games.length}
            {hasNextPage ? '+' : ''} {(totalCount ?? games.length) === 1 ? 'gra' : 'gier'}
          </p>
          <div className={styles.grid}>
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
          {hasNextPage && (
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