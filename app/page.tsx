import Link from "next/link";
import {
  listStorefrontProducts,
  getStorefrontCategories,
  getStorefrontCategoriesWithCounts,
  getNewArrivals,
} from "@/lib/search";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import ProductCard from "@/components/ProductCard";
import MembershipBanner from "@/components/MembershipBanner";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import ProductRow from "@/components/ProductRow";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const isHome = !kategori;

  const [products, categories, categoriesWithCounts, newArrivals, memberDiscountPercent] = await Promise.all([
    listStorefrontProducts({ categoryId: kategori }),
    getStorefrontCategories(),
    isHome ? getStorefrontCategoriesWithCounts() : Promise.resolve([]),
    isHome ? getNewArrivals(10) : Promise.resolve([]),
    getMemberDiscountPercent(),
  ]);

  const activeCategoryName = kategori ? categories.find((c) => c.id === kategori)?.name : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      {isHome && <Hero />}

      {memberDiscountPercent === null && (
        <div className="mb-8">
          <MembershipBanner />
        </div>
      )}

      {isHome && categoriesWithCounts.length > 0 && <CategoryGrid categories={categoriesWithCounts} />}

      {isHome && (
        <ProductRow title="Yeni Eklenenler" products={newArrivals} memberDiscountPercent={memberDiscountPercent} />
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">
          {activeCategoryName ?? "Tüm Ürünler"}
        </h2>
        {kategori && (
          <Link href="/" className="text-sm text-neutral-500 hover:text-[var(--color-brand)]">
            ← Tüm kategoriler
          </Link>
        )}
      </div>

      {categories.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/"
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
              !kategori
                ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            Tümü
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?kategori=${c.id}`}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                kategori === c.id
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">
          Şu anda burada gösterilecek ürün yok.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} memberDiscountPercent={memberDiscountPercent} />
          ))}
        </div>
      )}
    </div>
  );
}
