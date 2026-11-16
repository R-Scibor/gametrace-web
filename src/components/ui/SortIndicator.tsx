import type { CSSProperties } from 'react';

export type SortDir = 'asc' | 'desc';
export type SortOrder = SortDir;

export interface SortIndicatorProps {
  active?: boolean;
  dir: SortDir;
  className?: string;
  style?: CSSProperties;
}

export function SortIndicator({ active = true, dir, className, style }: SortIndicatorProps) {
  if (!active) return null;
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-testid="sort-indicator"
      data-dir={dir}
      className={className}
      style={{ marginLeft: 5, verticalAlign: 'middle', display: 'inline-block', ...style }}
      aria-hidden
    >
      {dir === 'asc' ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
    </svg>
  );
}
