import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGamesPaginated } from '../hooks/useGames';
import { SectionHeader, EmptyState, ErrorBanner, Skeleton, Button, SampleDataBanner } from '../components/ui';
import { GameCard } from '../components/games/GameCard';
import { useGamesStore } from '../store/gamesStore';
import { useAuthStore } from '../store/authStore';
import { SAMPLE_GAMES } from '../lib/sampleData';
import {
  clearFacetParams,
  getFilterPrefix,
  getGameSorts,
  parseFacetFilter,
  parseLibrarySort,
  persistLibrarySort,
} from '../lib/libraryParams';
import type { EnrichmentStatus, GameSort } from '../types/api';
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

function tabToFilter(tab: LibraryTab, q?: string, sort?: GameSort, facet?: ReturnType<typeof parseFacetFilter>) {
  if (tab === 'review') {
    return { status: 'NEEDS_REVIEW' as EnrichmentStatus, q, sort, facet: facet ?? null };
  }
  if (tab === 'other') return { inLibrary: false, q, sort, facet: facet ?? null };
  return { q, sort, facet: facet ?? null };
}

export function LibraryPage() {
  const { t } = useTranslation('library');
  const [tab, setTab] = useState<LibraryTab>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const gamesStale = useGamesStore((s) => s.stale);
  const markFresh = useGamesStore((s) => s.markFresh);

  const facet = useMemo(() => parseFacetFilter(searchParams), [searchParams]);
  const sort = useMemo(() => parseLibrarySort(searchParams), [searchParams]);
  const activeTab: LibraryTab = facet ? 'all' : tab;
  const gameSorts = getGameSorts();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!gamesStale) return;
    void queryClient.invalidateQueries({ queryKey: ['games'] });
    markFresh();
  }, [gamesStale, markFresh, queryClient]);

  const setSort = (next: GameSort) => {
    persistLibrarySort(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'name') params.delete('sort');
    else params.set('sort', next);
    setSearchParams(params, { replace: true });
  };

  const clearFacet = () => {
    setSearchParams(clearFacetParams(searchParams), { replace: true });
  };

  const selectTab = (next: LibraryTab) => {
    if (next !== 'all' && facet) {
      setSearchParams(clearFacetParams(searchParams), { replace: true });
    }
    setTab(next);
  };

  const filter = useMemo(
    () => tabToFilter(activeTab, debouncedQuery || undefined, sort, facet),
    [activeTab, debouncedQuery, sort, facet],
  );
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGamesPaginated(filter);

  const games = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const totalCount = data?.pages[0]?.total;

  const previewDismissed = useAuthStore((s) => s.previewDismissed);
  const setPreviewDismissed = useAuthStore((s) => s.setPreviewDismissed);
  const isDefaultUnfilteredView = activeTab === 'all' && !facet && !debouncedQuery;
  const showPreview =
    !isLoading && !isError && games.length === 0 && isDefaultUnfilteredView && !previewDismissed;

  const emptyMessage =
    activeTab === 'review'
      ? t('empty.review')
      : activeTab === 'other'
        ? t('empty.other')
        : facet
          ? t('empty.facet', { value: facet.value })
          : debouncedQuery
            ? t('empty.query', { query: debouncedQuery })
            : t('empty.default');

  const count = totalCount ?? games.length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <SectionHeader title={t('title')} style={{ margin: 0 }} />
        <div className={styles.tabs}>
          <button
            type="button"
            className={[styles.tab, activeTab === 'all' ? styles.tabActive : ''].filter(Boolean).join(' ')}
            onClick={() => selectTab('all')}
          >
            {t('tabs.all')}
          </button>
          <button
            type="button"
            className={[styles.tab, activeTab === 'review' ? styles.tabActive : ''].filter(Boolean).join(' ')}
            onClick={() => selectTab('review')}
          >
            {t('tabs.review')}
          </button>
          <button
            type="button"
            className={[styles.tab, activeTab === 'other' ? styles.tabActive : ''].filter(Boolean).join(' ')}
            onClick={() => selectTab('other')}
          >
            {t('tabs.other')}
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
          placeholder={t('search.placeholder')}
          aria-label={t('search.ariaLabel')}
        />
      </div>

      {facet && (
        <div className={styles.chipRow}>
          <span className={styles.chip}>
            <span className={styles.chipText}>
              {getFilterPrefix(facet.type)}: {facet.value}
            </span>
            <button
              type="button"
              className={styles.chipClear}
              onClick={clearFacet}
              aria-label={t('filter.clearAria')}
            >
              ✕
            </button>
          </span>
        </div>
      )}

      <div className={styles.sortRow}>
        {gameSorts.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={[styles.sortPill, sort === key ? styles.sortPillActive : ''].filter(Boolean).join(' ')}
            onClick={() => setSort(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <LibrarySkeleton />}

      {!isLoading && (isError || !data) && (
        <div className={styles.errorWrap}>
          <ErrorBanner message={t('error.load')} />
          <Button variant="secondary" onClick={() => refetch()}>
            {t('error.retry')}
          </Button>
        </div>
      )}

      {!isLoading && !isError && games.length === 0 && !showPreview && (
        <EmptyState message={emptyMessage} />
      )}

      {showPreview && (
        <>
          <SampleDataBanner onDismiss={() => setPreviewDismissed(true)} />
          <div className={styles.grid}>
            {SAMPLE_GAMES.map((game) => (
              <GameCard key={game.id} game={game} disabled />
            ))}
          </div>
        </>
      )}

      {!isLoading && games.length > 0 && (
        <>
          <p className={styles.count}>
            {count}
            {hasNextPage ? '+' : ''} {count === 1 ? t('count.one') : t('count.many')}
          </p>
          <div className={styles.grid}>
            {games.map((game) => (
              <GameCard key={game.id} game={game} sort={sort} />
            ))}
          </div>
          {hasNextPage && (
            <div className={styles.loadMore}>
              <Button
                variant="secondary"
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {t('loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
