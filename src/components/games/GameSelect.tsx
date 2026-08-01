import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameLadder } from '../../hooks/useGameLadder';
import { Skeleton } from '../ui';
import styles from './GameSelect.module.css';

interface GameSelectProps {
  id?: string;
  value: number | '';
  onChange: (gameId: number) => void;
  disabled?: boolean;
  'aria-label'?: string;
  /** Seeds the search box on mount. Used by the voice resolve-miss handoff. */
  initialQuery?: string;
}

export function GameSelect({
  id,
  value,
  onChange,
  disabled,
  'aria-label': ariaLabel,
  initialQuery,
}: GameSelectProps) {
  const { t } = useTranslation('library');
  const ladder = useGameLadder(onChange);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [prevActiveResetKey, setPrevActiveResetKey] = useState(
    `${ladder.mode}|${ladder.query}`,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = id ? `${id}-listbox` : undefined;

  const { setQuery, reset } = ladder;

  // Mount-only. Deliberately NOT re-applied when the prop changes, so a re-render
  // cannot overwrite what the user has since typed.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !initialQuery) return;
    seeded.current = true;
    setQuery(initialQuery);
  }, [initialQuery, setQuery]);

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

  const closeAfterSelect = () => {
    setOpen(false);
    setEditing(false);
  };

  const trimmed = ladder.query.trim();
  const isBrowse = ladder.mode === 'browse';
  const nothingInBrowse =
    isBrowse && ladder.libraryMatches.length === 0 && ladder.catalogMatches.length === 0;

  type Activatable =
    | { kind: 'pick'; key: string; run: () => void }
    | { kind: 'action'; key: string; run: () => void };

  const activatables = useMemo<Activatable[]>(() => {
    const out: Activatable[] = [];

    if (isBrowse) {
      for (const game of ladder.libraryMatches) {
        out.push({
          kind: 'pick',
          key: `lib-${game.id}`,
          run: () => {
            void ladder.select({ kind: 'library', game });
            closeAfterSelect();
          },
        });
      }
      for (const suggestion of ladder.catalogMatches) {
        out.push({
          kind: 'pick',
          key: `cat-${suggestion.game_id}`,
          run: () => {
            void ladder.select({ kind: 'catalog', suggestion });
            closeAfterSelect();
          },
        });
      }
    }

    if (ladder.mode === 'online') {
      for (const candidate of ladder.candidates) {
        out.push({
          kind: 'pick',
          key: `igdb-${candidate.igdb_id}`,
          run: () => {
            void ladder.select({ kind: 'candidate', candidate }).then((id) => {
              if (id != null) closeAfterSelect();
            });
          },
        });
      }
    }

    // Footer actions are activatable by the same index as options.
    if (isBrowse && trimmed.length > 0) {
      out.push({ kind: 'action', key: 'search-online', run: () => ladder.searchOnline() });
    }
    if (ladder.mode === 'error') {
      out.push({ kind: 'action', key: 'retry', run: () => ladder.searchOnline() });
    }
    if (ladder.mode === 'online' && trimmed.length > 0) {
      out.push({
        kind: 'action',
        key: 'add-unrecognized',
        run: () => {
          void ladder.select({ kind: 'unrecognized' }).then((id) => {
            if (id != null) closeAfterSelect();
          });
        },
      });
    }

    return out;
  }, [ladder, isBrowse, trimmed]);

  // Reset the active index whenever the array it indexes into is rebuilt. Adjusted
  // during render (React's documented pattern for this) rather than in a useEffect,
  // since setState-in-effect triggers a lint error for the extra cascading render.
  const activeResetKey = `${ladder.mode}|${ladder.query}`;
  if (activeResetKey !== prevActiveResetKey) {
    setPrevActiveResetKey(activeResetKey);
    setActiveIndex(-1);
  }

  if (ladder.isPickerLoading) return <Skeleton height={46} />;

  const selectedName =
    value === ''
      ? null
      : (ladder.selectedMeta?.id === value ? ladder.selectedMeta.primary_name : null) ??
        ladder.pickerGames.find((g) => g.id === value)?.primary_name ??
        null;

  if (selectedName && !editing) {
    return (
      <div className={styles.root} ref={rootRef}>
        <button
          type="button"
          id={id}
          className={styles.chip}
          onClick={() => {
            setEditing(true);
            reset();
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          disabled={disabled}
          aria-label={ariaLabel ?? t('select.changeAria')}
        >
          <span className={styles.chipRule} aria-hidden />
          <span className={styles.chipName}>{selectedName}</span>
          <span className={styles.chipAction}>{t('select.change')}</span>
        </button>
      </div>
    );
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, activatables.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const item = activatables[activeIndex];
      if (open && item) {
        e.preventDefault();
        item.run();
      }
    } else if (e.key === 'Escape') {
      // Deliberately does NOT reset the ladder: an accidental Escape must not
      // discard IGDB candidates the user just paid a round trip for.
      setOpen(false);
      setEditing(false);
    }
  };

  const optionDomId = (key?: string) => (key && id ? `${id}-opt-${key}` : undefined);
  const activeKey = activeIndex >= 0 ? activatables[activeIndex]?.key : undefined;

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
        aria-activedescendant={optionDomId(activeKey)}
        className={styles.input}
        placeholder={t('select.placeholder')}
        value={ladder.query}
        disabled={disabled || ladder.isCreating}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {open && (
        <div className={styles.dropdown}>
          <ul id={listId} role="listbox" className={styles.list}>
            {isBrowse && ladder.libraryMatches.length > 0 && (
              <li role="group" aria-label={t('select.groupLibrary')} className={styles.group}>
                <div className={styles.groupHeader} aria-hidden="true">
                  {t('select.groupLibrary')}
                </div>
                <ul role="presentation" className={styles.groupList}>
                  {ladder.libraryMatches.map((game) => {
                    const key = `lib-${game.id}`;
                    const active = key === activeKey;
                    return (
                      <li
                        key={key}
                        id={optionDomId(key)}
                        role="option"
                        aria-selected={active}
                        className={`${styles.option} ${active ? styles.optionActive : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          void ladder.select({ kind: 'library', game });
                          closeAfterSelect();
                        }}
                      >
                        {game.primary_name}
                      </li>
                    );
                  })}
                </ul>
              </li>
            )}

            {isBrowse && ladder.catalogMatches.length > 0 && (
              <li role="group" aria-label={t('select.groupCatalog')} className={styles.group}>
                <div className={styles.groupHeader} aria-hidden="true">
                  {t('select.groupCatalog')}
                </div>
                <ul role="presentation" className={styles.groupList}>
                  {ladder.catalogMatches.map((suggestion) => {
                    const key = `cat-${suggestion.game_id}`;
                    const active = key === activeKey;
                    return (
                      <li
                        key={key}
                        id={optionDomId(key)}
                        role="option"
                        aria-selected={active}
                        className={`${styles.option} ${active ? styles.optionActive : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          void ladder.select({ kind: 'catalog', suggestion });
                          closeAfterSelect();
                        }}
                      >
                        {suggestion.primary_name}
                      </li>
                    );
                  })}
                </ul>
              </li>
            )}

            {ladder.mode === 'online' &&
              ladder.candidates.map((candidate) => {
                const key = `igdb-${candidate.igdb_id}`;
                const active = key === activeKey;
                return (
                  <li
                    key={key}
                    id={optionDomId(key)}
                    role="option"
                    aria-selected={active}
                    className={`${styles.candidate} ${active ? styles.optionActive : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      void ladder.select({ kind: 'candidate', candidate }).then((id) => {
                        if (id != null) closeAfterSelect();
                      });
                    }}
                  >
                    {candidate.cover_url && (
                      <img
                        src={candidate.cover_url}
                        alt=""
                        className={styles.candidateCover}
                      />
                    )}
                    <span className={styles.candidateName}>{candidate.name}</span>
                    {candidate.year != null && (
                      <span className={styles.candidateYear}>{candidate.year}</span>
                    )}
                  </li>
                );
              })}
          </ul>

          {nothingInBrowse && !ladder.isSuggesting && (
            <p className={styles.empty}>{t('select.noResults')}</p>
          )}

          {ladder.mode === 'searching' && (
            <p className={styles.empty}>{t('select.searching')}</p>
          )}

          {ladder.mode === 'online' && ladder.candidates.length === 0 && (
            <p className={styles.empty}>{t('select.onlineNoResults')}</p>
          )}

          {ladder.error && (
            <p className={styles.error} role="alert">
              {t(ladder.error.key)}
            </p>
          )}

          <div className={styles.footer}>
            {(isBrowse || ladder.mode === 'searching') && trimmed.length > 0 && (
              <button
                type="button"
                id={optionDomId('search-online')}
                className={`${styles.footerAction} ${
                  activeKey === 'search-online' ? styles.optionActive : ''
                }`}
                disabled={ladder.mode === 'searching'}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => ladder.searchOnline()}
              >
                {t('select.searchOnline')}
              </button>
            )}

            {ladder.mode === 'error' && (
              <button
                type="button"
                id={optionDomId('retry')}
                className={`${styles.footerAction} ${
                  activeKey === 'retry' ? styles.optionActive : ''
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => ladder.searchOnline()}
              >
                {t('select.retry')}
              </button>
            )}

            {ladder.mode === 'online' && trimmed.length > 0 && (
              <button
                type="button"
                id={optionDomId('add-unrecognized')}
                className={`${styles.footerAction} ${
                  activeKey === 'add-unrecognized' ? styles.optionActive : ''
                }`}
                disabled={ladder.isCreating}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  void ladder.select({ kind: 'unrecognized' }).then((id) => {
                    if (id != null) closeAfterSelect();
                  });
                }}
              >
                {ladder.isCreating
                  ? t('select.creating')
                  : t('select.addUnrecognized', { name: trimmed })}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
