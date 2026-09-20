import { Percent, Boxes } from "lucide-react";
import HeroSlider from "@/components/HeroSlider";
import PromoBanner from "@/components/PromoBanner";
import type { MembershipStatus } from "@/lib/membershipStatus";
import type { CariHesapSlideMode } from "@/components/HeroSlider";

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
export default function HeroSection({ status }: { status: MembershipStatus }) {
  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-3 lg:gap-4">
      <div className="lg:col-span-2">
        <HeroSlider cariHesapSlide={slideModeFor(status)} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-4">
        <PromoBanner
          icon={Percent}
          title="Firmanıza Özel Fiyatlar"
          description="Üyelik başvurusu yapın, size özel iskontolu fiyatlarla alışveriş yapın"
          href="/hesabim/uyelik-basvurusu"
          className="bg-[var(--color-brand-600)]"
        />
        <PromoBanner
          icon={Boxes}
          title="Toplu Alım Avantajı"
          description="İşletmeniz için avantajlı toplu tedarik"
          href="/hesabim/uyelik-basvurusu"
          className="bg-[var(--color-accent-600)]"
        />
      </div>
    </div>
  );
}
