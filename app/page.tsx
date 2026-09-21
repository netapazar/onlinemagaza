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
import CorporateBenefits from "@/components/CorporateBenefits";
import BrandStrip, { MIN_BRANDS } from "@/components/BrandStrip";
import EmptyState from "@/components/EmptyState";
import Reveal from "@/components/Reveal";

const ROW_LIMIT = 12;

// Anasayfa artık saf bir vitrin — kategoriye göre tam ürün listeleme,
// filtreleme ve sıralama /urunler sayfasında (bkz. "listeleme" adımı).
// v2 tasarım: gri zemin üzerinde beyaz kart/blok bölümler + tam genişlik
// renkli bantlar (Avansas esintili, daha "dolu" bir görünüm için).
// Tasarım turu: "Neden Tedarikhane?" bandı kaldırıldı (içeriği TrustBar/CorporateBenefits ile tekrarlıyordu); bölümler
// ekrana girerken bir kez yumuşakça belirir (Reveal); az markayla "Markalar" bölümü gizlenir (MIN_BRANDS).
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

  // Banner kompozisyonu için gerçek ürün fotoğrafları (aynı fotoğraf iki kez girmesin).
  const photos: { url: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const p of [...bestSellers, ...newArrivals]) {
    if (!p.coverImageUrl || seen.has(p.coverImageUrl)) continue;
    seen.add(p.coverImageUrl);
    photos.push({ url: p.coverImageUrl, name: p.name });
    if (photos.length === 3) break;
  }

  return (
    <div className="mx-auto w-full max-w-content px-4 py-4">
      <HeroSection status={membershipStatus} photos={photos} />

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
          <Reveal>
            <CorporateBenefits status={membershipStatus} />
          </Reveal>

          {categories.length > 0 && (
            <Reveal>
              <CategoryGrid categories={categories} />
            </Reveal>
          )}

          {bestSellers.length > 0 && (
            <Reveal>
              <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                <ProductRow
                  title="Çok Satanlar"
                  products={bestSellers}
                  memberDiscountPercent={memberDiscountPercent}
                  viewAllHref="/urunler"
                />
              </div>
            </Reveal>
          )}

          {newArrivals.length > 0 && (
            <Reveal>
              <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                <ProductRow
                  title="Yeni Eklenenler"
                  products={newArrivals}
                  memberDiscountPercent={memberDiscountPercent}
                  viewAllHref="/urunler?sirala=yeni"
                />
              </div>
            </Reveal>
          )}

          <Reveal>
            <AudienceSection />
          </Reveal>

          {brands.length >= MIN_BRANDS && (
            <Reveal>
              <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                <BrandStrip brands={brands} />
              </div>
            </Reveal>
          )}

          <div className="mb-5 flex justify-center">
            <Link
              href="/urunler"
              className="group inline-flex items-center gap-2 rounded-lg border border-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-[var(--color-brand)] transition-colors duration-200 hover:bg-[var(--color-brand-soft)]"
            >
              Tüm Ürünleri İncele
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
