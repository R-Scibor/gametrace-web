import { useTranslation } from 'react-i18next';
import type { FaqSectionData } from '../../types/faq';
import styles from './FaqCategoryNav.module.css';

interface FaqCategoryNavProps {
  sections: FaqSectionData[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function FaqCategoryNav({
  sections,
  selectedCategoryId,
  onSelectCategory,
}: FaqCategoryNavProps) {
  const { t } = useTranslation('faq');

  return (
    <nav className={styles.nav} aria-label={t('allCategories')}>
      <div className={styles.scrollContainer}>
        <button
          type="button"
          className={`${styles.pill} ${selectedCategoryId === null ? styles.active : ''}`}
          onClick={() => onSelectCategory(null)}
          aria-pressed={selectedCategoryId === null}
        >
          <span>{t('allCategories')}</span>
        </button>

        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`${styles.pill} ${selectedCategoryId === section.id ? styles.active : ''}`}
            onClick={() => onSelectCategory(section.id)}
            aria-pressed={selectedCategoryId === section.id}
          >
            <span>{section.title}</span>
            <span className={styles.count} aria-hidden>
              {section.questions.length}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
