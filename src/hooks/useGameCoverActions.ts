import { useTranslation } from 'react-i18next';
import { useLocalCoversStore } from '../store/localCoversStore';
import { useToastStore } from '../store/toastStore';
import type { Game } from '../types/api';

/**
 * Drops the locally stored cover and tells the user what happened: the catalog
 * cover comes back ("restored") or there is no cover any more ("removed").
 */
export function useGameCoverActions(game: Pick<Game, 'id' | 'cover_image_url'>) {
  const { t } = useTranslation('gameDetail');
  const clearCover = useLocalCoversStore((s) => s.clearCover);
  const pushToast = useToastStore((s) => s.pushToast);

  const clearLocalCover = () => {
    clearCover(game.id);
    pushToast({
      type: 'success',
      message: game.cover_image_url
        ? t('coverDialog.toasts.restored')
        : t('coverDialog.toasts.removed'),
    });
  };

  return { clearLocalCover };
}
