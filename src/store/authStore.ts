import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PendingDeletion } from '../types/api';

type User = {
  discordId: string;
  username: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  previewDismissed: boolean;
  pendingDeletion: PendingDeletion | null;
  login: (
    token: string,
    user: User,
    isAdmin?: boolean,
    pendingDeletion?: PendingDeletion | null,
  ) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setPreviewDismissed: (dismissed: boolean) => void;
  setPendingDeletion: (pendingDeletion: PendingDeletion | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAdmin: false,
      isAuthenticated: false,
      previewDismissed: false,
      pendingDeletion: null,

      login: (token, user, isAdmin = false, pendingDeletion = null) =>
        set({ token, user, isAdmin, isAuthenticated: true, pendingDeletion }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      setPreviewDismissed: (previewDismissed) => set({ previewDismissed }),
      setPendingDeletion: (pendingDeletion) => set({ pendingDeletion }),
      logout: () =>
        set({
          token: null,
          user: null,
          isAdmin: false,
          isAuthenticated: false,
          previewDismissed: false,
          pendingDeletion: null,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAdmin: state.isAdmin,
        isAuthenticated: state.isAuthenticated,
        previewDismissed: state.previewDismissed,
        pendingDeletion: state.pendingDeletion,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          useAuthStore.persist.clearStorage();
        }
        // isAdmin is restored optimistically so the sidebar link does not flicker.
        // useProfile overwrites it with the server's answer once /profile/me lands,
        // and AdminRoute gates on that query rather than on this flag.
      },
    },
  ),
);