import Link from "next/link";

export default function CategoryGrid({
  categories,
}: {
  categories: { id: string; name: string; count: number }[];
}) {
  return (
    <div className="mb-6">
      <h2 className="mb-2.5 text-lg font-semibold text-neutral-900">Kategoriler</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/?kategori=${c.id}`}
            className="group rounded-xl border border-neutral-200 p-3.5 transition-colors hover:border-[var(--color-brand)]"
          >
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-sm font-semibold text-[var(--color-brand)]">
              {c.name.charAt(0).toUpperCase()}
            </span>
            <p className="text-sm font-medium text-neutral-900 group-hover:text-[var(--color-brand)]">{c.name}</p>
            <p className="text-xs text-neutral-400">{c.count} ürün</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
