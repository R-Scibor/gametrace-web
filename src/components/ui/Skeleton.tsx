import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  height?: number | string;
  width?: number | string;
}

export function Skeleton({ className, style, height, width }: SkeletonProps) {
  return <div className={[styles.skeleton, className].filter(Boolean).join(' ')} style={{ ...style, height, width }} />;
}
