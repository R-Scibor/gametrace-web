import type { AdminGameItem } from '../../../types/api';
import { ENRICHMENT_STATUS_LABELS } from '../../../lib/enrichmentStatus';
import { sessionsLabel } from '../../../lib/pluralize';
import { Button, EmptyState, Panel, SectionHeader } from '../../ui';
import { ActionsSection } from './ActionsSection';
import { AliasSection } from './AliasSection';
import { MergeSection } from './MergeSection';
import styles from './CatalogInspector.module.css';

interface CatalogInspectorProps {
  item: AdminGameItem | null;
  /**
   * Id that is selected in the URL but absent from the loaded result set —
   * typically the surviving game after a merge into a different status filter
   * or page. Without this the inspector would fall back to the generic prompt,
   * which reads as "your selection was lost" rather than "it is filtered out".
   */
  missingId?: number | null;
  onShowAll?: () => void;
  onMerged: (targetId: number) => void;
}

export function CatalogInspector({ item, missingId, onShowAll, onMerged }: CatalogInspectorProps) {
  if (!item) {
    if (missingId != null) {
      return (
        <div className={styles.missing}>
          <EmptyState message={`Gra #${missingId} nie jest widoczna przy tym filtrze.`} />
          {onShowAll && (
            <Button type="button" variant="secondary" onClick={onShowAll}>
              Pokaż wszystkie
            </Button>
          )}
        </div>
      );
    }
    return <EmptyState message="Wybierz grę z tabeli." />;
  }

  return (
    <Panel
      eyebrow={`#${item.id} · ${ENRICHMENT_STATUS_LABELS[item.enrichment_status]} · ${sessionsLabel(item.session_count)}`}
      title={item.primary_name}
      headerExtra={
        item.cover_image_url ? (
          <img className={styles.cover} src={item.cover_image_url} alt="" />
        ) : (
          <div className={styles.cover} />
        )
      }
    >
      <section>
        <SectionHeader label="Aliasy" />
        <AliasSection gameId={item.id} aliases={item.aliases} />
      </section>

      <section>
        <SectionHeader label="Akcje" />
        <ActionsSection gameId={item.id} gameName={item.primary_name} />
      </section>

      <section className={styles.danger}>
        <SectionHeader label="Scal" />
        <MergeSection gameId={item.id} onMerged={onMerged} />
      </section>
    </Panel>
  );
}
