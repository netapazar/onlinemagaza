import Link from "next/link";
import ScrollRow from "@/components/ScrollRow";

// Az markayla bir "şerit" göstermenin anlamı yok — en az 6 marka olduğunda render ediliyor (bkz. proje kısıtı: az
// veriyle yarım/anlamsız görünen bölümler gizlenmeli). Çağıran taraf (anasayfa) kartı da aynı eşikle gizler.
export const MIN_BRANDS = 6;

// Tek satır, yatay kaydırmalı (çok markada sayfayı uzatmasın); her marka o markanın ürünlerine gider.
export default function BrandStrip({ brands }: { brands: { id: string; name: string }[] }) {
  if (brands.length < MIN_BRANDS) return null;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-neutral-900">Markalar</h2>
        <span className="text-xs text-neutral-400">{brands.length} marka</span>
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
