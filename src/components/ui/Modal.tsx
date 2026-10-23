import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  role?: 'dialog' | 'alertdialog';
  children: ReactNode;
  /**
   * Extra class applied to the dialog box, appended after the base `.dialog`
   * styles. Use it to override `max-width` (the default is 420px) for
   * dialogs whose body needs more room, e.g. a scrollable candidate list.
   */
  className?: string;
  /**
   * Extra class applied to the full-screen overlay. Use it to re-center the
   * dialog over a narrower region than the viewport, e.g. the app content
   * column to the right of the sidebar.
   */
  overlayClassName?: string;
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function Modal({
  open,
  onClose,
  labelledBy,
  role = 'dialog',
  children,
  className,
  overlayClassName,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Captured on open so focus can be handed back to whatever opened the dialog.
  const restoreRef = useRef<HTMLElement | null>(null);

  // Consumers pass `onClose` as an inline arrow, so it has a fresh identity on
  // every render. Reading it through a ref keeps the effect below keyed on
  // `open` alone: depending on `onClose` directly would tear down and re-run the
  // effect each render, stealing focus back to the first element mid-typing.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);

    // Fall back to the dialog box itself so focus never stays on the page
    // behind, even for a dialog whose body is entirely static content.
    const first = focusables()[0] ?? dialogRef.current;
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === firstItem || active === dialogRef.current)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && active === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      restoreRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  // Portal to <body>: rendered in place, the overlay was trapped in the page
  // content's stacking context (z-index: 1), so the sticky top bar (z-index: 10)
  // painted above the backdrop instead of being dimmed.
  return createPortal(
    <div
      className={[styles.overlay, overlayClassName].filter(Boolean).join(' ')}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={[styles.dialog, className].filter(Boolean).join(' ')}
        onClick={(e) => e.stopPropagation()}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
