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
  // Tracks the highlighted activatable by KEY, not by array index. `activatables`
  // is rebuilt on every mode/query change AND whenever the debounced catalog
  // suggest resolves mid-query (same mode, same query, array grows/shrinks in the
  // middle). An index survives that rebuild pointing at whatever now occupies that
  // slot — including a footer action, which could fire an unintended POST
  // /games/match. A key is self-healing: if the highlighted item is still present
  // (anywhere in the rebuilt array) the highlight follows it; if it's gone, the
  // lookup below naturally yields "nothing highlighted" instead of a wrong item.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = id ? `${id}-listbox` : undefined;
  const optionDomId = (key?: string | null) => (key && id ? `${id}-opt-${key}` : undefined);

  const { setQuery, reset } = ladder;

  // Mount-only. Deliberately NOT re-applied when the prop changes, so a re-render
  // cannot overwrite what the user has since typed.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !initialQuery) return;
    seeded.current = true;
    setQuery(initialQuery);
    setOpen(true);
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
    setActiveKey(null);
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

  // Ids of the footer actions currently gated in for this mode, in render order.
  // Kept in lockstep with the `kind: 'action'` entries above rather than
  // re-deriving the gating conditions, so aria-owns can never reference an id
  // that isn't actually in the DOM.
  const footerOwnsIds = activatables
    .filter((a) => a.kind === 'action')
    .map((a) => optionDomId(a.key))
    .filter((v): v is string => Boolean(v))
    .join(' ');

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
            setActiveKey(null);
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
    const currentIndex = activatables.findIndex((a) => a.key === activeKey);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      const next = Math.min(currentIndex + 1, activatables.length - 1);
      setActiveKey(activatables[next]?.key ?? null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      // Floors at -1 (nothing highlighted), not 0 — otherwise once the user
      // reaches the first item there is no way back to "nothing active", and a
      // stray Enter would select a game they thought they'd backed away from.
      const next = Math.max(currentIndex - 1, -1);
      setActiveKey(next >= 0 ? (activatables[next]?.key ?? null) : null);
    } else if (e.key === 'Enter') {
      const item = activatables.find((a) => a.key === activeKey);
      if (open && item) {
        e.preventDefault();
        item.run();
      }
    } else if (e.key === 'Escape') {
      // Deliberately does NOT reset the ladder: an accidental Escape must not
      // discard IGDB candidates the user just paid a round trip for.
      setOpen(false);
      setEditing(false);
      setActiveKey(null);
    }
  };

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
          <ul
            id={listId}
            role="listbox"
            className={styles.list}
            aria-owns={footerOwnsIds || undefined}
          >
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
                role="option"
                aria-selected={activeKey === 'search-online'}
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
                role="option"
                aria-selected={activeKey === 'retry'}
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
                role="option"
                aria-selected={activeKey === 'add-unrecognized'}
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
