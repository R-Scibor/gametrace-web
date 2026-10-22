import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalCoversStore } from '../../store/localCoversStore';
import { useToastStore } from '../../store/toastStore';
import { Modal, Button } from '../ui';
import { Cover } from '../Cover';
import type { Game } from '../../types/api';
import styles from './CoverDialog.module.css';

interface CoverDialogProps {
  game: Game;
  open: boolean;
  onClose: () => void;
}

export function CoverDialog({ game, open, onClose }: CoverDialogProps) {
  const { t } = useTranslation('gameDetail');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  const localCover = useLocalCoversStore((s) => s.covers[game.id]);
  const setCover = useLocalCoversStore((s) => s.setCover);
  const clearCover = useLocalCoversStore((s) => s.clearCover);
  const pushToast = useToastStore((s) => s.pushToast);

  const hasLocalCover = Boolean(localCover);

  const handleFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPending(true);
    try {
      await setCover(game.id, file);
      pushToast({ type: 'success', message: t('coverDialog.toasts.saved') });
    } catch {
      pushToast({ type: 'error', message: t('coverDialog.toasts.saveFailed') });
    } finally {
      setPending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    clearCover(game.id);
    pushToast({ type: 'success', message: t('coverDialog.toasts.restored') });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="cover-dialog-title"
      className={styles.dialog}
    >
      <div className={styles.content}>
        <h2 id="cover-dialog-title" className={styles.title}>
          {t('coverDialog.title')}
        </h2>

        <div className={styles.cardsGrid}>
          {/* Your cover */}
          <div
            className={[styles.card, hasLocalCover ? styles.cardActive : styles.cardMuted].join(' ')}
            aria-current={hasLocalCover ? 'true' : undefined}
          >
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{t('coverDialog.yourCover')}</h3>
              {hasLocalCover && (
                <span className={styles.inUseBadge}>{t('coverDialog.inUse')}</span>
              )}
            </div>
            <div className={styles.previewWrapper}>
              <Cover
                gameId={game.id}
                placeholderChar={game.primary_name}
                className={styles.previewCover}
              />
              {!hasLocalCover && (
                <span className={styles.notSetOverlay}>{t('coverDialog.notSet')}</span>
              )}
            </div>
            <p className={styles.cardDesc}>{t('coverDialog.yourCoverDesc')}</p>
          </div>

          {/* Default cover */}
          <div
            className={[styles.card, !hasLocalCover ? styles.cardActive : styles.cardMuted].join(' ')}
            aria-current={!hasLocalCover ? 'true' : undefined}
          >
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{t('coverDialog.defaultCover')}</h3>
              {!hasLocalCover && (
                <span className={styles.inUseBadge}>{t('coverDialog.inUse')}</span>
              )}
            </div>
            <div className={styles.previewWrapper}>
              <Cover
                coverImageUrl={game.cover_image_url}
                placeholderChar={game.primary_name}
                className={styles.previewCover}
              />
            </div>
            <p className={styles.cardDesc}>
              {game.cover_image_url
                ? t('coverDialog.defaultCoverDesc')
                : t('coverDialog.defaultCoverEmptyDesc')}
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.buttonGroup}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={styles.hiddenInput}
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => fileInputRef.current?.click()}
            >
              {pending ? t('coverDialog.saving') : t('coverDialog.chooseImage')}
            </Button>
            {hasLocalCover && (
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={handleClear}
              >
                {game.cover_image_url
                  ? t('coverDialog.resetDefault')
                  : t('coverDialog.removeCover')}
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('coverDialog.close')}
            </Button>
          </div>
          <p className={styles.hint}>{t('coverDialog.hint')}</p>
        </div>
      </div>
    </Modal>
  );
}
