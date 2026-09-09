import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
type SubscribeStore = {
  email: string;
  isSubscribed: boolean;
  isAuthenticated: boolean;
  addEmail: (email: string) => void;
  removeEmail: () => void;
};

export const useSubscribeStore = create<SubscribeStore>()(
  persist(
    (set) => ({
      email: '',
      isSubscribed: false,
      isAuthenticated: false,
      addEmail: (email) => set({ email, isSubscribed: true }),
      removeEmail: () => set({ email: '', isSubscribed: false }),
    }),
    {
      name: 'giddy-subscribe-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
