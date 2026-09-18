import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { listStorefrontProducts, getStorefrontCategories, getStorefrontBrands, type StorefrontSort } from "@/lib/search";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import ProductCard from "@/components/ProductCard";
import ProductListRow from "@/components/ProductListRow";
import ProductFilters from "@/components/ProductFilters";
import SortSelect from "@/components/SortSelect";
import ViewToggle from "@/components/ViewToggle";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";

const PAGE_SIZE = 24;
const SORT_VALUES: StorefrontSort[] = ["onerilen", "fiyat-artan", "fiyat-azalan", "isim-az", "yeni"];

type SearchParams = {
  kategori?: string;
  marka?: string;
  q?: string;
  min?: string;
  max?: string;
  sirala?: string;
  gorunum?: string;
  sayfa?: string;
};

export default async function UrunlerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const kategori = sp.kategori || undefined;
  const brandIds = sp.marka ? sp.marka.split(",").filter(Boolean) : [];
  const q = sp.q?.trim() || undefined;
  const minPriceCents = sp.min ? Math.round(Number(sp.min) * 100) : undefined;
  const maxPriceCents = sp.max ? Math.round(Number(sp.max) * 100) : undefined;
  const sort: StorefrontSort = SORT_VALUES.includes(sp.sirala as StorefrontSort) ? (sp.sirala as StorefrontSort) : "onerilen";
  const view = sp.gorunum === "liste" ? "liste" : "izgara";
  const requestedPage = Math.max(1, Number(sp.sayfa) || 1);

  const [allProducts, categories, brands, memberDiscountPercent] = await Promise.all([
    listStorefrontProducts({
      query: q,
      categoryId: kategori,
      brandIds: brandIds.length > 0 ? brandIds : undefined,
      minPriceCents,
      maxPriceCents,
      sort,
    }),
    getStorefrontCategories(),
    getStorefrontBrands(),
    getMemberDiscountPercent(),
  ]);

  const total = allProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const products = allProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeCategoryName = kategori ? categories.find((c) => c.id === kategori)?.name : undefined;
  const hasActiveFilters = Boolean(kategori || brandIds.length > 0 || sp.min || sp.max);
  const heading = q ? `"${q}" için arama sonuçları` : (activeCategoryName ?? "Tüm Ürünler");

  function buildHref(overrides: Record<string, string | undefined>) {
    const merged: Record<string, string | undefined> = {
      kategori,
      marka: sp.marka,
      q,
      min: sp.min,
      max: sp.max,
      sirala: sp.sirala,
      gorunum: sp.gorunum,
      sayfa: sp.sayfa,
      ...overrides,
    };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/urunler?${qs}` : "/urunler";
  }

  const preservedFields = [
    kategori ? { name: "kategori", value: kategori } : null,
    sp.marka ? { name: "marka", value: sp.marka } : null,
    q ? { name: "q", value: q } : null,
    sp.sirala ? { name: "sirala", value: sp.sirala } : null,
    sp.gorunum ? { name: "gorunum", value: sp.gorunum } : null,
  ].filter((f): f is { name: string; value: string } => f !== null);

  const filterPanelProps = {
    categories,
    brands,
    activeCategoryId: kategori,
    activeBrandIds: brandIds,
    minPriceTl: sp.min,
    maxPriceTl: sp.max,
    hasActiveFilters,
    buildHref,
    preservedFields,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <nav className="mb-3 text-xs text-neutral-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[var(--color-brand)]">
          Ana Sayfa
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-neutral-700">{heading}</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{heading}</h1>
          <p className="text-sm text-neutral-500">{total} ürün</p>
        </div>
        <div className="flex items-center gap-2">
          <SortSelect />
          <ViewToggle />
        </div>
      </div>

      <details className="mb-4 rounded-xl border border-neutral-200 p-4 lg:hidden">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-neutral-900">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filtrele
        </summary>
        <div className="mt-4">
          <ProductFilters {...filterPanelProps} />
        </div>
      </details>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <ProductFilters {...filterPanelProps} />
        </aside>

        <div>
          {products.length === 0 ? (
            <EmptyState
              title={q ? "Aramanızla eşleşen ürün bulunamadı" : "Bu filtrelerle eşleşen ürün yok"}
              description={
                q
                  ? "Farklı bir anahtar kelime deneyin ya da filtreleri temizleyin."
                  : "Filtreleri temizleyerek tüm ürünlere göz atabilirsiniz."
              }
            />
          ) : view === "liste" ? (
            <div className="space-y-3">
              {products.map((product) => (
                <ProductListRow key={product.id} product={product} memberDiscountPercent={memberDiscountPercent} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} memberDiscountPercent={memberDiscountPercent} />
              ))}
            </div>
          )}

          {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={buildHref} />}
        </div>
      </div>
    </div>
  );
}
