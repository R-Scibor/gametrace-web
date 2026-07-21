import type { AdminGameItem } from '../../../types/api';
import { ENRICHMENT_STATUS_LABELS } from '../../../lib/enrichmentStatus';
import { sessionsLabel } from '../../../lib/pluralize';
import { EmptyState, Panel, SectionHeader } from '../../ui';
import { ActionsSection } from './ActionsSection';
import { AliasSection } from './AliasSection';
import { MergeSection } from './MergeSection';
import styles from './CatalogInspector.module.css';

interface CatalogInspectorProps {
  item: AdminGameItem | null;
  onMerged: (targetId: number) => void;
}

export function CatalogInspector({ item, onMerged }: CatalogInspectorProps) {
  if (!item) {
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
