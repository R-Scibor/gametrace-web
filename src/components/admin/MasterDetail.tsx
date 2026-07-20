import type { ReactNode } from 'react';
import styles from './MasterDetail.module.css';

interface MasterDetailProps {
  list: ReactNode;
  inspector: ReactNode;
}

export function MasterDetail({ list, inspector }: MasterDetailProps) {
  return (
    <div className={styles.split}>
      <div className={styles.list}>{list}</div>
      <aside className={styles.inspector}>{inspector}</aside>
    </div>
  );
}
