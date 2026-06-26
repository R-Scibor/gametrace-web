import { useRef, useState } from 'react';
import { useUploadCover } from '../../hooks/useGames';
import { Cover } from '../Cover';
import { Button } from '../ui';
import styles from './CoverUpload.module.css';

interface CoverUploadProps {
  gameId: number;
  coverUrl: string | null;
  gameName: string;
}

export function CoverUpload({ gameId, coverUrl, gameName }: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const upload = useUploadCover(gameId);

  const displayUrl = preview ?? coverUrl;

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPreview(URL.createObjectURL(file));
    upload.mutate(file, {
      onSettled: () => setPreview(null),
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.preview}>
        <Cover coverImageUrl={displayUrl} placeholderChar={gameName} />
      </div>
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
        {upload.isPending ? 'WGRYWANIE...' : 'WGRAJ OKŁADKĘ'}
      </Button>
      <p className={styles.hint}>JPEG, PNG lub WebP</p>
    </div>
  );
}