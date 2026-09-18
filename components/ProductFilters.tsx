import Link from "next/link";
import { Check } from "lucide-react";

type Category = { id: string; name: string };
type Brand = { id: string; name: string };

export default function ProductFilters({
  categories,
  brands,
  activeCategoryId,
  activeBrandIds,
  minPriceTl,
  maxPriceTl,
  hasActiveFilters,
  buildHref,
  preservedFields,
}: {
  categories: Category[];
  brands: Brand[];
  activeCategoryId?: string;
  activeBrandIds: string[];
  minPriceTl?: string;
  maxPriceTl?: string;
  hasActiveFilters: boolean;
  buildHref: (overrides: Record<string, string | undefined>) => string;
  preservedFields: { name: string; value: string }[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-neutral-900">Kategori</h3>
        <ul className="space-y-1 text-sm">
          <li>
            <Link
              href={buildHref({ kategori: undefined })}
              className={!activeCategoryId ? "font-semibold text-[var(--color-brand)]" : "text-neutral-600 hover:text-[var(--color-brand)]"}
            >
              Tümü
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={buildHref({ kategori: c.id })}
                className={activeCategoryId === c.id ? "font-semibold text-[var(--color-brand)]" : "text-neutral-600 hover:text-[var(--color-brand)]"}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-neutral-900">Marka</h3>
          <ul className="space-y-1.5 text-sm">
            {brands.map((b) => {
              const checked = activeBrandIds.includes(b.id);
              const nextIds = checked ? activeBrandIds.filter((id) => id !== b.id) : [...activeBrandIds, b.id];
              return (
                <li key={b.id}>
                  <Link
                    href={buildHref({ marka: nextIds.length > 0 ? nextIds.join(",") : undefined })}
                    className="flex items-center gap-2 text-neutral-600 hover:text-[var(--color-brand)]"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? "border-[var(--color-brand)] bg-[var(--color-brand)]" : "border-neutral-300"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3 text-white" aria-hidden="true" />}
                    </span>
                    {b.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-neutral-900">Fiyat Aralığı (₺)</h3>
        <form method="GET" action="/urunler" className="flex items-center gap-2">
          {preservedFields.map((f) => (
            <input key={f.name} type="hidden" name={f.name} value={f.value} />
          ))}
          <input
            type="number"
            name="min"
            min={0}
            defaultValue={minPriceTl}
            placeholder="En az"
            className="w-full min-w-0 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          />
          <span className="shrink-0 text-neutral-400">–</span>
          <input
            type="number"
            name="max"
            min={0}
            defaultValue={maxPriceTl}
            placeholder="En çok"
            className="w-full min-w-0 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:border-[var(--color-brand)] focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-brand-hover)]"
          >
            Uygula
          </button>
        </form>
      </div>

      {hasActiveFilters && (
        <Link href="/urunler" className="inline-block text-xs text-neutral-500 underline hover:text-[var(--color-brand)]">
          Filtreleri Temizle
        </Link>
      )}
    </div>
  );
}
