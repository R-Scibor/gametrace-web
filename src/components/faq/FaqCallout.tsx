import { useTranslation } from 'react-i18next';
import type { FaqCalloutData } from '../../types/faq';
import styles from './FaqCallout.module.css';

interface FaqCalloutProps {
  callout: FaqCalloutData;
}

export function FaqCallout({ callout }: FaqCalloutProps) {
  const { t } = useTranslation('faq');
  const typeLabel = t(`calloutLabels.${callout.type}`, {
    defaultValue: callout.type.toUpperCase(),
  });

  return (
    <aside
      className={`${styles.callout} ${styles[callout.type]}`}
      role="note"
      aria-label={callout.title || typeLabel}
    >
      <div className={styles.header}>
        <span className={styles.badge}>{typeLabel}</span>
        {callout.title && <strong className={styles.title}>{callout.title}</strong>}
      </div>
      <p className={styles.text}>{callout.text}</p>
    </aside>
  );
}
