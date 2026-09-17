import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type WishListItem = {
  whishlist: string; // Composite unique key: `${productId}-${variantId}-${size}`
  productId: string;

  // Metadata for optimistic UI rendering before backend price verification
  title: string;
  price: number;
  image: string;
  slug: string; // Product slug for navigation
};

type WishlistStore = {
  products: WishListItem[];
  hasItem: (whishlistKey: string) => boolean;
  addItem: (product: WishListItem) => Promise<void>;
  removeItem: (whishlistKey: string) => Promise<void>;
  toggleItem: (product: WishListItem) => Promise<boolean>;
  clear: () => Promise<void>;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      products: [],

      hasItem: (whishlistKey: string) => {
        return get().products.some((item) => item.whishlist === whishlistKey);
      },

      addItem: async (product: WishListItem) => {
        set((state) => {
          const exists = state.products.some((item) => item.whishlist === product.whishlist);
          if (exists) return state;

          return {
            products: [...state.products, product],
          };
        });
      },

      removeItem: async (whishlistKey: string) => {
        set((state) => ({
          products: state.products.filter((item) => item.whishlist !== whishlistKey),
        }));
      },

      toggleItem: async (product: WishListItem) => {
        const exists = get().hasItem(product.whishlist);

        if (exists) {
          await get().removeItem(product.whishlist);
          return false;
        } else {
          await get().addItem(product);
          return true;
        }
      },

      clear: async () => {
        set({ products: [] });
      },
    }),
    {
      name: 'giddy-culture-wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
