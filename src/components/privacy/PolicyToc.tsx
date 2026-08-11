import { useEffect, useState } from 'react';
import type { PolicySection } from '../../lib/privacyPolicy';
import styles from './PolicyToc.module.css';

interface Props {
  sections: PolicySection[];
  label: string;
}

/** Sticky table of contents with a scroll spy. Plain `#id` anchors rather than
 *  router links: these are same-page jumps, and they keep working (and stay
 *  copy-pasteable as deep links) even if the observer never fires. */
export function PolicyToc({ sections, label }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Topmost intersecting heading wins, so scrolling down advances the
        // highlight one section at a time instead of jumping to whichever
        // entry happened to fire last.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <nav className={styles.toc} aria-label={label}>
      <p className={styles.tocLabel}>{label}</p>
      <ol className={styles.tocList}>
        {sections.map((section) => (
          <li key={section.id}>
            <a
              className={section.id === activeId ? styles.tocLinkActive : styles.tocLink}
              href={`#${section.id}`}
              aria-current={section.id === activeId ? 'true' : undefined}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
