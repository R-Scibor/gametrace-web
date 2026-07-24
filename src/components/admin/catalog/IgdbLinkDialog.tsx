import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminMatch, useLinkIgdb } from '../../../hooks/useAdminCatalog';
import type { IGDBCandidate } from '../../../types/api';
import { Button, EmptyState, Input, Modal } from '../../ui';
import styles from './IgdbLinkDialog.module.css';

interface IgdbLinkDialogProps {
  gameId: number;
  gameName: string;
  onClose: () => void;
}

export function IgdbLinkDialog({ gameId, gameName, onClose }: IgdbLinkDialogProps) {
  const { t } = useTranslation('admin');
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
        {t('catalog.igdb.title')}
      </h2>

      <div className={styles.search}>
        <Input
          className={styles.input}
          aria-label={t('catalog.igdb.queryAria')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="button" onClick={search} loading={match.isPending}>
          {t('common.search')}
        </Button>
      </div>

      {searched && candidates.length === 0 && !match.isPending && (
        <EmptyState message={t('catalog.igdb.noResults')} />
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
                {t('catalog.igdb.link')}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  );
}
