import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  discordId: string;
  username: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (token: string, user: User, isAdmin?: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAdmin: false,
      isAuthenticated: false,
      hasHydrated: false,

      login: (token, user, isAdmin = false) =>
        set({ token, user, isAdmin, isAuthenticated: true }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      logout: () => set({ token: null, user: null, isAdmin: false, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAdmin: state.isAdmin,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true });
      },
    },
  ),
);