import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type LocalCoversState = {
  covers: Record<number, string>;
  setCover: (gameId: number, file: File) => Promise<void>;
  clearCover: (gameId: number) => void;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const useLocalCoversStore = create<LocalCoversState>()(
  persist(
    (set, get) => ({
      covers: {},

      setCover: async (gameId, file) => {
        const dataUrl = await fileToDataUrl(file);
        set({ covers: { ...get().covers, [gameId]: dataUrl } });
      },

      clearCover: (gameId) => {
        const next = { ...get().covers };
        delete next[gameId];
        set({ covers: next });
      },
    }),
    {
      name: 'local-covers-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ covers: state.covers }),
    },
  ),
);