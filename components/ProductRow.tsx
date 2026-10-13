import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import SectionHeading from "@/components/SectionHeading";
import type { StorefrontProductSummary } from "@/lib/search";
import ProductCard from "@/components/ProductCard";
import ScrollRow from "@/components/ScrollRow";

// Tailwind sınıfları derlemede taranır; dinamik birleştirme yerine tam sınıf adları.
const LG_WIDTH = { 4: "lg:w-[calc((100%-36px)/4)]", 6: "lg:w-[calc((100%-60px)/6)]" } as const;

export default function ProductRow({
  title,
  products,
  memberDiscountPercent,
  viewAllHref,
  perRow = 6,
  oklar = false,
}: {
  title: string;
  products: StorefrontProductSummary[];
  memberDiscountPercent: number | null;
  viewAllHref?: string;
  /** Geniş ekranda satıra sığan kart sayısı; dar kapta (ürün sayfası, max-w-5xl) 4 — 6 kartta düğme yazısı kesiliyordu. */
  perRow?: 4 | 6;
  /** Taşan satırda Markalar şeridindeki gibi sol/sağ ok düğmeleri (ScrollRow). */
  oklar?: boolean;
}) {
  if (products.length === 0) return null;

  const satirAraligi = "-mx-1 -mt-2 -mb-3 gap-3 px-1 pt-2 pb-4";
  const kartlar = products.map((product) => (
    // Geniş ekranda satıra tam perRow kart sığar ((perRow-1) boşluk × 12 px); 7 kartta düğmeler kırılıyordu (kullanıcı kararı 2026-10-12).
    <div key={product.id} className={`flex w-44 shrink-0 first:ml-auto last:mr-auto sm:w-52 ${LG_WIDTH[perRow]}`}>
      <ProductCard product={product} memberDiscountPercent={memberDiscountPercent} deferImage />
    </div>
  ));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <SectionHeading title={title} />
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="group flex items-center gap-1 text-sm font-medium text-[var(--color-brand)] hover:underline"
          >
            Tümünü Gör
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        )}
      </div>
      {/* Az ürün varken satır sola yığılıp sağda boşluk bırakmasın: ilk/son kartın otomatik kenar boşluğu ürünleri ORTALAR;
          çok ürün varken (taşma) otomatik boşluklar sıfırlanır ve satır soldan kaydırılabilir olarak kalır. */}
      {/* pt/pb + negatif kenar: kartın hover'da yukarı kalkması ve gölgesi kaydırma kabında KESİLMESİN. */}
      {oklar ? (
        // Oklar kart görselinin hizasında; ScrollRow kaydırma çubuğunu gizler, kartlar oklarla/parmakla kaydırılır.
        <ScrollRow label={title} okKonum="top-1/3" innerClassName={satirAraligi}>
          {kartlar}
        </ScrollRow>
      ) : (
        <div className={`flex overflow-x-auto ${satirAraligi}`}>{kartlar}</div>
      )}
    </div>
  );
}
