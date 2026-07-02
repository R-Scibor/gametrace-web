import { useRef, useState } from 'react';
import { useLocalCoversStore } from '../../store/localCoversStore';
import { Cover } from '../Cover';
import { Button } from '../ui';
import { useToastStore } from '../../store/toastStore';
import styles from './CoverUpload.module.css';

interface CoverUploadProps {
  gameId: number;
  coverUrl: string | null;
  gameName: string;
}

export function CoverUpload({ gameId, coverUrl, gameName }: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const localCover = useLocalCoversStore((s) => s.covers[gameId]);
  const setCover = useLocalCoversStore((s) => s.setCover);
  const clearCover = useLocalCoversStore((s) => s.clearCover);
  const pushToast = useToastStore((s) => s.pushToast);

  const displayUrl = preview ?? localCover ?? coverUrl;

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setPending(true);
    try {
      await setCover(gameId, file);
      pushToast({ type: 'success', message: 'Okładka zapisana lokalnie.' });
    } catch {
      pushToast({ type: 'error', message: 'Nie udało się zapisać okładki.' });
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
      setPending(false);
    }
  };

  const handleClear = () => {
    clearCover(gameId);
    pushToast({ type: 'success', message: 'Przywrócono oryginalną okładkę.' });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.preview}>
        <Cover gameId={gameId} coverImageUrl={displayUrl} placeholderChar={gameName} />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className={styles.hiddenInput}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? 'ZAPISYWANIE...' : 'WYBIERZ ZDJĘCIE'}
      </Button>
      {localCover && (
        <Button type="button" variant="secondary" disabled={pending} onClick={handleClear}>
          PRZYWRÓĆ ORYGINALNĄ
        </Button>
      )}
      <p className={styles.hint}>Okładka zapisywana lokalnie w przeglądarce (JPEG, PNG, WebP)</p>
    </div>
  );
}