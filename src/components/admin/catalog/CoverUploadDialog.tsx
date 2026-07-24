import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminUploadCover } from '../../../hooks/useAdminCatalog';
import { Button, Modal } from '../../ui';
import styles from './CoverUploadDialog.module.css';

interface CoverUploadDialogProps {
  gameId: number;
  onClose: () => void;
}

export function CoverUploadDialog({ gameId, onClose }: CoverUploadDialogProps) {
  const { t } = useTranslation('admin');
  const [file, setFile] = useState<File | null>(null);
  const upload = useAdminUploadCover(gameId);

  return (
    <Modal open onClose={onClose} labelledBy="cover-upload-title" className={styles.dialog}>
      <h2 id="cover-upload-title" className={styles.title}>
        {t('catalog.cover.title')}
      </h2>

      <input
        className={styles.field}
        type="file"
        aria-label={t('catalog.cover.fileAria')}
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          disabled={!file}
          loading={upload.isPending}
          onClick={() => file && upload.mutate(file, { onSuccess: onClose })}
        >
          {t('common.save')}
        </Button>
      </div>
    </Modal>
  );
}
