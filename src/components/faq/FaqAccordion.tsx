import { useTranslation } from 'react-i18next';
import type { FaqSectionData } from '../../types/faq';
import { FaqItem } from './FaqItem';
import styles from './FaqAccordion.module.css';

interface FaqAccordionProps {
  sections: FaqSectionData[];
  openIds: Set<string>;
  onToggleItem: (id: string) => void;
  onCopyLink?: (slug: string) => void;
  highlightedSlug?: string | null;
}

export function FaqAccordion({
  sections,
  openIds,
  onToggleItem,
  onCopyLink,
  highlightedSlug,
}: FaqAccordionProps) {
  const { t } = useTranslation('faq');

  return (
    <div className={styles.container}>
      {sections.map((section) => {
        if (!section.questions.length) return null;

        return (
          <section
            key={section.id}
            id={section.id}
            className={styles.section}
            aria-labelledby={`heading-${section.id}`}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.titleRow}>
                <h2 id={`heading-${section.id}`} className={styles.sectionTitle}>
                  {section.title}
                </h2>
                <span
                  className={styles.countBadge}
                  aria-label={t('questionsCountAria', { count: section.questions.length })}
                >
                  {section.questions.length}
                </span>
              </div>
              {section.description && (
                <p className={styles.sectionDesc}>{section.description}</p>
              )}
              <div className={styles.sectionDivider} aria-hidden />
            </div>

            <div className={styles.questionList} role="list">
              {section.questions.map((q) => (
                <FaqItem
                  key={q.id}
                  question={q}
                  isOpen={openIds.has(q.id)}
                  onToggle={() => onToggleItem(q.id)}
                  onCopyLink={onCopyLink}
                  highlighted={highlightedSlug === q.id}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
