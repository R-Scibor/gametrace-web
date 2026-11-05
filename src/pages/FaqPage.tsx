import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { setActiveLanguage } from '../i18n';
import type { Language } from '../i18n/resolve';
import { LanguageSelect } from '../components/ui/LanguageSelect';
import { Button } from '../components/ui';
import { FaqSearch } from '../components/faq/FaqSearch';
import { FaqCategoryNav } from '../components/faq/FaqCategoryNav';
import { FaqAccordion } from '../components/faq/FaqAccordion';
import type { FaqSectionData, FaqQuestionData } from '../types/faq';
import { getDiscordServerJoinUrl } from '../lib/discordInvites';
import styles from './FaqPage.module.css';

const SERVER_JOIN_URL = getDiscordServerJoinUrl();

function matchesQuestion(q: FaqQuestionData, qLower: string): boolean {
  if (q.question.toLowerCase().includes(qLower)) return true;
  if (q.answer.some((p) => p.toLowerCase().includes(qLower))) return true;
  if (q.steps && q.steps.some((s) => s.toLowerCase().includes(qLower))) return true;
  if (q.callout && q.callout.text.toLowerCase().includes(qLower)) return true;
  if (q.keywords && q.keywords.some((k) => k.toLowerCase().includes(qLower))) return true;
  if (q.badge && q.badge.toLowerCase().includes(qLower)) return true;
  return false;
}

