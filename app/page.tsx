import Link from "next/link";
import {
  listStorefrontProducts,
  getStorefrontCategories,
  getStorefrontCategoriesWithCounts,
  getNewArrivals,
  getBestSellers,
  getStorefrontBrands,
} from "@/lib/search";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import ProductCard from "@/components/ProductCard";
import MembershipBanner from "@/components/MembershipBanner";
import HeroSlider from "@/components/HeroSlider";
import TrustBar from "@/components/TrustBar";
import CategoryGrid from "@/components/CategoryGrid";
import ProductRow from "@/components/ProductRow";
import BrandStrip from "@/components/BrandStrip";
import EmptyState from "@/components/EmptyState";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const isHome = !kategori;

  const [products, categories, categoriesWithCounts, newArrivals, bestSellers, brands, memberDiscountPercent] =
    await Promise.all([
      listStorefrontProducts({ categoryId: kategori }),
      getStorefrontCategories(),
      isHome ? getStorefrontCategoriesWithCounts() : Promise.resolve([]),
      isHome ? getNewArrivals(10) : Promise.resolve([]),
      isHome ? getBestSellers(10) : Promise.resolve([]),
      isHome ? getStorefrontBrands() : Promise.resolve([]),
      getMemberDiscountPercent(),
    ]);

  const activeCategoryName = kategori ? categories.find((c) => c.id === kategori)?.name : null;
  const catalogIsEmpty = isHome && products.length === 0 && categories.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4">
      {isHome && (
        <>
          <HeroSlider />
          <TrustBar />
        </>
      )}

      {memberDiscountPercent === null && (
        <div className="mb-5">
          <MembershipBanner />
        </div>
      )}

      {catalogIsEmpty ? (
        <EmptyState
          title="Ürünlerimiz çok yakında burada"
          description="Vitrinimizi hazırlıyoruz — kaliteli ürünlerimizi en kısa sürede sizlerle buluşturacağız."
        />
      ) : (
        <>
          {isHome && categoriesWithCounts.length > 0 && <CategoryGrid categories={categoriesWithCounts} />}

          {isHome && (
            <ProductRow title="Çok Satanlar" products={bestSellers} memberDiscountPercent={memberDiscountPercent} />
          )}

          {isHome && (
            <ProductRow title="Yeni Eklenenler" products={newArrivals} memberDiscountPercent={memberDiscountPercent} />
          )}

          {isHome && <BrandStrip brands={brands} />}

          <div id="tum-urunler" className="mb-3 flex scroll-mt-32 items-center justify-between">
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
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
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
            <EmptyState
              title="Bu kategoride henüz ürün yok"
              description="Başka bir kategoriye göz atabilir ya da tüm ürünleri görüntüleyebilirsiniz."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} memberDiscountPercent={memberDiscountPercent} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
