
import styles from './Cover.module.css';

export interface CoverProps {
  coverImageUrl?: string | null;
  placeholderChar?: string;
  className?: string;
}

export function Cover({ coverImageUrl, placeholderChar = '?', className }: CoverProps) {
  if (coverImageUrl) {
    return (
      <img 
        src={coverImageUrl} 
        alt="Cover" 
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
