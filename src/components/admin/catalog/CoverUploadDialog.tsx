import { useState } from 'react';
import { useAdminUploadCover } from '../../../hooks/useAdminCatalog';
import { Button, Modal } from '../../ui';
import styles from './CoverUploadDialog.module.css';

interface CoverUploadDialogProps {
  gameId: number;
  onClose: () => void;
}

export function CoverUploadDialog({ gameId, onClose }: CoverUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const upload = useAdminUploadCover(gameId);

  return (
    <Modal open onClose={onClose} labelledBy="cover-upload-title" className={styles.dialog}>
      <h2 id="cover-upload-title" className={styles.title}>
        Globalna okładka
      </h2>

      <input
        className={styles.field}
        type="file"
        aria-label="Plik okładki"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onClose}>
          Anuluj
        </Button>
        <Button
          type="button"
          disabled={!file}
          loading={upload.isPending}
          onClick={() => file && upload.mutate(file, { onSuccess: onClose })}
        >
          Zapisz
        </Button>
      </div>
    </Modal>
  );
}
