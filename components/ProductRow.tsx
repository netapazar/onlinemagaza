import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { StorefrontProductSummary } from "@/lib/search";
import ProductCard from "@/components/ProductCard";

export default function ProductRow({
  title,
  products,
  memberDiscountPercent,
  viewAllHref,
}: {
  title: string;
  products: StorefrontProductSummary[];
  memberDiscountPercent: number | null;
  viewAllHref?: string;
}) {
  if (products.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="group flex items-center gap-1 text-sm font-medium text-[var(--color-brand)] hover:underline"
          >
            Tümünü Gör
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        )}
      </div>
      {/* Az ürün varken satır sola yığılıp sağda boşluk bırakmasın: ilk/son kartın otomatik kenar boşluğu ürünleri ORTALAR;
          çok ürün varken (taşma) otomatik boşluklar sıfırlanır ve satır soldan kaydırılabilir olarak kalır. */}
      {/* pt/pb + negatif kenar: kartın hover'da yukarı kalkması ve gölgesi kaydırma kabında KESİLMESİN. */}
      <div className="-mx-1 -mt-2 -mb-3 flex gap-3 overflow-x-auto px-1 pt-2 pb-4">
        {products.map((product) => (
          <div key={product.id} className="w-44 shrink-0 first:ml-auto last:mr-auto sm:w-52">
            <ProductCard product={product} memberDiscountPercent={memberDiscountPercent} />
          </div>
        ))}
      </div>
    </div>
  );
}
