import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRequeueEnrichment } from '../../hooks/useAdmin';
import type { AdminGameItem } from '../../types/api';
import { Button } from '../ui';
import { Cover } from '../Cover';
import { AdminGameOpsPanel } from './AdminGameOpsPanel';
import { AliasAddForm } from './AliasAddForm';
import { IgdbLinkDialog } from './IgdbLinkDialog';
import { ADMIN_STATUS_LABELS } from './adminCatalogLabels';
import styles from './AdminCatalogDetail.module.css';

interface AdminCatalogDetailProps {
  item: AdminGameItem;
}

export function AdminCatalogDetail({ item }: AdminCatalogDetailProps) {
  const [igdbOpen, setIgdbOpen] = useState(false);
  const enrich = useRequeueEnrichment();

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.cover}>
          <Cover
            gameId={item.id}
            coverImageUrl={item.cover_image_url}
            placeholderChar={item.primary_name}
          />
        </div>
        <div className={styles.info}>
          <h2 className={styles.name}>{item.primary_name}</h2>
          <p className={styles.meta}>
            ID: {item.id} · {ADMIN_STATUS_LABELS[item.enrichment_status]} · {item.session_count}{' '}
            sesji
          </p>
          {item.external_api_id && (
            <p className={styles.meta}>IGDB: {item.external_api_id}</p>
          )}
          <Link to={`/library/${item.id}`} className={styles.libraryLink}>
            Otwórz w bibliotece →
          </Link>
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Aliasy Discord</p>
        {item.aliases.length > 0 ? (
          <ul className={styles.aliasList}>
            {item.aliases.map((alias) => (
              <li key={alias}>{alias}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyAliases}>Brak aliasów.</p>
        )}
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          disabled={enrich.isPending}
          onClick={() => enrich.mutate(item.id)}
        >
          PONÓW WZBOGACANIE
        </Button>
        <Button type="button" variant="secondary" onClick={() => setIgdbOpen(true)}>
          POWIĄŻ Z IGDB
        </Button>
      </div>

      <AliasAddForm gameId={item.id} />

      <AdminGameOpsPanel
        gameId={item.id}
        gameName={item.primary_name}
        coverUrl={item.cover_image_url}
        coverSource={item.cover_source}
      />

      {igdbOpen && (
        <IgdbLinkDialog
          gameId={item.id}
          initialQuery={item.primary_name}
          onClose={() => setIgdbOpen(false)}
        />
      )}
    </div>
  );
}