import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { PolicyBlock } from '../../lib/privacyPolicy';
import styles from './PolicyBlocks.module.css';

// Domain is one-or-more dot-separated labels, each a maximal run of
// [\w-]. Deliberately NOT `[\w-]+\.[\w.-]+` (or any pattern ending the
// domain in a greedy dot-inclusive class): that swallows sentence-final
// punctuation, e.g. "...write to a@b.com. Then wait." would previously
// match "a@b.com." and produce a broken `mailto:a@b.com.` link.
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

/** Body text may contain a plain email address (interpolated from
 *  {{email}}). Splits it out into a clickable mailto: link so the address
 *  isn't just inert text in a legal notice. */
function linkifyEmails(text: string): ReactNode[] {
  const parts = text.split(EMAIL_PATTERN);
  const matches = text.match(EMAIL_PATTERN) ?? [];
  if (matches.length === 0) return [text];

  const nodes: ReactNode[] = [];
  parts.forEach((part, index) => {
    if (part) nodes.push(part);
    const email = matches[index];
    if (email) {
      nodes.push(
        <a key={`${email}-${index}`} className={styles.emailLink} href={`mailto:${email}`}>
          {email}
        </a>,
      );
    }
  });
  return nodes;
}

/** Renders one policy block. Content arrives already validated and
 *  interpolated by parsePolicySections; the only parsing done here is
 *  `linkifyEmails` picking a plain address out of `p`/`note` text so it can
 *  become an anchor.
 *
 *  That anchor's `mailto:` href is built directly from the regex match,
 *  bypassing `isSafeHref` in lib/privacyPolicy.ts — otherwise the single
 *  chokepoint for every href rendered on this page (the `links` block case
 *  below always routes through it). This is safe because EMAIL_PATTERN's
 *  character classes (`[\w.+-]` and `[\w-]`) cannot contain `:`, so the
 *  match can never itself be a URL scheme like `javascript:`; and because
 *  the matched text is passed to React as anchor children, not raw HTML, so
 *  it is escaped like any other text node. */
function Block({ block }: { block: PolicyBlock }) {
  switch (block.type) {
    case 'p':
      return <p className={styles.paragraph}>{linkifyEmails(block.text)}</p>;

    case 'note':
      return <p className={styles.note}>{linkifyEmails(block.text)}</p>;

    case 'ul':
      // Deliberately not run through linkifyEmails: today every {{email}}
      // in the locale content lives inside a `p`/`note` block. If a future
      // edit moves the address into a list item, it will render as inert
      // text here — see PolicyBlocks.test.tsx's "does not linkify list
      // items or table cells" case, which documents this invariant.
      return (
        <ul className={styles.list}>
          {block.items.map((item, index) => (
            <li key={`${index}-${item}`}>{item}</li>
          ))}
        </ul>
      );

    case 'table':
      // Wrapper scrolls on its own so a wide recipients/retention table never
      // forces the whole page to scroll horizontally on a phone. Cells are
      // also not run through linkifyEmails — same caveat as the `ul` case.
      return (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {block.headers.map((header) => (
                  <th key={header} scope="col">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, i) => (
                    <td key={`${block.headers[i]}-${cell}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'links':
      return (
        <ul className={styles.links}>
          {block.items.map((item, index) => (
            <li key={`${index}-${item.href}`}>
              {item.href.startsWith('/') ? (
                <Link className={styles.link} to={item.href}>
                  {item.label}
                </Link>
              ) : (
                <a
                  className={styles.link}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      );
  }
}

export function PolicyBlocks({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        <Block key={`${block.type}-${index}`} block={block} />
      ))}
    </>
  );
}
