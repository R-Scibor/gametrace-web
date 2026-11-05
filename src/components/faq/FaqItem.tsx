import { useState, useCallback, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { FaqQuestionData } from '../../types/faq';
import { FaqCallout } from './FaqCallout';
import styles from './FaqItem.module.css';

interface FaqItemProps {
  question: FaqQuestionData;
  isOpen: boolean;
  onToggle: () => void;
  onCopyLink?: (slug: string) => void;
  highlighted?: boolean;
}

export function FaqItem({
  question,
  isOpen,
  onToggle,
  onCopyLink,
  highlighted = false,
}: FaqItemProps) {
  const { t } = useTranslation('faq');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const slug = question.id;
      const url = `${window.location.origin}${window.location.pathname}#q-${slug}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).catch(() => {});
      }
      setCopied(true);
      if (onCopyLink) {
        onCopyLink(slug);
      }
      setTimeout(() => setCopied(false), 2200);
    },
    [question.id, onCopyLink],
  );

  const triggerId = `faq-trigger-${question.id}`;
  const regionId = `faq-region-${question.id}`;

  return (
    <article
      className={`${styles.item} ${isOpen ? styles.open : ''} ${highlighted ? styles.highlighted : ''}`}
      id={`q-${question.id}`}
    >
      <div className={styles.header}>
        <button
          type="button"
          id={triggerId}
          aria-expanded={isOpen}
          aria-controls={regionId}
          className={styles.trigger}
          onClick={onToggle}
        >
          <div className={styles.titleWrapper}>
            {question.badge && <span className={styles.badge}>{question.badge}</span>}
            <span className={styles.questionText}>{question.question}</span>
          </div>

          <span className={styles.chevron} aria-hidden>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
            onClick={handleCopyLink}
            title={copied ? t('linkCopied') : t('copyLink')}
            aria-label={copied ? t('linkCopied') : t('copyLink')}
          >
            {copied ? (
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        id={regionId}
        role="region"
        aria-labelledby={triggerId}
        className={styles.answerGrid}
        data-expanded={isOpen}
      >
        <div className={styles.answerInner}>
          <div className={styles.answerContent}>
            {question.answer.map((p, idx) => (
              <p key={idx} className={styles.paragraph}>
                {p}
              </p>
            ))}

            {question.steps && question.steps.length > 0 && (
              <ol className={styles.stepsList}>
                {question.steps.map((step, sIdx) => (
                  <li key={sIdx} className={styles.stepItem}>
                    <span className={styles.stepNumber} aria-hidden>
                      {String(sIdx + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.stepText}>{step}</span>
                  </li>
                ))}
              </ol>
            )}

            {question.callout && <FaqCallout callout={question.callout} />}
          </div>
        </div>
      </div>
    </article>
  );
}
