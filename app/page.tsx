import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import {
  getStorefrontCategoriesWithCounts,
  getNewArrivals,
  getBestSellers,
  getVitrinMarkalari,
} from "@/lib/search";
import { getMemberDiscountPercent } from "@/lib/memberPricing";
import { getMembershipStatus } from "@/lib/membershipStatus";
import HeroSection from "@/components/HeroSection";
import TrustBar from "@/components/TrustBar";
import CategoryGrid from "@/components/CategoryGrid";
import ProductRow from "@/components/ProductRow";
import { ApprovedStrip } from "@/components/CorporateBenefits";
import BrandStrip, { MIN_BRANDS } from "@/components/BrandStrip";
import EmptyState from "@/components/EmptyState";
import Reveal from "@/components/Reveal";
import { ANA_SAYFA_ACIKLAMASI, ANA_SAYFA_BASLIGI, sayfaMetasi } from "@/lib/seo";

const ROW_LIMIT = 12;

// Anasayfa artık saf bir vitrin — kategoriye göre tam ürün listeleme,
// filtreleme ve sıralama /urunler sayfasında (bkz. "listeleme" adımı).
// v2 tasarım: gri zemin üzerinde beyaz kart/blok bölümler + tam genişlik
// renkli bantlar (Avansas esintili, daha "dolu" bir görünüm için).
// Tasarım turu: "Neden Tedarikhane?" bandı kaldırıldı (içeriği TrustBar/CorporateBenefits ile tekrarlıyordu); bölümler
// ekrana girerken bir kez yumuşakça belirir (Reveal); az markayla "Markalar" bölümü gizlenir (MIN_BRANDS).
export const metadata = sayfaMetasi({ baslik: ANA_SAYFA_BASLIGI, aciklama: ANA_SAYFA_ACIKLAMASI, yol: "/" });

export default async function Home() {
  const [categories, newArrivals, bestSellers, brands, memberDiscountPercent, membershipStatus] = await Promise.all([
    getStorefrontCategoriesWithCounts(),
    getNewArrivals(ROW_LIMIT, { yalnizSatilabilir: true }),
    getBestSellers(ROW_LIMIT, { yalnizSatilabilir: true }),
    getVitrinMarkalari(),
    getMemberDiscountPercent(),
    getMembershipStatus(),
  ]);

  const bestSellersRow = bestSellers.length > 0 && (
    <Reveal>
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <ProductRow
          title="Çok Satanlar"
          products={bestSellers}
          memberDiscountPercent={memberDiscountPercent}
          viewAllHref="/urunler"
          kdvNotu
        />
      </div>
    </Reveal>
  );

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
  // Yan kısayol kartları: her biri kendi listesinin ilk fotoğraflı ürünü (aynı fotoğraf iki kartta olmasın).
  const bestPhoto = bestSellers.find((p) => p.coverImageUrl)?.coverImageUrl ?? null;
  const newPhoto = newArrivals.find((p) => p.coverImageUrl && p.coverImageUrl !== bestPhoto)?.coverImageUrl ?? null;

  return (
    <div className="mx-auto w-full max-w-content px-4 py-4">
      <HeroSection status={membershipStatus} photos={photos} bestPhoto={bestPhoto} newPhoto={newPhoto} />

      {catalogIsEmpty ? (
        <EmptyState
          title="Ürünlerimiz çok yakında burada"
          description="Vitrinimizi hazırlıyoruz — kaliteli ürünlerimizi en kısa sürede sizlerle buluşturacağız."
        />
      ) : (
        <>
          {/* Sıra ve renk ritmi (herkese aynı): bilgi şeridi (teal) · çok satanlar (beyaz) · kategoriler (teal) · yeni eklenenler
              (beyaz) · markalar (teal). Ürün satırları beyaz: fotoğraflar beyazda iyi durur. Onaylı üyede üye durum çubuğu bilgi
              şeridiyle aynı teal bandın alt satırı. */}
          <div className="mb-6 rounded-2xl border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] p-5 sm:p-6">
            {/* Sayfanın tek H1'i (SEO, 2026-10-13): slayt başlıkları H2. Bilgi şeridinin başlığı olarak sade, kısa metin. */}
            <h1 className="mb-3 px-2 text-base leading-snug font-bold text-[var(--color-brand-800)] sm:px-2.5">
              Ofis malzemesi ve kırtasiye: firmalara, okullara ve kurumlara tek adresten tedarik
            </h1>
            <TrustBar />
            {membershipStatus.kind === "approved" && <ApprovedStrip status={membershipStatus} />}
          </div>

          {bestSellersRow}
          {categories.length > 0 && (
            <Reveal>
              <CategoryGrid categories={categories} />
            </Reveal>
          )}

          {/* 2026-10-13: "Kurumsal Üyelik Avantajları" şeridi ve "Kimlere Hizmet" (dört kartı da üyelik başvurusuna gidiyordu)
              kaldırıldı — büyük üyelik mesajı ana sayfada yalnız hero'da (DESIGN.md / Üyelik mesajı). */}

          {newArrivals.length > 0 && (
            <Reveal>
              <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                <ProductRow
                  title="Yeni Eklenenler"
                  products={newArrivals}
                  memberDiscountPercent={memberDiscountPercent}
                  viewAllHref="/urunler?sirala=yeni"
                  kdvNotu={!bestSellersRow}
                />
              </div>
            </Reveal>
          )}

          {brands.length >= MIN_BRANDS && (
            <Reveal>
              <div className="mb-6 rounded-2xl border border-[var(--color-brand-100)] bg-[var(--color-brand-50)] p-5 sm:p-6">
                <BrandStrip brands={brands} />
              </div>
            </Reveal>
          )}

          <div className="mb-6 flex justify-center">
            <Link
              href="/urunler"
              className="group inline-flex items-center gap-2 rounded-lg border border-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-[var(--color-brand)] transition-colors duration-200 hover:bg-[var(--color-brand-soft)]"
            >
              Tüm Ürünleri İncele
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
