
import { useLocalCoversStore } from '../store/localCoversStore';
import styles from './Cover.module.css';

export interface CoverProps {
  gameId?: number | null;
  coverImageUrl?: string | null;
  placeholderChar?: string;
  className?: string;
}

export function Cover({ gameId, coverImageUrl, placeholderChar = '?', className }: CoverProps) {
  const localUri = useLocalCoversStore((s) => (gameId != null ? s.covers[gameId] : undefined));
  const src = localUri ?? coverImageUrl ?? null;

  if (src) {
    return (
      <img
        src={src}
        alt="Okładka"
        className={[styles.cover, className].filter(Boolean).join(' ')}
      />
    );
  }

  const char = placeholderChar ? placeholderChar.charAt(0).toUpperCase() : '?';

  return (
    <div className={[styles.placeholder, className].filter(Boolean).join(' ')}>
      {char}
    </div>
  );
}