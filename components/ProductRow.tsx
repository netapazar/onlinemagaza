import type { StorefrontProductSummary } from "@/lib/search";
import ProductCard from "@/components/ProductCard";

export default function ProductRow({
  title,
  products,
  memberDiscountPercent,
}: {
  title: string;
  products: StorefrontProductSummary[];
  memberDiscountPercent: number | null;
}) {
  if (products.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="mb-3 text-lg font-semibold text-neutral-900">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {products.map((product) => (
          <div key={product.id} className="w-40 shrink-0 sm:w-48">
            <ProductCard product={product} memberDiscountPercent={memberDiscountPercent} />
          </div>
        ))}
      </div>
    </div>
  );
}
