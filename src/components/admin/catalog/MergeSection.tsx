import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminGameSearch, useAdminMergeGame } from '../../../hooks/useAdminCatalog';
import type { AdminGameItem } from '../../../types/api';
import { Button, ConfirmDialog, Input } from '../../ui';
import styles from './MergeSection.module.css';

interface MergeSectionProps {
  gameId: number;
  onMerged: (targetId: number) => void;
}

export function MergeSection({ gameId, onMerged }: MergeSectionProps) {
  const { t } = useTranslation('admin');
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<AdminGameItem | null>(null);
  const { data: candidates = [] } = useAdminGameSearch(query, gameId);
  const merge = useAdminMergeGame(gameId, onMerged);

  const confirmMerge = () => {
    if (!target) return;
    merge.mutate(target.id, { onSuccess: () => setTarget(null) });
  };

  return (
    <div className={styles.zone}>
      <Input
        className={styles.input}
        aria-label={t('catalog.merge.searchAria')}
        placeholder={t('catalog.merge.placeholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className={styles.results}>
        {candidates.map((candidate) => (
          <div key={candidate.id} className={styles.result}>
            <span>
              {candidate.primary_name} (#{candidate.id})
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={merge.isPending}
              onClick={() => setTarget(candidate)}
            >
              {t('catalog.merge.here')}
            </Button>
          </div>
        ))}
      </div>

      <p className={styles.hint}>{t('catalog.merge.hint')}</p>

      <ConfirmDialog
        open={target != null}
        title={t('catalog.merge.title')}
        message={
          target ? t('catalog.merge.message', { name: target.primary_name }) : null
        }
        confirmLabel={t('catalog.merge.confirm')}
        variant="danger"
        loading={merge.isPending}
        onConfirm={confirmMerge}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
