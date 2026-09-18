import Link from "next/link";
import { getCategoryIcon } from "@/lib/categoryIcons";

type Category = { id: string; name: string; count: number; imageUrl: string | null };

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-xl font-bold text-neutral-900">Kategoriler</h2>
      <div className="flex gap-4 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible md:grid-cols-6">
        {categories.map((c) => {
          const Icon = getCategoryIcon(c.name);
          return (
            <Link
              key={c.id}
              href={`/urunler?kategori=${c.id}`}
              className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center sm:w-auto"
            >
              <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-neutral-100 bg-[var(--color-brand-soft)] transition-colors group-hover:border-[var(--color-brand)]">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Icon className="h-8 w-8 text-[var(--color-brand)]" aria-hidden="true" />
                )}
              </span>
              <span className="text-xs font-semibold text-neutral-800 group-hover:text-[var(--color-brand)]">{c.name}</span>
              <span className="text-[11px] text-neutral-400">{c.count} ürün</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
