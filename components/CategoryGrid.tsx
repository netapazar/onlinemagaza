import Link from "next/link";
import { CategoryIcon } from "@/lib/categoryIcons";
import StoreImage from "@/components/StoreImage";
import ScrollRow from "@/components/ScrollRow";
import SectionHeading from "@/components/SectionHeading";
import { LayoutGrid } from "lucide-react";

type Sub = { id: string; name: string; count: number; imageUrl: string | null };
type Category = Sub & { children?: Sub[] };

// Tek satır, yatay kaydırmalı (oklar ScrollRow'da): önce ana kategoriler (renkli çerçeveli), ardından her ana kategorinin
// alt kategorileri kendi temsili ürün görseliyle. Az öğede ilk/son kartın otomatik kenar boşluğu satırı ORTALAR; taşınca
// satır soldan kaydırılır. pt/pb: kartın hover'da yukarı kalkması kesilmesin.
export default function CategoryGrid({ categories }: { categories: Category[] }) {
  const altlar = categories.flatMap((g) => g.children ?? []);
  return (
    <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <SectionHeading title="Kategoriler" icon={LayoutGrid} />
        {altlar.length > 0 && (
          <span className="text-xs text-neutral-400">
            {categories.length} ana · {altlar.length} alt kategori
          </span>
        )}
      </div>
      <ScrollRow label="Kategoriler" innerClassName="gap-4 pt-1 pb-2 sm:gap-5" okKonum="top-11">
        {categories.map((c) => (
          <Kart key={c.id} c={c} ana />
        ))}
        {altlar.length > 0 && <span className="mx-1 h-16 w-px shrink-0 self-center bg-neutral-200" aria-hidden="true" />}
        {altlar.map((c) => (
          <Kart key={c.id} c={c} />
        ))}
      </ScrollRow>
    </div>
  );
}

function Kart({ c, ana = false }: { c: Sub; ana?: boolean }) {
  return (
    <Link
      href={`/urunler?kategori=${c.id}`}
      className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center first:ml-auto last:mr-auto sm:w-24"
    >
      <span
        className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 bg-[var(--color-brand-soft)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[var(--color-brand)] group-hover:shadow-md ${
          ana ? "border-[var(--color-brand-300)]" : "border-neutral-100"
        }`}
      >
        {c.imageUrl ? (
          <StoreImage src={c.imageUrl} alt="" sizes="80px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <CategoryIcon name={c.name} className="h-8 w-8 text-[var(--color-brand)]" />
        )}
      </span>
      <span className={`text-xs leading-tight transition-colors group-hover:text-[var(--color-brand)] ${ana ? "font-bold text-neutral-900" : "font-medium text-neutral-700"}`}>
        {c.name}
      </span>
      <span className="text-[11px] text-neutral-400">{c.count} ürün</span>
    </Link>
  );
}
