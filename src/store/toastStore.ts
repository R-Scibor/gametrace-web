import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  to: string;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

interface ToastStore {
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }));
    // Toasts carrying an action (e.g. the 409 conflict deep link) are the
    // payoff of that feature and must stay until the user dismisses them
    // or clicks through, not vanish on a timer.
    if (toast.action) return;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 5000);
  },
  dismissToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  }))
}));
