import Link from "next/link";
import { getCategoryIcon } from "@/lib/categoryIcons";
import StoreImage from "@/components/StoreImage";

type Category = { id: string; name: string; count: number; imageUrl: string | null };

// Az kategoriyle ızgara sola yığılıp sağda boşluk bırakmasın: sm+ genişlikte satır ORTALANIR (çok kategori olunca alt
// satıra sarar); mobilde yatay kaydırma korunur.
export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-xl font-bold text-neutral-900">Kategoriler</h2>
      <div className="flex gap-4 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-5 sm:overflow-visible">
        {categories.map((c) => {
          const Icon = getCategoryIcon(c.name);
          return (
            <Link
              key={c.id}
              href={`/urunler?kategori=${c.id}`}
              className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center sm:w-28"
            >
              <span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-neutral-100 bg-[var(--color-brand-soft)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[var(--color-brand)] group-hover:shadow-md">
                {c.imageUrl ? (
                  <StoreImage src={c.imageUrl} alt="" sizes="80px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <Icon className="h-8 w-8 text-[var(--color-brand)]" aria-hidden="true" />
                )}
              </span>
              <span className="text-xs font-semibold text-neutral-800 transition-colors group-hover:text-[var(--color-brand)]">{c.name}</span>
              <span className="text-[11px] text-neutral-400">{c.count} ürün</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
