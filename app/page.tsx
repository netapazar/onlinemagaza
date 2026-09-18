import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getStorefrontCategoriesWithCounts,
  getNewArrivals,
  getBestSellers,
  getStorefrontBrands,
} from "@/lib/search";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import MembershipBanner from "@/components/MembershipBanner";
import HeroSlider from "@/components/HeroSlider";
import TrustBar from "@/components/TrustBar";
import CategoryGrid from "@/components/CategoryGrid";
import ProductRow from "@/components/ProductRow";
import BrandStrip from "@/components/BrandStrip";
import EmptyState from "@/components/EmptyState";

// Anasayfa artık saf bir vitrin — kategoriye göre tam ürün listeleme,
// filtreleme ve sıralama /urunler sayfasında (bkz. "listeleme" adımı).
export default async function Home() {
  const [categories, newArrivals, bestSellers, brands, memberDiscountPercent] = await Promise.all([
    getStorefrontCategoriesWithCounts(),
    getNewArrivals(10),
    getBestSellers(10),
    getStorefrontBrands(),
    getMemberDiscountPercent(),
  ]);

  const catalogIsEmpty = categories.length === 0 && newArrivals.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4">
      <HeroSlider />
      <TrustBar />

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
          {categories.length > 0 && <CategoryGrid categories={categories} />}

          <ProductRow title="Çok Satanlar" products={bestSellers} memberDiscountPercent={memberDiscountPercent} />
          <ProductRow title="Yeni Eklenenler" products={newArrivals} memberDiscountPercent={memberDiscountPercent} />

          <BrandStrip brands={brands} />

          <div className="mb-6 flex justify-center">
            <Link
              href="/urunler"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
            >
              Tüm Ürünleri İncele
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
