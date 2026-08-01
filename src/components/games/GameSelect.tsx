import { useEffect, useRef, useState } from 'react';
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

  if (ladder.isPickerLoading) return <Skeleton height={46} />;

  const selectedName =
    value === ''
      ? null
      : (ladder.selectedMeta?.id === value ? ladder.selectedMeta.primary_name : null) ??
        ladder.libraryMatches.find((g) => g.id === value)?.primary_name ??
        null;

  const closeAfterSelect = () => {
    setOpen(false);
    setEditing(false);
  };

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

  const trimmed = ladder.query.trim();
  const isBrowse = ladder.mode === 'browse';
  const nothingInBrowse =
    isBrowse && ladder.libraryMatches.length === 0 && ladder.catalogMatches.length === 0;

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
        placeholder={t('select.placeholder')}
        value={ladder.query}
        disabled={disabled || ladder.isCreating}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />

      {open && (
        <div className={styles.dropdown}>
          <ul id={listId} role="listbox" className={styles.list}>
            {isBrowse && ladder.libraryMatches.length > 0 && (
              <>
                <li className={styles.groupHeader} role="presentation">
                  {t('select.groupLibrary')}
                </li>
                {ladder.libraryMatches.map((game) => (
                  <li
                    key={`lib-${game.id}`}
                    role="option"
                    aria-selected={false}
                    className={styles.option}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      void ladder.select({ kind: 'library', game });
                      closeAfterSelect();
                    }}
                  >
                    {game.primary_name}
                  </li>
                ))}
              </>
            )}

            {isBrowse && ladder.catalogMatches.length > 0 && (
              <>
                <li className={styles.groupHeader} role="presentation">
                  {t('select.groupCatalog')}
                </li>
                {ladder.catalogMatches.map((suggestion) => (
                  <li
                    key={`cat-${suggestion.game_id}`}
                    role="option"
                    aria-selected={false}
                    className={styles.option}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      void ladder.select({ kind: 'catalog', suggestion });
                      closeAfterSelect();
                    }}
                  >
                    {suggestion.primary_name}
                  </li>
                ))}
              </>
            )}

            {nothingInBrowse && !ladder.isSuggesting && (
              <li className={styles.empty}>{t('select.noResults')}</li>
            )}

            {ladder.mode === 'searching' && (
              <li className={styles.empty}>{t('select.searching')}</li>
            )}

            {ladder.mode === 'online' && ladder.candidates.length === 0 && (
              <li className={styles.empty}>{t('select.onlineNoResults')}</li>
            )}

            {ladder.mode === 'online' &&
              ladder.candidates.map((candidate) => (
                <li
                  key={`igdb-${candidate.igdb_id}`}
                  role="option"
                  aria-selected={false}
                  className={styles.candidate}
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
              ))}
          </ul>

          {ladder.error && (
            <p className={styles.error} role="alert">
              {t(ladder.error.key)}
            </p>
          )}

          <div className={styles.footer}>
            {(isBrowse || ladder.mode === 'searching') && trimmed.length > 0 && (
              <button
                type="button"
                className={styles.footerAction}
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
                className={styles.footerAction}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => ladder.searchOnline()}
              >
                {t('select.retry')}
              </button>
            )}

            {ladder.mode === 'online' && trimmed.length > 0 && (
              <button
                type="button"
                className={styles.footerAction}
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
