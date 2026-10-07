"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import type { StorefrontCategoryGroup } from "@/lib/search";

// Ana kategoriler sütunlar hâlinde; her birinin altında alt kategorileri. Çok alt kategorili gruplarda panel kendi içinde
// kayar (sayfa uzamaz). Ana kategori başlığı o kategorinin TÜM ürünlerine (alt kategoriler dahil) gider.
export default function MegaMenu({ categories }: { categories: StorefrontCategoryGroup[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (categories.length === 0) return null;

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
        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
        Tüm Kategoriler
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-2 max-h-[70vh] w-[min(94vw,1000px)] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-4 shadow-lg">
          <div className="columns-2 gap-6 md:columns-3 lg:columns-4">
            {categories.map((g) => {
              const Icon = getCategoryIcon(g.name);
              return (
                <div key={g.id} className="mb-4 break-inside-avoid">
                  <Link
                    href={`/urunler?kategori=${g.id}`}
                    onClick={() => setOpen(false)}
                    className="group mb-1 flex items-center gap-2 rounded-lg p-1.5 hover:bg-[var(--color-brand-soft)]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-brand-soft)] text-[var(--color-brand)] group-hover:bg-white">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 text-sm font-semibold text-neutral-900 group-hover:text-[var(--color-brand)]">
                      {g.name} <span className="font-normal text-neutral-400">({g.count})</span>
                    </span>
                  </Link>
                  {g.children.length > 0 && (
                    <ul className="ml-10 space-y-0.5">
                      {g.children.map((c) => (
                        <li key={c.id}>
                          <Link
                            href={`/urunler?kategori=${c.id}`}
                            onClick={() => setOpen(false)}
                            className="block truncate text-[13px] text-neutral-600 hover:text-[var(--color-brand)]"
                          >
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
