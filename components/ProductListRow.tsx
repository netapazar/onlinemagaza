"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import type { StorefrontProductSummary } from "@/lib/search";
import { resolvePrice, centsToTl } from "@/lib/pricing";
import { useCart } from "@/components/CartProvider";
import { useFavorites } from "@/components/FavoritesProvider";

// Izgara kartıyla (ProductCard) aynı veri/fiyat mantığı, sadece geniş
// yatay satır düzeninde — listeleme sayfasının "liste görünümü" seçeneği için.
export default function ProductListRow({
  product,
  memberDiscountPercent,
}: {
  product: StorefrontProductSummary;
  memberDiscountPercent: number | null;
}) {
  const price = resolvePrice(product, memberDiscountPercent);
  const href = product.slug ? `/urun/${product.slug}` : `/urun/id/${product.id}`;
  const { addItem } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const inStock = product.stock > 0;
  const favorite = isFavorite(product.id);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-200 p-3 transition-shadow hover:shadow-md">
      <Link href={href} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        {product.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.coverImageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">Görsel yok</div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={href}>
          {product.brandName && <span className="text-xs text-neutral-400">{product.brandName}</span>}
          <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
        </Link>
        <p className="mt-1 text-xs font-medium">
          {inStock ? <span className="text-emerald-700">Bugün Kargoda</span> : <span className="text-red-600">Stokta Yok</span>}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {price.discounted && <p className="text-xs text-neutral-400 line-through">{centsToTl(price.listCents)} ₺</p>}
        <p className="text-sm font-semibold text-neutral-900">{centsToTl(price.displayCents)} ₺</p>
        <p className="text-[10px] text-neutral-400">KDV Dahil</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
          aria-pressed={favorite}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-50"
        >
          <Heart
            className={`h-4 w-4 ${favorite ? "fill-[var(--color-brand)] text-[var(--color-brand)]" : "text-neutral-500"}`}
            aria-hidden="true"
          />
        </button>
        {inStock && (
          <button
            type="button"
            onClick={() => addItem(product.id, 1, product.name)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--color-brand-hover)]"
          >
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
            Sepete Ekle
          </button>
        )}
      </div>
    </div>
  );
}
