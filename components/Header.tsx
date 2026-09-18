import Link from "next/link";
import { Percent } from "lucide-react";
import { getWebSession } from "@/lib/webSession";
import { getStorefrontCategoriesWithCounts } from "@/lib/search";
import AnnouncementBar from "@/components/AnnouncementBar";
import HeaderMain from "@/components/HeaderMain";
import MegaMenu from "@/components/MegaMenu";

const QUICK_LINK_LIMIT = 4;

// Sadece 2-6 kategoriyle araç çubuğu boş görünmesin diye, gerçekten var
// olan sayfalara giden sabit linkler de eklendi (olmayan bir sayfaya link
// verilmedi) — bkz. proje kısıtı.
const STATIC_LINKS = [
  { href: "/cok-satanlar", label: "Çok Satanlar" },
  { href: "/urunler?sirala=yeni", label: "Yeni Ürünler" },
  { href: "/hesabim/uyelik-basvurusu", label: "Kurumsal Üyelik" },
  { href: "/sss", label: "Sıkça Sorulan Sorular" },
];

export default async function Header() {
  const [session, categories] = await Promise.all([getWebSession(), getStorefrontCategoriesWithCounts()]);

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
      <AnnouncementBar />
      <HeaderMain loggedIn={Boolean(session)} />

      <div className="hidden border-t border-neutral-100 bg-neutral-50 sm:block">
        <div className="mx-auto flex max-w-content items-center gap-1 px-4 py-2">
          <MegaMenu categories={categories} />
          <div className="flex items-center gap-1 overflow-x-auto">
            {categories.slice(0, QUICK_LINK_LIMIT).map((c) => (
              <Link
                key={c.id}
                href={`/urunler?kategori=${c.id}`}
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-white hover:text-[var(--color-brand)]"
              >
                {c.name}
              </Link>
            ))}
            <span className="mx-1 hidden h-4 w-px shrink-0 bg-neutral-300 md:block" aria-hidden="true" />
            {STATIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hidden shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-white hover:text-[var(--color-brand)] md:block"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Link
            href="/kampanyalar"
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-accent-700)] hover:bg-[var(--color-accent-50)]"
          >
            <Percent className="h-4 w-4" aria-hidden="true" />
            Kampanyalar
          </Link>
        </div>
      </div>
    </header>
  );
}
