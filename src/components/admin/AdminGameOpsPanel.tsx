import { useState } from 'react';
import type { CoverSource } from '../../types/api';
import { MergeDialog } from '../library/MergeDialog';
import { Button } from '../ui';
import { AdminGlobalCoverUpload } from './AdminGlobalCoverUpload';
import styles from './AdminGameOpsPanel.module.css';

interface AdminGameOpsPanelProps {
  gameId: number;
  gameName: string;
  coverUrl: string | null;
  coverSource: CoverSource;
}

export function AdminGameOpsPanel({
  gameId,
  gameName,
  coverUrl,
  coverSource,
}: AdminGameOpsPanelProps) {
  const [mergeOpen, setMergeOpen] = useState(false);

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Łączenie gier</p>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={() => setMergeOpen(true)}>
            POŁĄCZ Z GRĄ
          </Button>
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Okładka globalna</p>
        <AdminGlobalCoverUpload
          gameId={gameId}
          gameName={gameName}
          coverUrl={coverUrl}
          coverSource={coverSource}
        />
      </div>

      {mergeOpen && (
        <MergeDialog
          sourceId={gameId}
          sourceName={gameName}
          onClose={() => setMergeOpen(false)}
        />
      )}
    </div>
  );
}