export function FaqPage() {
  const { t, i18n } = useTranslation('faq');
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const language = (i18n.language === 'en' ? 'en' : 'pl') as Language;

  // Extract hash slug directly from location.hash (pure derivation)
  const highlightedSlug = useMemo(() => {
    return location.hash.startsWith('#q-') ? location.hash.replace('#q-', '') : null;
  }, [location.hash]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize open IDs with any hash slug present at mount
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#q-')) {
      initial.add(window.location.hash.replace('#q-', ''));
    }
    return initial;
  });

  // Set document title
  useEffect(() => {
    const prev = document.title;
    document.title = t('documentTitle');
    return () => {
      document.title = prev;
    };
  }, [t]);

  // Load raw sections from i18n
  const rawSections = useMemo(() => {
    const data = t('sections', { returnObjects: true });
    return Array.isArray(data) ? (data as FaqSectionData[]) : [];
  }, [t]);

  // Deep-link scrolling side effect (pure DOM side effect, no setState inside)
  useEffect(() => {
    if (highlightedSlug) {
      const el = document.getElementById(`q-${highlightedSlug}`);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedSlug]);

  // Total count of all questions across sections
  const totalQuestionsCount = useMemo(() => {
    return rawSections.reduce((acc, s) => acc + s.questions.length, 0);
  }, [rawSections]);

  // Filter sections by category and search query
  const filteredSections = useMemo(() => {
    const qLower = searchQuery.trim().toLowerCase();

    return rawSections
      .filter((section) => {
        if (selectedCategory && section.id !== selectedCategory) {
          if (highlightedSlug && section.questions.some((q) => q.id === highlightedSlug)) {
            return true;
          }
          return false;
        }
        return true;
      })
      .map((section) => {
        if (!qLower) return section;

        const matchingQuestions = section.questions.filter((q) => matchesQuestion(q, qLower));

        return {
          ...section,
          questions: matchingQuestions,
        };
      })
      .filter((section) => section.questions.length > 0);
  }, [rawSections, selectedCategory, searchQuery, highlightedSlug]);

  const filteredMatchesCount = useMemo(() => {
    return filteredSections.reduce((acc, s) => acc + s.questions.length, 0);
  }, [filteredSections]);

  // Event handler for search changes: expands matching questions directly on user input
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      const qLower = query.trim().toLowerCase();
      if (qLower) {
        const allMatchingIds = new Set<string>();
        rawSections.forEach((s) => {
          s.questions.forEach((q) => {
            if (matchesQuestion(q, qLower)) {
              allMatchingIds.add(q.id);
            }
          });
        });
        setOpenIds(allMatchingIds);
      }
    },
    [rawSections],
  );

  const handleToggleItem = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    const allIds = new Set<string>();
    filteredSections.forEach((s) => {
      s.questions.forEach((q) => allIds.add(q.id));
    });
    setOpenIds(allIds);
  }, [filteredSections]);

  const handleCollapseAll = useCallback(() => {
    setOpenIds(new Set());
  }, []);

  const handleCopyLink = useCallback(
    (slug: string) => {
      setToastMessage(t('linkCopied'));
      setTimeout(() => setToastMessage(null), 2500);
      setOpenIds((prev) => {
        const next = new Set(prev);
        next.add(slug);
        return next;
      });
      window.history.replaceState(null, '', `#q-${slug}`);
    },
    [t],
  );

  const effectiveOpenIds = useMemo(() => {
    if (!highlightedSlug) return openIds;
    if (openIds.has(highlightedSlug)) return openIds;
    const next = new Set(openIds);
    next.add(highlightedSlug);
    return next;
  }, [openIds, highlightedSlug]);

  const areAllOpen = useMemo(() => {
    if (filteredMatchesCount === 0) return false;
    for (const s of filteredSections) {
      for (const q of s.questions) {
        if (!effectiveOpenIds.has(q.id)) return false;
      }
    }
    return true;
  }, [filteredSections, effectiveOpenIds, filteredMatchesCount]);

  return (
    <div className={styles.page}>
      <div className={styles.grain} aria-hidden />
      <div className={styles.glow} aria-hidden />

      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Link
              to={isAuthenticated ? '/' : '/welcome'}
              className={styles.backLink}
            >
              {t('backHome')}
            </Link>
            <div className={styles.langRow}>
              <LanguageSelect
                value={language}
                onChange={(lng) => setActiveLanguage(lng)}
                aria-label={t('languageAria')}
              />
            </div>
          </div>

          <p className={styles.eyebrow}>
            <span className={styles.eyebrowPulse} aria-hidden />
            {t('eyebrow')}
          </p>
          <h1 className={styles.title}>
            {t('title')}
            <span className={styles.titleAccent}>.</span>
          </h1>
          <p className={styles.lead}>{t('lead')}</p>
        </header>

        <section className={styles.controlsSection} aria-label={t('categoryFilterAria')}>
          <div className={styles.searchBar}>
            <FaqSearch
              value={searchQuery}
              onChange={handleSearchChange}
              matchesCount={filteredMatchesCount}
              totalCount={totalQuestionsCount}
            />
          </div>

          <FaqCategoryNav
            sections={rawSections}
            selectedCategoryId={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          <div className={styles.actionsBar}>
            <span className={styles.summaryCount}>
              {selectedCategory
                ? t('questionsInCategory', { count: filteredMatchesCount })
                : t('questionsTotal', { count: filteredMatchesCount })}
            </span>

            {filteredMatchesCount > 0 && (
              <button
                type="button"
                className={styles.expandCollapseBtn}
                onClick={areAllOpen ? handleCollapseAll : handleExpandAll}
              >
                {areAllOpen ? t('collapseAll') : t('expandAll')}
              </button>
            )}
          </div>
        </section>

        <main className={styles.main}>
          {filteredSections.length === 0 ? (
            <div className={styles.emptyState} role="status">
              <div className={styles.emptyIcon} aria-hidden>
                <svg
                  viewBox="0 0 24 24"
                  width="36"
                  height="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>
                {t('noMatches', { query: searchQuery })}
              </h3>
              <p className={styles.emptyText}>{t('noMatchesHint')}</p>
              <Button
                variant="secondary"
                className={styles.resetBtn}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                {t('clearFilters')}
              </Button>
            </div>
          ) : (
            <FaqAccordion
              sections={filteredSections}
              openIds={effectiveOpenIds}
              onToggleItem={handleToggleItem}
              onCopyLink={handleCopyLink}
              highlightedSlug={highlightedSlug}
            />
          )}
        </main>

        <aside className={styles.supportCard} aria-label={t('supportAria')}>
          <div className={styles.supportCopy}>
            <h3 className={styles.supportTitle}>{t('supportBannerTitle')}</h3>
            <p className={styles.supportText}>{t('supportBannerText')}</p>
          </div>
          <div className={styles.supportActions}>
            {SERVER_JOIN_URL && (
              <Button
                className={styles.discordBtn}
                onClick={() => window.open(SERVER_JOIN_URL, '_blank', 'noopener,noreferrer')}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                  width="18"
                  height="18"
                >
                  <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.011c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.245.198.372.292a.077.077 0 0 1-.006.127c-.598.35-1.22.642-1.873.892a.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.077.077 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.42 0 1.332-.955 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.42 0 1.332-.946 2.418-2.157 2.418Z" />
                </svg>
                {t('joinDiscord')}
              </Button>
            )}
            <Link to="/privacy" className={styles.privacyLink}>
              {t('viewPrivacy')} →
            </Link>
          </div>
        </aside>
      </div>

      <footer className={styles.footer} role="contentinfo">
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <span className={styles.footerDot} aria-hidden />
            <span>GAMETRACE FAQ</span>
          </div>
          <span className={styles.footerVersion}>© 2026 Rafał Ścibor</span>
        </div>
      </footer>

      {toastMessage && (
        <div className={styles.toast} role="status" aria-live="polite">
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
