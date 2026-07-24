import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('admin');
  const [dialog, setDialog] = useState<'igdb' | 'cover' | null>(null);
  const requeue = useRequeueEnrichment();

  return (
    <div className={styles.actions}>
      <Button type="button" variant="secondary" onClick={() => setDialog('igdb')}>
        {t('catalog.actions.linkIgdb')}
      </Button>
      <Button
        type="button"
        variant="secondary"
        loading={requeue.isPending}
        onClick={() => requeue.mutate(gameId)}
      >
        {t('catalog.actions.requeue')}
      </Button>
      <Button type="button" variant="secondary" onClick={() => setDialog('cover')}>
        {t('catalog.actions.changeCover')}
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
