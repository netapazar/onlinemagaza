import { Percent, Boxes } from "lucide-react";
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

// Avansas benzeri düzen: solda geniş (2/3) döngülü slider, sağda (1/3)
// üst üste iki kampanya banner'ı. "Aynı Gün Kargo" mesajı zaten slider'da
// ve güven çubuğunda var — üçüncü tekrarını önlemek için sağ üst banner
// kurumsal üyelik temalı (bkz. kullanıcı geri bildirimi).
//
// Görseller: public/banners'a konan dosya (anahtarlar için bkz. lib/bannerImages.ts) HER ZAMAN önceliklidir; dosya yoksa
// mevcut ürün fotoğraflarından kompozisyon (photos), hiç fotoğraf yoksa ikonlu ilk hâl.
export default function HeroSection({ status, photos = [] }: { status: MembershipStatus; photos?: CollagePhoto[] }) {
  const bannerImages = {
    "hero-1": bannerImage("hero-1") ?? undefined,
    "hero-cari": bannerImage("hero-cari") ?? undefined,
    "hero-2": bannerImage("hero-2") ?? undefined,
    "hero-3": bannerImage("hero-3") ?? undefined,
  };
  const promo1 = bannerImage("promo-1");
  const promo2 = bannerImage("promo-2");
  // Fotoğraf yedeği: iki banner farklı ürünlerden (mümkünse) beslensin.
  const photo1 = photos[0]?.url ?? null;
  const photo2 = photos[1]?.url ?? photos[0]?.url ?? null;

  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-3 lg:gap-4">
      <div className="lg:col-span-2">
        <HeroSlider cariHesapSlide={slideModeFor(status)} photos={photos} bannerImages={bannerImages} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-4">
        <PromoBanner
          icon={Percent}
          title="Firmanıza Özel Fiyatlar"
          description="Üyelik başvurusu yapın, size özel iskontolu fiyatlarla alışveriş yapın"
          href="/hesabim/uyelik-basvurusu"
          className="bg-[var(--color-brand-600)]"
          image={promo1 ?? photo1}
          imageIsPhoto={!promo1 && Boolean(photo1)}
        />
        <PromoBanner
          icon={Boxes}
          title="Toplu Alım Avantajı"
          description="İşletmeniz için avantajlı toplu tedarik"
          href="/hesabim/uyelik-basvurusu"
          className="bg-[var(--color-accent-600)]"
          image={promo2 ?? photo2}
          imageIsPhoto={!promo2 && Boolean(photo2)}
        />
      </div>
    </div>
  );
}
