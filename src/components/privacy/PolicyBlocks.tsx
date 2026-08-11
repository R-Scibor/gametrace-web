import { Link } from 'react-router-dom';
import type { PolicyBlock } from '../../lib/privacyPolicy';
import styles from './PolicyBlocks.module.css';

/** Renders one policy block. Content arrives already validated and
 *  interpolated by parsePolicySections, so this stays purely presentational. */
function Block({ block }: { block: PolicyBlock }) {
  switch (block.type) {
    case 'p':
      return <p className={styles.paragraph}>{block.text}</p>;

    case 'note':
      return <p className={styles.note}>{block.text}</p>;

    case 'ul':
      return (
        <ul className={styles.list}>
          {block.items.map((item, index) => (
            <li key={`${index}-${item}`}>{item}</li>
          ))}
        </ul>
      );

    case 'table':
      // Wrapper scrolls on its own so a wide recipients/retention table never
      // forces the whole page to scroll horizontally on a phone.
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
