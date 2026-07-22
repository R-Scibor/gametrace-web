import type { ReactNode } from 'react';
import styles from './MasterDetail.module.css';

interface MasterDetailProps {
  list: ReactNode;
  inspector: ReactNode;
  /**
   * Optional controls that sit above the list column only. The inspector is
   * pushed down to align with the top of the list, not the toolbar, so a
   * filter row on the left does not drag the detail pane up with it.
   */
  toolbar?: ReactNode;
}

export function MasterDetail({ list, inspector, toolbar }: MasterDetailProps) {
  return (
    <div className={toolbar ? styles.splitToolbar : styles.split}>
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
      <div className={styles.list}>{list}</div>
      <aside className={styles.inspector}>{inspector}</aside>
    </div>
  );
}
