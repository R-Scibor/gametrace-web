import { useState } from 'react';
import { useAdminMatch, useLinkIgdb } from '../../../hooks/useAdminCatalog';
import type { IGDBCandidate } from '../../../types/api';
import { Button, Modal } from '../../ui';
import styles from './IgdbLinkDialog.module.css';

interface IgdbLinkDialogProps {
  gameId: number;
  gameName: string;
  onClose: () => void;
}

export function IgdbLinkDialog({ gameId, gameName, onClose }: IgdbLinkDialogProps) {
  const [query, setQuery] = useState(gameName);
  const [candidates, setCandidates] = useState<IGDBCandidate[]>([]);
  const [searched, setSearched] = useState(false);
  const match = useAdminMatch();
  const link = useLinkIgdb(gameId);

  const search = () => {
    match.mutate(query, {
      onSuccess: (data) => {
        setCandidates(data);
        setSearched(true);
      },
    });
  };

  return (
    <Modal open onClose={onClose} labelledBy="igdb-link-title" className={styles.dialog}>
      <h2 id="igdb-link-title" className={styles.title}>
        Powiąż z IGDB
      </h2>

      <div className={styles.search}>
        <input
          className={styles.input}
          aria-label="Zapytanie IGDB"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="button" onClick={search} loading={match.isPending}>
          Szukaj
        </Button>
      </div>

      {searched && candidates.length === 0 && !match.isPending && (
        <p className={styles.empty}>Brak wyników.</p>
      )}

      {candidates.length > 0 && (
        <div className={styles.list}>
          {candidates.map((candidate) => (
            <div key={candidate.igdb_id} className={styles.candidate}>
              <span className={styles.candidateName}>
                {candidate.name}
                {candidate.year ? ` (${candidate.year})` : ''}
              </span>
              <Button
                type="button"
                variant="secondary"
                loading={link.isPending}
                onClick={() => link.mutate(candidate.igdb_id, { onSuccess: onClose })}
              >
                Powiąż
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onClose}>
          Zamknij
        </Button>
      </div>
    </Modal>
  );
}
