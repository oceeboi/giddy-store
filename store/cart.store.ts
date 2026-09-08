import { CartStoreState } from '@/types/cart.type';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          // Unique composite key to group identical variants and sizes
          const cartItemId = `${newItem.productId}-${newItem.variantId}-${newItem.size}`;

          const existingIndex = state.items.findIndex((item) => item.cartItemId === cartItemId);

          if (existingIndex > -1) {
            // Update quantity if item variant already exists in cart
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + newItem.quantity,
            };
            return { items: updatedItems };
          }

          // Append new item entry
          return {
            items: [...state.items, { ...newItem, cartItemId }],
          };
        });
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }));
      },

      updateQuantity: (cartItemId, quantity, size_quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, quantity } : item
          ),
        }));
      },

      updateSize: (cartItemId, size, sizeId, size_quantity, variantId) => {
        set((state: any) => {
          const currentItem = state.items.find((item: any) => item.cartItemId === cartItemId);

          if (!currentItem) {
            return state;
          }

          const newCartItemId = `${currentItem.productId}-${variantId}-${size}`;
          // size_quantity is the quantity of the new size variant, we need to ensure that we don't exceed that when updating the cart item.

          const newQuantity = Math.min(currentItem.quantity, size_quantity);

          const existingItem = state.items.find(
            (item: any) => item.cartItemId === newCartItemId && item.cartItemId !== cartItemId
          );

          if (existingItem) {
            return {
              items: state.items
                .filter((item: any) => item.cartItemId !== cartItemId)
                .map((item: any) =>
                  item.cartItemId === newCartItemId
                    ? {
                        ...item,
                        quantity: newQuantity, // Update quantity to the new size's quantity
                      }
                    : item
                ),
            };
          }

          return {
            items: state.items.map((item: any) =>
              item.cartItemId === cartItemId
                ? {
                    ...item,
                    size,
                    sizeId,
                    cartItemId: newCartItemId,
                    quantity: newQuantity, // Preserve the original quantity
                  }
                : item
            ),
          };
        });
      },
      clearCart: () => set({ items: [] }),

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

      getRawSubtotal: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),
    }),
    {
      name: 'giddy-culture-cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist the items array to storage
      partialize: (state) => ({ items: state.items }),
    }
  )
);
