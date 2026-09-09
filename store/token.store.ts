import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type TokenStore = {
  expireAt: string | null;
  token: string;
  isToken: boolean;

  addToken: (token: string, expiresInMs?: number) => void;
  removeToken: () => void;
  checkTokenExpiration: () => void;
};

const DEFAULT_TOKEN_LIFETIME = 14 * 24 * 60 * 60 * 1000; // 14 days

export const useTokenStore = create<TokenStore>()(
  persist(
    (set, get) => ({
      expireAt: null,
      token: '',
      isToken: false,

      addToken: (token, expiresInMs = DEFAULT_TOKEN_LIFETIME) => {
        const expireAt = new Date(Date.now() + expiresInMs).toISOString();

        set({
          token,
          expireAt,
          isToken: true,
        });
      },

      removeToken: () => {
        set({
          token: '',
          expireAt: null,
          isToken: false,
        });
      },

      checkTokenExpiration: () => {
        const { token, expireAt } = get();

        if (!token || !expireAt) {
          return;
        }

        const hasExpired = new Date(expireAt).getTime() <= Date.now();

        if (hasExpired) {
          get().removeToken();
        }
      },
    }),
    {
      name: 'giddy-cart-token-storage',

      storage: createJSONStorage(() => localStorage),

      onRehydrateStorage: () => (state) => {
        state?.checkTokenExpiration();
      },
    }
  )
);
