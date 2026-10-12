import Link from "next/link";
import { GridIcon } from "@/components/icons";
import { CategoryIcon } from "@/lib/categoryIcons";
import { getCategoryImage, CATEGORY_SPRITE_CELLS } from "@/lib/categoryImages";
import LateAssets from "@/components/LateAssets";
import SectionHeading from "@/components/SectionHeading";

type Category = { id: string; name: string; count: number };

// Yalnız ana kategoriler, KISA ŞERİT (2026-10 yoğunluk turu): geniş ekranda tek sıra (kaç kategori varsa o kadar eşit sütun), daha
// dar ekranda yana kaydırılan tek sıra. Kartta solda kategoriye özel illüstrasyon (lib/categoryImages.ts) renkli daire içinde, sağda
// ad + ürün sayısı. Bölüm zemini açık teal, kartlar beyaz; hover'da dairenin çevresinde teal halka. Eşleşmeyen kategori çizgi
// ikona düşer. Alt kategoriler menüde.
export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="mb-6 rounded-2xl border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionHeading title="Kategoriler" icon={GridIcon} />
        <span className="text-xs text-neutral-500">{categories.length} kategori</span>
      </div>
      <LateAssets />
      <div className="scrollbar-none -mx-5 -my-1 flex gap-2.5 overflow-x-auto px-5 py-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:my-0 lg:py-0 lg:grid lg:auto-cols-fr lg:grid-flow-col lg:overflow-visible lg:px-0">
        {categories.map((c) => {
          const image = getCategoryImage(c.name);
          return (
            <Link
              key={c.id}
              href={`/urunler?kategori=${c.id}`}
              className="group flex w-40 shrink-0 items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:shadow-md lg:w-auto lg:min-w-0"
            >
              {image ? (
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${image.circleClass} ring-0 ring-[var(--color-brand)] transition-shadow duration-200 group-hover:ring-[3px]`}
                >
                  <span
                    aria-hidden="true"
                    className={`kategori-sprite block ${image.large ? "h-9 w-9" : "h-8 w-8"}`}
                    style={{ backgroundPosition: `${(image.index / (CATEGORY_SPRITE_CELLS - 1)) * 100}% 0` }}
                  />
                </span>
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand)] transition-colors duration-200 group-hover:bg-[var(--color-brand)] group-hover:text-white">
                  <CategoryIcon name={c.name} className="h-6 w-6" />
                </span>
              )}
              <span className="flex min-w-0 flex-col">
                <span className="text-[13px] leading-tight font-bold text-neutral-900 group-hover:text-[var(--color-brand)]">{c.name}</span>
                <span className="mt-0.5 text-[11px] text-neutral-500">{c.count} ürün</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
