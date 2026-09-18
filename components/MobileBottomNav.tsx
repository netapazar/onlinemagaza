"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, LayoutGrid, ShoppingCart, User, X, Heart, Briefcase, Percent } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { useFavorites } from "@/components/FavoritesProvider";
import { getCategoryIcon } from "@/lib/categoryIcons";

type CategoryWithCount = { id: string; name: string; count: number };

// "Genel" bölümündeki mobil alt navigasyon: Ana Sayfa / Kategoriler / Sepet
// / Hesabım — sadece küçük ekranlarda görünür (bkz. layout.tsx'teki sm:hidden
// sarmalayıcı). "Kategoriler" sekmesi ayrı bir hamburger menüye gerek
// bırakmadan aynı kategori listesini bir alttan-açılan panelde gösteriyor.
export default function MobileBottomNav({
  loggedIn,
  categories,
}: {
  loggedIn: boolean;
  categories: CategoryWithCount[];
}) {
  const { itemCount } = useCart();
  const { count: favoriteCount } = useFavorites();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-neutral-200 bg-white sm:hidden">
        <Link href="/" className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-neutral-600">
          <Home className="h-5 w-5" aria-hidden="true" />
          Ana Sayfa
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-neutral-600"
        >
          <LayoutGrid className="h-5 w-5" aria-hidden="true" />
          Kategoriler
        </button>
        <Link href="/sepet" className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-neutral-600">
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          Sepet
          {itemCount > 0 && (
            <span className="absolute top-1 right-[28%] flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[9px] font-semibold text-white">
              {itemCount}
            </span>
          )}
        </Link>
        <Link href="/hesabim" className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-neutral-600">
          <User className="h-5 w-5" aria-hidden="true" />
          {loggedIn ? "Hesabım" : "Giriş"}
        </Link>
      </nav>

      {drawerOpen && (
        <MobileDrawer onClose={() => setDrawerOpen(false)} favoriteCount={favoriteCount} categories={categories} />
      )}
    </>
  );
}

function MobileDrawer({
  onClose,
  favoriteCount,
  categories,
}: {
  onClose: () => void;
  favoriteCount: number;
  categories: CategoryWithCount[];
}) {
  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      <button type="button" aria-label="Kapat" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Kategoriler</h2>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 hover:bg-neutral-100">
            <X className="h-5 w-5 text-neutral-500" aria-hidden="true" />
          </button>
        </div>

        <div className="mb-4 space-y-1">
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.name);
            return (
              <Link
                key={c.id}
                href={`/?kategori=${c.id}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-neutral-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-neutral-800">{c.name}</span>
                  <span className="block text-xs text-neutral-400">{c.count} ürün</span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="space-y-1 border-t border-neutral-100 pt-3">
          <Link href="/favoriler" onClick={onClose} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-neutral-50">
            <Heart className="h-[18px] w-[18px] text-neutral-500" aria-hidden="true" />
            <span className="text-sm text-neutral-700">
              Favorilerim{favoriteCount > 0 ? ` (${favoriteCount})` : ""}
            </span>
          </Link>
          <Link href="/kampanyalar" onClick={onClose} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-neutral-50">
            <Percent className="h-[18px] w-[18px] text-neutral-500" aria-hidden="true" />
            <span className="text-sm text-neutral-700">Kampanyalar</span>
          </Link>
          <Link
            href="/hesabim/uyelik-basvurusu"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-neutral-50"
          >
            <Briefcase className="h-[18px] w-[18px] text-neutral-500" aria-hidden="true" />
            <span className="text-sm text-neutral-700">Kurumsal Üyelik</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
