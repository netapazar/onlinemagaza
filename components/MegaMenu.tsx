"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, ChevronDownIcon, ChevronRightIcon, GridIcon } from "@/components/icons";
import { getCategoryIcon, CategoryIcon } from "@/lib/categoryIcons";
import StoreImage from "@/components/StoreImage";
import type { StorefrontCategoryGroup } from "@/lib/search";

// İki bölmeli mega menü: solda ana kategoriler, üzerine gelinen (ya da klavyeyle odaklanılan) kategorinin alt
// kategorileri sağda ızgara hâlinde. Ana kategori adına tıklamak o kategorinin TÜM ürünlerine (alt kategoriler dahil) gider.
export default function MegaMenu({ categories }: { categories: StorefrontCategoryGroup[] }) {
  const [open, setOpen] = useState(false);
  const [aktifId, setAktifId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (categories.length === 0) return null;
  const aktif = categories.find((g) => g.id === aktifId) ?? categories[0];
  const kapat = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
          open ? "bg-[var(--color-brand-hover)] text-white" : "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]"
        }`}
      >
        <GridIcon className="h-4 w-4" aria-hidden="true" />
        Tüm Kategoriler
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-2 flex h-[min(72vh,500px)] w-[min(94vw,1080px)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl ring-1 ring-black/5">
          {/* Sol: ana kategoriler */}
          <ul className="w-64 shrink-0 overflow-y-auto border-r border-neutral-100 bg-neutral-50/70 py-2">
            {categories.map((g) => {
              const Icon = getCategoryIcon(g.name);
              const secili = g.id === aktif.id;
              return (
                <li key={g.id}>
                  <Link
                    href={`/urunler?kategori=${g.id}`}
                    onClick={kapat}
                    onMouseEnter={() => setAktifId(g.id)}
                    onFocus={() => setAktifId(g.id)}
                    className={`group mx-2 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      secili ? "bg-white text-[var(--color-brand)] shadow-sm ring-1 ring-neutral-200" : "text-neutral-700 hover:bg-white/80"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        secili ? "bg-[var(--color-brand)] text-white" : "bg-white text-[var(--color-brand)] ring-1 ring-neutral-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm ${secili ? "font-semibold" : "font-medium"}`}>{g.name}</span>
                      <span className="block text-[11px] text-neutral-400">{g.count} ürün</span>
                    </span>
                    <ChevronRightIcon className={`h-4 w-4 shrink-0 transition-transform ${secili ? "translate-x-0.5" : "text-neutral-300"}`} aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Sağ: seçili ana kategorinin alt kategorileri */}
          <div className="flex min-w-0 flex-1">
            <div className="min-w-0 flex-1 overflow-y-auto p-6">
              <div className="mb-5 flex items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                    <CategoryIcon name={aktif.name} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-bold text-neutral-900">{aktif.name}</p>
                    <p className="text-xs text-neutral-500">
                      {aktif.children.length > 0 ? `${aktif.children.length} alt kategori · ` : ""}
                      {aktif.count} ürün
                    </p>
                  </div>
                </div>
                <Link
                  href={`/urunler?kategori=${aktif.id}`}
                  onClick={kapat}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-brand-hover)]"
                >
                  Tümünü Gör
                  <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              {aktif.children.length > 0 ? (
                <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 xl:grid-cols-3">
                  {aktif.children.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/urunler?kategori=${c.id}`}
                        onClick={kapat}
                        className="group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
                      >
                        <span className="truncate">{c.name}</span>
                        <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500 tabular-nums group-hover:bg-white group-hover:text-[var(--color-brand)]">
                          {c.count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-500">Bu kategorinin tüm ürünlerini görmek için “Tümünü Gör”e tıklayın.</p>
              )}
            </div>

            {/* Görsel kartı yalnız az alt kategorili gruplarda: çok alt kategoride alan adlara kalsın (adlar kesilmesin) */}
            {aktif.imageUrl && aktif.children.length <= 12 && (
              <Link
                href={`/urunler?kategori=${aktif.id}`}
                onClick={kapat}
                className="group relative m-4 ml-0 hidden w-56 shrink-0 overflow-hidden rounded-xl bg-[var(--color-brand-soft)] lg:block"
              >
                <StoreImage src={aktif.imageUrl} alt="" sizes="224px" className="object-contain p-6 transition-transform duration-300 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--color-brand-800)]/90 to-transparent p-4 pt-12">
                  <span className="block text-sm font-semibold text-white">{aktif.name}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
                    Alışverişe başla <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
