import { TrendUpIcon, SparkleIcon } from "@/components/icons";
import HeroSlider from "@/components/HeroSlider";
import PromoBanner from "@/components/PromoBanner";
import type { MembershipStatus } from "@/lib/membershipStatus";
import type { CariHesapSlideMode } from "@/components/HeroSlider";
import type { CollagePhoto } from "@/components/ProductCollage";
import { bannerImage } from "@/lib/bannerImages";

function slideModeFor(status: MembershipStatus): CariHesapSlideMode {
  switch (status.kind) {
    case "guest":
      return "apply-guest";
    case "no_application":
    case "rejected":
      return "apply-account";
    case "pending":
      return "pending";
    case "approved":
      return "hidden";
  }
}

// Solda geniş (2/3) döngülü slider, sağda (1/3) üst üste iki kısayol kartı. 2026-10-13: yan kartlar üyelik mesajını
// tekrarlıyordu (büyük üyelik mesajı sayfada bir kez — DESIGN.md); artık Çok Satanlar ve Yeni Eklenenler listelerine
// gidiyor, kendi listelerinden bir ürün fotoğrafıyla. Amber yalnız kampanyaya ayrıldığı için ikinci kart koyu petrol.
//
// Görseller: public/banners'a konan dosya (anahtarlar için bkz. lib/bannerImages.ts) HER ZAMAN önceliklidir; dosya yoksa
// mevcut ürün fotoğraflarından kompozisyon (photos), hiç fotoğraf yoksa ikonlu ilk hâl.
export default function HeroSection({
  status,
  photos = [],
  bestPhoto = null,
  newPhoto = null,
}: {
  status: MembershipStatus;
  photos?: CollagePhoto[];
  /** Çok Satanlar / Yeni Eklenenler kartlarının fotoğrafı (her biri kendi listesinden). */
  bestPhoto?: string | null;
  newPhoto?: string | null;
}) {
  const bannerImages = {
    "hero-1": bannerImage("hero-1") ?? undefined,
    "hero-cari": bannerImage("hero-cari") ?? undefined,
    "hero-2": bannerImage("hero-2") ?? undefined,
    "hero-3": bannerImage("hero-3") ?? undefined,
  };
  const promo1 = bannerImage("promo-1");
  const promo2 = bannerImage("promo-2");

  return (
    <div className="mb-6 grid gap-3 lg:grid-cols-3 lg:gap-4">
      <div className="lg:col-span-2">
        <HeroSlider
          cariHesapSlide={slideModeFor(status)}
          photos={photos}
          bannerImages={bannerImages}
          backgroundPhoto={bannerImage("hero-arka")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-4">
        {/* Açıklamalar veriye dayanıyor: sıralama son 90 günün sipariş belgelerinden (lib/bestSellerRanking.ts). */}
        <PromoBanner
          icon={TrendUpIcon}
          title="Çok Satanlar"
          description="Son 90 günde en çok sipariş edilen ürünler"
          href="/cok-satanlar"
          className="bg-[var(--color-brand-600)]"
          image={promo1 ?? bestPhoto}
          imageIsPhoto={!promo1 && Boolean(bestPhoto)}
        />
        <PromoBanner
          icon={SparkleIcon}
          title="Yeni Eklenenler"
          description="Kataloğa en son eklenen ürünler"
          href="/urunler?sirala=yeni"
          className="bg-[var(--color-brand-800)]"
          image={promo2 ?? newPhoto}
          imageIsPhoto={!promo2 && Boolean(newPhoto)}
        />
      </div>
    </div>
  );
}
