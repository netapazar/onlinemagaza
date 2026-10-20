"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { sepeteEklendi } from "@/lib/analitik";

// birim: paketli satış ürününde seçilen birim ("KUTU"); quantity o birimden KAÇ TANE (adet değil). Normal üründe birim yok
// ve quantity adettir. Aynı ürünün farklı birimleri ayrı satırdır (bkz. lib/satisBirimleri.ts).
export type CartItem = { productId: string; quantity: number; birim?: string };

function sameLine(i: CartItem, productId: string, birim?: string | null) {
  return i.productId === productId && (i.birim ?? null) === (birim ?? null);
}
export type CartToast = { id: number; message: string };


// GA4 add_to_cart verisi: adet fiyatı (KDV dahil, ekranda görünen), marka ve paketli satışta birim içeriği.
export type SepetAnalitigi = { adetFiyatiCents: number; marka?: string | null; icerik?: number };
export type TopluSepetSatiri = {
  productId: string;
  quantity: number;
  productName?: string;
  birim?: string | null;
  analitik?: SepetAnalitigi;
};
type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  /** analitik: GA4 add_to_cart için adet fiyatı, marka ve birim içeriği (yalnız çerez onayı varsa gönderilir). */
  addItem: (productId: string, quantity: number, productName?: string, birim?: string | null, analitik?: SepetAnalitigi) => void;
  /** Toplu ekleme (ürün grubu sayfasındaki toplu adet tablosu): tek durum güncellemesi, tek çekmece/bildirim. */
  addItems: (lines: TopluSepetSatiri[]) => void;
  updateQuantity: (productId: string, quantity: number, birim?: string | null) => void;
  removeItem: (productId: string, birim?: string | null) => void;
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

  const addItem = useCallback((productId: string, quantity: number, productName?: string, birim?: string | null, analitik?: SepetAnalitigi) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, productId, birim));
      if (existing) {
        return prev.map((i) => (sameLine(i, productId, birim) ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, birim ? { productId, quantity, birim } : { productId, quantity }];
    });
    // Sepete ekleme geri bildirimi: sağdan kayan mini-sepet çekmecesi +
    // kısa süreli toast — bkz. tasarım kısıtı, çağıran taraflar (ürün kartı,
    // liste satırı, ürün detay) tek bir addItem() çağrısıyla ikisini de
    // otomatik tetikliyor.
    setDrawerOpen(true);
    setAddTick((t) => t + 1);
    setToast({ id: Date.now(), message: productName ? `${productName} sepete eklendi` : "Ürün sepete eklendi" });
    if (analitik) {
      sepeteEklendi({
        id: productId,
        ad: productName ?? productId,
        marka: analitik.marka,
        adetFiyatiCents: analitik.adetFiyatiCents,
        adet: quantity * (analitik.icerik ?? 1),
      });
    }
  }, []);

  const addItems = useCallback((lines: TopluSepetSatiri[]) => {
    const gecerli = lines.filter((l) => l.quantity > 0);
    if (gecerli.length === 0) return;
    setItems((prev) => {
      let next = prev;
      for (const l of gecerli) {
        const existing = next.find((i) => sameLine(i, l.productId, l.birim));
        next = existing
          ? next.map((i) => (sameLine(i, l.productId, l.birim) ? { ...i, quantity: i.quantity + l.quantity } : i))
          : [...next, l.birim ? { productId: l.productId, quantity: l.quantity, birim: l.birim } : { productId: l.productId, quantity: l.quantity }];
      }
      return next;
    });
    setDrawerOpen(true);
    setAddTick((t) => t + 1);
    setToast({
      id: Date.now(),
      message:
        gecerli.length === 1 && gecerli[0].productName
          ? `${gecerli[0].productName} sepete eklendi`
          : `${gecerli.length} ürün sepete eklendi`,
    });
    for (const l of gecerli) {
      if (!l.analitik) continue;
      sepeteEklendi({
        id: l.productId,
        ad: l.productName ?? l.productId,
        marka: l.analitik.marka,
        adetFiyatiCents: l.analitik.adetFiyatiCents,
        adet: l.quantity * (l.analitik.icerik ?? 1),
      });
    }
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const updateQuantity = useCallback((productId: string, quantity: number, birim?: string | null) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => !sameLine(i, productId, birim))
        : prev.map((i) => (sameLine(i, productId, birim) ? { ...i, quantity } : i))
    );
  }, []);

  const removeItem = useCallback((productId: string, birim?: string | null) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, productId, birim)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, itemCount, addItem, addItems, updateQuantity, removeItem, clear, drawerOpen, closeDrawer, toast, addTick }}
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
