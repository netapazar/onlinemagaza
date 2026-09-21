"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = { productId: string; quantity: number };
export type CartToast = { id: number; message: string };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  addItem: (productId: string, quantity: number, productName?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  closeDrawer: () => void;
  toast: CartToast | null;
  /** Her addItem çağrısında artar — üst bardaki sepet rozetinin "zıplama" animasyonunu (key ile) yeniden başlatır. */
  addTick: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "magaza_online_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<CartToast | null>(null);
  const [addTick, setAddTick] = useState(0);

  // localStorage per-viewer sepet — sunucu tarafında bilinmesi gerekmiyor,
  // checkout anına kadar sadece bu tarayıcıya özel bir taslak. localStorage
  // SSR sırasında hiç yok, bu yüzden mount sonrası bir effect + setState
  // kaçınılmaz (aksi halde hydration mismatch olurdu) — react-hooks'un
  // "effect içinde setState çağırma" kuralı burada kasıtlı olarak devre dışı.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage erişilemez olabilir (gizli sekme vb.) — boş sepetle devam
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // yazılamazsa sepet sadece bu oturum boyunca bellekte kalır
    }
  }, [items, hydrated]);

  const addItem = useCallback((productId: string, quantity: number, productName?: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { productId, quantity }];
    });
    // Sepete ekleme geri bildirimi: sağdan kayan mini-sepet çekmecesi +
    // kısa süreli toast — bkz. tasarım kısıtı, çağıran taraflar (ürün kartı,
    // liste satırı, ürün detay) tek bir addItem() çağrısıyla ikisini de
    // otomatik tetikliyor.
    setDrawerOpen(true);
    setAddTick((t) => t + 1);
    setToast({ id: Date.now(), message: productName ? `${productName} sepete eklendi` : "Ürün sepete eklendi" });
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, itemCount, addItem, updateQuantity, removeItem, clear, drawerOpen, closeDrawer, toast, addTick }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart, CartProvider içinde kullanılmalı.");
  return ctx;
}
