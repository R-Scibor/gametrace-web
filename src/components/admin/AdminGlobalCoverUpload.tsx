import { useRef, useState } from 'react';
import { useAdminUploadCover } from '../../hooks/useAdmin';
import { Cover } from '../Cover';
import { Button } from '../ui';
import styles from './AdminGlobalCoverUpload.module.css';

interface AdminGlobalCoverUploadProps {
  gameId: number;
  gameName: string;
  coverUrl: string | null;
  coverSource: string;
}

export function AdminGlobalCoverUpload({
  gameId,
  gameName,
  coverUrl,
  coverSource,
}: AdminGlobalCoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const upload = useAdminUploadCover(gameId);

  const displayUrl = preview ?? coverUrl;

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    upload.mutate(file, {
      onSettled: () => {
        URL.revokeObjectURL(objectUrl);
        setPreview(null);
      },
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.preview}>
        <Cover gameId={gameId} coverImageUrl={displayUrl} placeholderChar={gameName} />
      </div>
      <p className={styles.meta}>Źródło: {coverSource}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className={styles.hiddenInput}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {upload.isPending ? 'ZAPISYWANIE...' : 'WYBIERZ GLOBALNĄ OKŁADKĘ'}
      </Button>
      <p className={styles.hint}>
        Widoczna dla wszystkich użytkowników. Nadpisuje okładkę IGDB.
      </p>
    </div>
  );
}