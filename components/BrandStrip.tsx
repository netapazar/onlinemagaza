import Link from "next/link";
import { ArrowRightIcon, TagIcon } from "@/components/icons";
import ScrollRow from "@/components/ScrollRow";
import SectionHeading from "@/components/SectionHeading";

// Az markayla bir "şerit" göstermenin anlamı yok — en az 6 marka olduğunda render ediliyor (bkz. proje kısıtı: az
// veriyle yarım/anlamsız görünen bölümler gizlenmeli). Çağıran taraf (anasayfa) kartı da aynı eşikle gizler.
export const MIN_BRANDS = 6;

// Tek satır, yatay kaydırmalı; her marka o markanın ürünlerine gider. Çağıran taraf yalnız vitrin markalarını verir
// (getVitrinMarkalari — elle sıralı 20 marka; tüm markalar ürün listesinin filtresinde).
export default function BrandStrip({ brands }: { brands: { id: string; name: string }[] }) {
  if (brands.length < MIN_BRANDS) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionHeading title="Markalar" icon={TagIcon} />
        <Link
          href="/urunler"
          className="group flex items-center gap-1 text-sm font-medium text-[var(--color-brand)] hover:underline"
        >
          Tüm Ürünler
          <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
      <ScrollRow label="Markalar">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/urunler?marka=${b.id}`}
            className="shrink-0 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-neutral-600 transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
          >
            {b.name}
          </Link>
        ))}
      </ScrollRow>
    </div>
  );
}
