import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('admin');
  if (!item) {
    if (missingId != null) {
      return (
        <div className={styles.missing}>
          <EmptyState message={t('catalog.missingFiltered', { id: missingId })} />
          {onShowAll && (
            <Button type="button" variant="secondary" onClick={onShowAll}>
              {t('catalog.showAll')}
            </Button>
          )}
        </div>
      );
    }
    return <EmptyState message={t('catalog.selectPrompt')} />;
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
        <SectionHeader label={t('catalog.sections.aliases')} />
        <AliasSection gameId={item.id} aliases={item.aliases} />
      </section>

      <section>
        <SectionHeader label={t('catalog.sections.actions')} />
        <ActionsSection gameId={item.id} gameName={item.primary_name} />
      </section>

      <section className={styles.danger}>
        <SectionHeader label={t('catalog.sections.merge')} />
        <MergeSection gameId={item.id} onMerged={onMerged} />
      </section>
    </Panel>
  );
}
