import { create } from 'zustand';

// Non-persisted prompt shown after a Discord login that returned
// needs_server_join. AppLayout renders a single host for it, so it survives
// the navigation from the callback screen into the app.
type ServerJoinState = {
  visible: boolean;
  show: () => void;
  hide: () => void;
};

export const useServerJoinStore = create<ServerJoinState>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
