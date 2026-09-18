import Link from "next/link";
import { Building2 } from "lucide-react";

// Anasayfadaki eski ince "üyelik başvurusu" şeridinin yerine — sayfanın
// ortasında büyük, görselli, dikkat çekici tek blok (hero'daki slayt zaten
// aynı çağrıyı taşıdığı için ikisi tekrar etmesin diye burada tek bir güçlü
// blok bırakıldı).
export default function MembershipCTA() {
  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--color-brand-700)] to-[var(--color-brand-500)] px-6 py-10 sm:px-12 sm:py-14">
      <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-white/[0.06]" />
      <div className="pointer-events-none absolute -right-6 -bottom-10 h-48 w-48 rounded-full bg-white/[0.08]" />
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          Kurumsal Üyelik
        </span>
        <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl">
          Firmanıza Özel Fiyatlarla Tedariğe Başlayın
        </h2>
        <p className="mb-6 text-sm text-white/85 sm:text-base">
          Üyelik başvurunuz onaylandığında size özel indirimli fiyatlardan alışveriş yapabilir, dilerseniz cari
          hesabınızla ödeme yapabilirsiniz.
        </p>
        <Link
          href="/hesabim/uyelik-basvurusu"
          className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[var(--color-brand)] hover:bg-white/90"
        >
          Hemen Başvurun
        </Link>
      </div>
    </div>
  );
}
