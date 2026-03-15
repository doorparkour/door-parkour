import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  variantId: string;
  productId: string;
  name: string;
  price_cents: number;
  image_url: string | null;
  quantity: number;
  inventory: number;
  on_demand: boolean;
  size: string | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalCents: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(item) {
        const existing = get().items.find((i) => i.variantId === item.variantId);
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          }));
        } else {
          set((s) => ({ items: [...s.items, { ...item, quantity: 1 }] }));
        }
      },

      removeItem(variantId) {
        set((s) => ({
          items: s.items.filter((i) => i.variantId !== variantId),
        }));
      },

      updateQuantity(variantId, quantity) {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart() {
        set({ items: [] });
      },

      totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      totalCents() {
        return get().items.reduce(
          (sum, i) => sum + i.price_cents * i.quantity,
          0
        );
      },
    }),
    {
      name: "dp-cart",
      version: 2,
      migrate(persistedState, version) {
        if (version < 2) {
          // v2: CartItem uses variantId instead of productId
          return { items: [] };
        }
        return persistedState as CartStore;
      },
    }
  )
);
