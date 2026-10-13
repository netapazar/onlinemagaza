import Link from "next/link";
import { getStorefrontCategoriesWithCounts } from "@/lib/search";
import { getMembershipStatus } from "@/lib/membershipStatus";
import AnnouncementBar from "@/components/AnnouncementBar";
import MembershipReminderBanner from "@/components/MembershipReminderBanner";
import HeaderMain from "@/components/HeaderMain";
import MegaMenu from "@/components/MegaMenu";
import ScrollRow from "@/components/ScrollRow";

// Sadece 2-6 kategoriyle araç çubuğu boş görünmesin diye, gerçekten var
// olan sayfalara giden sabit linkler de eklendi (olmayan bir sayfaya link
// verilmedi) — bkz. proje kısıtı. "Sıkça Sorulan Sorular" 1440 px'te satırı taşırıp
// "Kurumsal Üyelik"i kestiği için duyuru çubuğuna taşındı (bkz. AnnouncementBar).
const STATIC_LINKS = [
  { href: "/cok-satanlar", label: "Çok Satanlar" },
  { href: "/urunler?sirala=yeni", label: "Yeni Ürünler" },
  { href: "/hesabim/uyelik-basvurusu", label: "Kurumsal Üyelik" },
];

// 1440 px'in altında (1280 / 1366 dizüstü) satır 14 px'le 124 px taşıyordu: orada 13 px ve dar yan boşluk, 1440 ve üstünde
// eski ölçü. Daha dar ekranda (tablet) satır yine kaydırılır, oklar ScrollRow'da. Bkz. DESIGN.md / Gezinme.
const NAV_LINK =
  "shrink-0 rounded-lg px-1.5 py-2 text-[13px] font-medium whitespace-nowrap text-neutral-600 hover:bg-white hover:text-[var(--color-brand)] min-[1440px]:px-2.5 min-[1440px]:text-sm";

export default async function Header() {
  const [status, categories] = await Promise.all([getMembershipStatus(), getStorefrontCategoriesWithCounts()]);

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
      <AnnouncementBar />
      {status.kind === "no_application" && <MembershipReminderBanner />}
      <HeaderMain loggedIn={status.kind !== "guest"} membershipStatus={status.kind} />

      <div className="hidden border-t border-neutral-100 bg-neutral-50 sm:block">
        <div className="mx-auto flex max-w-content items-center gap-1 px-4 py-2">
          <MegaMenu categories={categories} />
          {/* Tüm ana kategoriler + sabit bağlantılar tek satırda; sığmazsa sağa/sola kaydırılır (oklar ScrollRow'da). */}
          <ScrollRow label="Kategoriler" fadeFrom="from-neutral-50" className="flex-1" innerClassName="items-center gap-0.5 min-[1440px]:gap-1">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/urunler?kategori=${c.id}`}
                className={NAV_LINK}
              >
                {c.name}
              </Link>
            ))}
            <span className="mx-1 h-4 w-px shrink-0 bg-neutral-300" aria-hidden="true" />
            {STATIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={NAV_LINK}
              >
                {link.label}
              </Link>
            ))}
          </ScrollRow>
        </div>
      </div>
    </header>
  );
}
