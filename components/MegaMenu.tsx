"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";

type CategoryWithCount = { id: string; name: string; count: number };

// Şu an sadece 2 kategori var — grid tek satıra sığıyor, sade bir açılır
// panel gibi görünüyor. Kategori sayısı arttıkça aynı grid (sm:grid-cols-3)
// kendiliğinden çok sütunlu bir mega menüye dönüşecek; iki ayrı bileşen/kod
// yolu yok, tek bir yapı her iki durumda da doğru görünüyor.
export default function MegaMenu({ categories }: { categories: CategoryWithCount[] }) {
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
        <div className="absolute top-full left-0 z-30 mt-2 w-[min(90vw,640px)] rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {categories.map((c) => {
              const Icon = getCategoryIcon(c.name);
              return (
                <Link
                  key={c.id}
                  href={`/urunler?kategori=${c.id}`}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-lg p-2.5 hover:bg-[var(--color-brand-soft)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)] group-hover:bg-white">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-neutral-800 group-hover:text-[var(--color-brand)]">
                      {c.name}
                    </span>
                    <span className="block text-xs text-neutral-400">{c.count} ürün</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
