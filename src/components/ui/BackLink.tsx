import type { MouseEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./BackLink.module.css";

interface BackLinkProps {
  to: string;
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/** Back navigation pinned to the top left of the page content, with a left arrow. */
export function BackLink({ to, children, onClick }: BackLinkProps) {
  return (
    <Link to={to} className={styles.backLink} onClick={onClick}>
      <svg
        className={styles.arrow}
        viewBox="0 0 24 24"
        width="14"
        height="14"
        aria-hidden
      >
        <path
          d="M19 12H5M11 6l-6 6 6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </Link>
  );
}
