import Link from "next/link";
import { GridIcon } from "@/components/icons";
import { CategoryIcon } from "@/lib/categoryIcons";
import { getCategoryImage } from "@/lib/categoryImages";
import SectionHeading from "@/components/SectionHeading";

type Category = { id: string; name: string; count: number };

// Yalnız ana kategoriler, eşit boyutlu kartlarda, kaydırmasız ızgara (mobil 2, tablet 4, geniş ekran 8 sütun). Bölüm zemini
// açık teal, kartlar beyaz. Kartta kategoriye özel illüstrasyon (lib/categoryImages.ts) renkli daire içinde; hover'da dairenin
// çevresinde teal halka (renkli görsel beyaza çevrilemediği için dolu teal kutu yerine). Eşleşmeyen kategori çizgi ikona düşer.
// Alt kategoriler menüde.
export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="mb-6 rounded-2xl border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionHeading title="Kategoriler" icon={GridIcon} />
        <span className="text-xs text-neutral-500">{categories.length} kategori</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {categories.map((c) => {
          const image = getCategoryImage(c.name);
          return (
            <Link
              key={c.id}
              href={`/urunler?kategori=${c.id}`}
              className="group flex h-full flex-col items-center gap-2 rounded-xl sm:gap-3 border border-neutral-200 bg-white px-2 py-4 text-center sm:px-3 sm:py-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:shadow-md"
            >
              {image ? (
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16 ${image.circleClass} ring-0 ring-[var(--color-brand)] transition-shadow duration-200 group-hover:ring-[3px]`}
                >
                  {/* Küçük, önceden boyutlanmış statik WebP (112 px) — next/image optimizasyonuna gerek yok. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.src}
                    alt=""
                    width={44}
                    height={44}
                    loading="lazy"
                    decoding="async"
                    className={image.large ? "h-12 w-12 sm:h-[52px] sm:w-[52px]" : "h-10 w-10 sm:h-11 sm:w-11"}
                  />
                </span>
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14 bg-[var(--color-brand-50)] text-[var(--color-brand)] transition-colors duration-200 group-hover:bg-[var(--color-brand)] group-hover:text-white">
                  <CategoryIcon name={c.name} className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
              )}
              <span className="flex min-h-10 items-center text-sm leading-tight font-bold text-neutral-900 group-hover:text-[var(--color-brand)]">
                {c.name}
              </span>
              <span className="-mt-1 text-xs text-neutral-500">{c.count} ürün</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
