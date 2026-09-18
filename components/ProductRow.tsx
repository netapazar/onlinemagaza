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
            className="flex items-center gap-1 text-sm font-medium text-[var(--color-brand)] hover:underline"
          >
            Tümünü Gör
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {products.map((product) => (
          <div key={product.id} className="w-44 shrink-0 sm:w-52">
            <ProductCard product={product} memberDiscountPercent={memberDiscountPercent} />
          </div>
        ))}
      </div>
    </div>
  );
}
