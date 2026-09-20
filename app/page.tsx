import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getStorefrontCategoriesWithCounts,
  getNewArrivals,
  getBestSellers,
  getStorefrontBrands,
} from "@/lib/search";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import { getMembershipStatus } from "@/lib/membershipStatus";
import HeroSection from "@/components/HeroSection";
import TrustBar from "@/components/TrustBar";
import CategoryGrid from "@/components/CategoryGrid";
import ProductRow from "@/components/ProductRow";
import AudienceSection from "@/components/AudienceSection";
import WhyUsBand from "@/components/WhyUsBand";
import CorporateBenefits from "@/components/CorporateBenefits";
import BrandStrip from "@/components/BrandStrip";
import EmptyState from "@/components/EmptyState";

const ROW_LIMIT = 12;

// Anasayfa artık saf bir vitrin — kategoriye göre tam ürün listeleme,
// filtreleme ve sıralama /urunler sayfasında (bkz. "listeleme" adımı).
// v2 tasarım: gri zemin üzerinde beyaz kart/blok bölümler + tam genişlik
// renkli bantlar (Avansas esintili, daha "dolu" bir görünüm için).
export default async function Home() {
  const [categories, newArrivals, bestSellers, brands, memberDiscountPercent, membershipStatus] = await Promise.all([
    getStorefrontCategoriesWithCounts(),
    getNewArrivals(ROW_LIMIT),
    getBestSellers(ROW_LIMIT),
    getStorefrontBrands(),
    getMemberDiscountPercent(),
    getMembershipStatus(),
  ]);

  const catalogIsEmpty = categories.length === 0 && newArrivals.length === 0;

  return (
    <div className="mx-auto w-full max-w-content px-4 py-4">
      <HeroSection status={membershipStatus} />

      {catalogIsEmpty ? (
        <EmptyState
          title="Ürünlerimiz çok yakında burada"
          description="Vitrinimizi hazırlıyoruz — kaliteli ürünlerimizi en kısa sürede sizlerle buluşturacağız."
        />
      ) : (
        <>
          <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <TrustBar />
          </div>

          {/* Kurumsal üyelik avantajları: onaylı üyede kısa "avantajlarınız aktif" şeridi, diğerlerinde
              görselli avantaj bölümü + "Hemen Başvur" (bkz. components/CorporateBenefits.tsx) */}
          <CorporateBenefits status={membershipStatus} />

          {categories.length > 0 && <CategoryGrid categories={categories} />}

          {bestSellers.length > 0 && (
            <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <ProductRow
                title="Çok Satanlar"
                products={bestSellers}
                memberDiscountPercent={memberDiscountPercent}
                viewAllHref="/urunler"
              />
            </div>
          )}

          {newArrivals.length > 0 && (
            <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <ProductRow
                title="Yeni Eklenenler"
                products={newArrivals}
                memberDiscountPercent={memberDiscountPercent}
                viewAllHref="/urunler?sirala=yeni"
              />
            </div>
          )}

          <AudienceSection />
          <WhyUsBand />

          {brands.length > 1 && (
            <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <BrandStrip brands={brands} />
            </div>
          )}

          <div className="mb-5 flex justify-center">
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
