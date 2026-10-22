import { useEffect, useRef, useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalCoversStore } from '../../store/localCoversStore';
import { useToastStore } from '../../store/toastStore';
import type { Game } from '../../types/api';
import styles from './GameActionsMenu.module.css';

interface GameActionsMenuProps {
  game: Game;
  canAccept: boolean;
  onOpenCoverDialog: () => void;
  onOpenReportDuplicate: () => void;
  prefMut: {
    mutate: (vars: { is_ignored?: boolean; is_accepted?: boolean }) => void;
    isPending: boolean;
  };
}

interface MenuItemConfig {
  key: string;
  label: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
  isWarning?: boolean;
}

export function GameActionsMenu({
  game,
  canAccept,
  onOpenCoverDialog,
  onOpenReportDuplicate,
  prefMut,
}: GameActionsMenuProps) {
  const { t } = useTranslation('gameDetail');
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const triggerId = useId();
  const focusLastOnOpen = useRef(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const localCover = useLocalCoversStore((s) => s.covers[game.id]);
  const clearCover = useLocalCoversStore((s) => s.clearCover);
  const pushToast = useToastStore((s) => s.pushToast);

  const hasLocalCover = Boolean(localCover);

  const items: MenuItemConfig[] = [];

  if (canAccept) {
    items.push({
      key: 'accept',
      label: t('menu.accept'),
      desc: t('menu.acceptDesc'),
      onClick: () => prefMut.mutate({ is_ignored: false, is_accepted: true }),
      disabled: prefMut.isPending,
    });
  }

  if (game.is_ignored) {
    items.push({
      key: 'restore',
      label: t('menu.restore'),
      desc: t('menu.restoreDesc'),
      onClick: () => prefMut.mutate({ is_ignored: false }),
      disabled: prefMut.isPending,
    });
  } else {
    items.push({
      key: 'ignore',
      label: t('menu.ignore'),
      desc: t('menu.ignoreDesc'),
      onClick: () => prefMut.mutate({ is_ignored: true }),
      disabled: prefMut.isPending,
      isWarning: true,
    });
  }

  items.push({
    key: 'changeCover',
    label: t('menu.changeCover'),
    desc: t('menu.changeCoverDesc'),
    onClick: onOpenCoverDialog,
  });

  if (hasLocalCover) {
    if (game.cover_image_url) {
      items.push({
        key: 'restoreDefaultCover',
        label: t('menu.restoreDefaultCover'),
        desc: t('menu.restoreDefaultCoverDesc'),
        onClick: () => {
          clearCover(game.id);
          pushToast({ type: 'success', message: t('coverDialog.toasts.restored') });
        },
      });
    } else {
      items.push({
        key: 'removeCover',
        label: t('menu.removeCover'),
        desc: t('menu.removeCoverDesc'),
        onClick: () => {
          clearCover(game.id);
          pushToast({ type: 'success', message: t('coverDialog.toasts.removed') });
        },
      });
    }
  }

  items.push({
    key: 'reportDuplicate',
    label: t('menu.reportDuplicate'),
    desc: t('menu.reportDuplicateDesc'),
    onClick: onOpenReportDuplicate,
  });

  // When opening, focus the first item
  useEffect(() => {
    if (isOpen) {
      const menuItems = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      const target = focusLastOnOpen.current
        ? menuItems?.[menuItems.length - 1]
        : menuItems?.[0];
      focusLastOnOpen.current = false;
      target?.focus();
    }
  }, [isOpen]);

  // Click outside and global Escape handling
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (e.key === 'Tab') {
      setIsOpen(false);
      return;
    }

    const validItems = itemRefs.current.slice(0, items.length);
    const activeIndex = validItems.findIndex((el) => el === document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = activeIndex === -1 ? 0 : (activeIndex + 1) % items.length;
      validItems[nextIndex]?.focus();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
      validItems[prevIndex]?.focus();
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      validItems[0]?.focus();
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      validItems[items.length - 1]?.focus();
      return;
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key === 'ArrowUp') {
      e.preventDefault();
      focusLastOnOpen.current = true;
      setIsOpen(true);
      return;
    }
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={t('menu.trigger')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        id={triggerId}
        aria-controls={menuId}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
      >
        ⋯
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          className={styles.menu}
          onKeyDown={handleMenuKeyDown}
        >
          <div className={styles.header} role="none">
            {t('menu.header')}
          </div>
          {items.map((item, index) => (
            <button
              key={item.key}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              type="button"
              role="menuitem"
              className={styles.item}
              tabIndex={-1}
              aria-disabled={item.disabled || undefined}
              onClick={() => {
                if (item.disabled) return;
                // Hand focus back to the trigger before the item unmounts, so a
                // dialog opened by the item restores focus there on close.
                triggerRef.current?.focus();
                setIsOpen(false);
                item.onClick();
              }}
            >
              <span
                className={
                  item.isWarning ? styles.itemLabelWarning : styles.itemLabel
                }
              >
                {item.label}
              </span>
              <span className={styles.itemDesc}>{item.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
