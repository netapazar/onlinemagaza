import Link from "next/link";
import type { StorefrontProductSummary } from "@/lib/search";
import { resolvePrice, centsToTl } from "@/lib/pricing";

export default function ProductCard({
  product,
  memberDiscountPercent,
}: {
  product: StorefrontProductSummary;
  memberDiscountPercent: number | null;
}) {
  const price = resolvePrice(product, memberDiscountPercent);
  const href = product.slug ? `/urun/${product.slug}` : `/urun/id/${product.id}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 transition-shadow hover:shadow-md"
    >
      <div className="aspect-square w-full overflow-hidden bg-neutral-100">
        {product.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.coverImageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
            Görsel yok
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.brandName && (
          <span className="text-xs text-neutral-400">{product.brandName}</span>
        )}
        <span className="line-clamp-2 text-sm font-medium text-neutral-900">{product.name}</span>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          {price.discounted && (
            <span className="text-xs text-neutral-400 line-through">{centsToTl(price.listCents)} ₺</span>
          )}
          <span className="text-sm font-semibold text-neutral-900">{centsToTl(price.displayCents)} ₺</span>
        </div>
        {product.stock <= 0 && (
          <span className="text-xs font-medium text-red-600">Stokta yok</span>
        )}
      </div>
    </Link>
  );
}
