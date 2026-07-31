import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../../ui';
import styles from './QueuePreview.module.css';

interface QueuePreviewProps {
  title: string;
  to: string;
  isLoading: boolean;
  isError: boolean;
  empty: boolean;
  emptyMessage: string;
  children: ReactNode;
}

/**
 * Compact inbox strip for the admin overview — a few rows + link into the full surface.
 */
export function QueuePreview({
  title,
  to,
  isLoading,
  isError,
  empty,
  emptyMessage,
  children,
}: QueuePreviewProps) {
  const { t } = useTranslation('admin');

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <Link to={to} className={styles.viewAll}>
          {t('overview.viewAll')}
        </Link>
      </header>

      {isLoading && (
        <div className={styles.stack}>
          <Skeleton height={44} />
          <Skeleton height={44} />
        </div>
      )}

      {!isLoading && isError && (
        <p className={styles.empty}>{t('overview.previewError')}</p>
      )}

      {!isLoading && !isError && empty && (
        <p className={styles.empty}>{emptyMessage}</p>
      )}

      {!isLoading && !isError && !empty && <ul className={styles.list}>{children}</ul>}
    </section>
  );
}

interface PreviewRowProps {
  to: string;
  primary: string;
  secondary: string;
}

export function PreviewRow({ to, primary, secondary }: PreviewRowProps) {
  return (
    <li>
      <Link to={to} className={styles.row}>
        <span className={styles.primary}>{primary}</span>
        <span className={styles.secondary}>{secondary}</span>
      </Link>
    </li>
  );
}
