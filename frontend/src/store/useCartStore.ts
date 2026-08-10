import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductItem, CartItem } from '@/types/shopping';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  appliedCoupon: string | null;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: ProductItem, quantity?: number, openDrawer?: boolean) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  getTotalCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      applyCoupon: (code) => set({ appliedCoupon: code, isOpen: true }),
      removeCoupon: () => set({ appliedCoupon: null }),

      addItem: (product, quantity = 1, openDrawer = false) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item: any) => (item.product?.id || item.id) === product.id
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex].quantity += quantity;
            return {
              items: updatedItems,
              ...(openDrawer ? { isOpen: true } : {}),
            };
          }

          return {
            items: [...state.items, { product, quantity }],
            ...(openDrawer ? { isOpen: true } : {}),
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(
            (item: any) => (item.product?.id || item.id) !== productId
          ),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item: any) =>
            (item.product?.id || item.id) === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalCount: () => {
        return get().items.reduce((total, item) => total + (item.quantity || 1), 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item: any) => {
          const price = item.product?.salePrice || item.product?.price || item.price || 0;
          return sum + price * (item.quantity || 1);
        }, 0);
      },
    }),
    {
      name: 'dohs_sheba_cart_storage',
      partialize: (state) => ({ items: state.items, appliedCoupon: state.appliedCoupon }),
    }
  )
);
