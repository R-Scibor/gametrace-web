import { useState } from 'react';
import { useRequeueEnrichment } from '../../../hooks/useAdminCatalog';
import { Button } from '../../ui';
import { CoverUploadDialog } from './CoverUploadDialog';
import { IgdbLinkDialog } from './IgdbLinkDialog';
import styles from './ActionsSection.module.css';

interface ActionsSectionProps {
  gameId: number;
  gameName: string;
}

export function ActionsSection({ gameId, gameName }: ActionsSectionProps) {
  const [dialog, setDialog] = useState<'igdb' | 'cover' | null>(null);
  const requeue = useRequeueEnrichment();

  return (
    <div className={styles.actions}>
      <Button type="button" variant="secondary" onClick={() => setDialog('igdb')}>
        Powiąż z IGDB
      </Button>
      <Button
        type="button"
        variant="secondary"
        loading={requeue.isPending}
        onClick={() => requeue.mutate(gameId)}
      >
        Wzbogać ponownie
      </Button>
      <Button type="button" variant="secondary" onClick={() => setDialog('cover')}>
        Zmień okładkę
      </Button>

      {dialog === 'igdb' && (
        <IgdbLinkDialog gameId={gameId} gameName={gameName} onClose={() => setDialog(null)} />
      )}
      {dialog === 'cover' && (
        <CoverUploadDialog gameId={gameId} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
