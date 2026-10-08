"use client";

import { useState } from "react";
import Link from "next/link";
import { HomeIcon, GridIcon, CartIcon, UserIcon, CloseIcon, HeartIcon, BriefcaseIcon, TrendUpIcon, SparkleIcon, HelpIcon, ChevronDownIcon } from "@/components/icons";
import { useCart } from "@/components/CartProvider";
import { useFavorites } from "@/components/FavoritesProvider";
import { CategoryIcon } from "@/lib/categoryIcons";

type CategoryWithCount = { id: string; name: string; count: number; children?: { id: string; name: string; count: number }[] };

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
          <HomeIcon className="h-5 w-5" aria-hidden="true" />
          Ana Sayfa
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-neutral-600"
        >
          <GridIcon className="h-5 w-5" aria-hidden="true" />
          Kategoriler
        </button>
        <Link href="/sepet" className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-neutral-600">
          <CartIcon className="h-5 w-5" aria-hidden="true" />
          Sepet
          {itemCount > 0 && (
            <span className="absolute top-1 right-[28%] flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[9px] font-semibold text-white">
              {itemCount}
            </span>
          )}
        </Link>
        <Link href="/hesabim" className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-neutral-600">
          <UserIcon className="h-5 w-5" aria-hidden="true" />
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
            <CloseIcon className="h-5 w-5 text-neutral-500" aria-hidden="true" />
          </button>
        </div>

        <div className="mb-4 space-y-1.5">
          {categories.map((c) => (
            <MobilKategori key={c.id} c={c} onClose={onClose} />
          ))}
        </div>

        <div className="space-y-1 border-t border-neutral-100 pt-3">
          <Link href="/favoriler" onClick={onClose} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-neutral-50">
            <HeartIcon className="h-[18px] w-[18px] text-neutral-500" aria-hidden="true" />
            <span className="text-sm text-neutral-700">
              Favorilerim{favoriteCount > 0 ? ` (${favoriteCount})` : ""}
            </span>
          </Link>
          <Link href="/cok-satanlar" onClick={onClose} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-neutral-50">
            <TrendUpIcon className="h-[18px] w-[18px] text-neutral-500" aria-hidden="true" />
            <span className="text-sm text-neutral-700">Çok Satanlar</span>
          </Link>
          <Link href="/urunler?sirala=yeni" onClick={onClose} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-neutral-50">
            <SparkleIcon className="h-[18px] w-[18px] text-neutral-500" aria-hidden="true" />
            <span className="text-sm text-neutral-700">Yeni Ürünler</span>
          </Link>
          <Link
            href="/hesabim/uyelik-basvurusu"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-neutral-50"
          >
            <BriefcaseIcon className="h-[18px] w-[18px] text-neutral-500" aria-hidden="true" />
            <span className="text-sm text-neutral-700">Kurumsal Üyelik</span>
          </Link>
          <Link href="/sss" onClick={onClose} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-neutral-50">
            <HelpIcon className="h-[18px] w-[18px] text-neutral-500" aria-hidden="true" />
            <span className="text-sm text-neutral-700">Sıkça Sorulan Sorular</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Ana kategori satırı: adı o kategorinin tüm ürünlerine gider; ok tuşu alt kategorileri açar/kapatır.
function MobilKategori({ c, onClose }: { c: CategoryWithCount; onClose: () => void }) {
  const [acik, setAcik] = useState(false);
  const children = c.children ?? [];
  return (
    <div className={`rounded-xl border transition-colors ${acik ? "border-[var(--color-brand-200)] bg-[var(--color-brand-50)]" : "border-neutral-100"}`}>
      <div className="flex items-center">
        <Link href={`/urunler?kategori=${c.id}`} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3 p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
            <CategoryIcon name={c.name} className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-neutral-800">{c.name}</span>
            <span className="block text-xs text-neutral-400">{c.count} ürün</span>
          </span>
        </Link>
        {children.length > 0 && (
          <button
            type="button"
            onClick={() => setAcik((v) => !v)}
            aria-expanded={acik}
            aria-label={`${c.name} alt kategorileri`}
            className="mr-1.5 rounded-lg p-2.5 text-neutral-500 hover:bg-white"
          >
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${acik ? "rotate-180 text-[var(--color-brand)]" : ""}`} aria-hidden="true" />
          </button>
        )}
      </div>
      {acik && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-3">
          <Link
            href={`/urunler?kategori=${c.id}`}
            onClick={onClose}
            className="rounded-full bg-[var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Tümü
          </Link>
          {children.map((a) => (
            <Link
              key={a.id}
              href={`/urunler?kategori=${a.id}`}
              onClick={onClose}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700"
            >
              {a.name} <span className="text-neutral-400">{a.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
