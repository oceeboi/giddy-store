export interface CartItemOption {
  optionId: string; // e.g., "size" or "color"
  valueId: string; // e.g., "xl" or "red"
}

export interface CartItem {
  cartItemId: string; // Composite unique key: `${productId}-${variantId}-${size}`
  productId: string;
  variantId: string;
  size: string;
  sizeId: string;
  color: string;
  colorId: string;
  sku: string;
  quantity: number;
  // Metadata for optimistic UI rendering before backend price verification
  title: string;
  price: number;
  image: string;
  slug: Required<string>; // Product slug for navigation
}

export interface CartStoreState {
  items: CartItem[];

  // Actions
  addItem: (item: Omit<CartItem, 'cartItemId'>) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number, size_quantity: number) => void;
  clearCart: () => void;
  updateSize: (
    cartItemId: string,
    size: string,
    sizeId: string,
    size_quantity: number,
    variantId: string
  ) => void;

  // Computed helpers
  getTotalItems: () => number;
  getRawSubtotal: () => number;
}
