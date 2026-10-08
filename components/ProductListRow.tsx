"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, HeartIcon, CartIcon } from "@/components/icons";
import CorporatePriceHint from "@/components/MemberHint";
import StoreImage from "@/components/StoreImage";
import ProductPlaceholder from "@/components/ProductPlaceholder";
import type { StorefrontProductSummary } from "@/lib/search";
import { resolvePrice, centsToTl } from "@/lib/pricing";
import { useCart } from "@/components/CartProvider";
import { useFavorites } from "@/components/FavoritesProvider";
import { birimEtiketi } from "@/lib/satisBirimleri";

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
  const [added, setAdded] = useState(false);
  // Paketli satış: hızlı eklemede en küçük açık birim (1 tane).
  const enKucukBirim = product.satisBirimleri?.[0] ?? null;
  const inStock = product.stock >= (enKucukBirim?.adet ?? 1);
  const favorite = isFavorite(product.id);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-200 p-3 transition-all duration-200 hover:shadow-md">
      <Link href={href} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        {product.coverImageUrl ? (
          <StoreImage src={product.coverImageUrl} alt={product.name} sizes="96px" className="object-cover" />
        ) : (
          <ProductPlaceholder name={product.name} brandName={product.brandName} variant="compact" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={href}>
          {product.brandName && <span className="text-xs text-neutral-400">{product.brandName}</span>}
          <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
        </Link>
        {product.shortDescription && (
          <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{product.shortDescription}</p>
        )}
        {enKucukBirim ? (
          <p className="mt-0.5 text-xs text-neutral-500">En az {birimEtiketi(enKucukBirim.birim, enKucukBirim.adet)}</p>
        ) : (
          product.packageInfo && <p className="mt-0.5 text-xs text-neutral-500">{product.packageInfo}</p>
        )}
        {(product.cokSatan || !inStock) && (
          <p className="mt-1 flex items-center gap-2 text-xs font-medium">
            {product.cokSatan && (
              <span className="rounded-full bg-[var(--color-brand)] px-2 py-0.5 text-[11px] font-semibold text-white">Çok Satan</span>
            )}
            {!inStock && <span className="text-red-600">Stokta Yok</span>}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        {price.discounted && <p className="text-xs text-neutral-400 line-through">{centsToTl(price.listCents)} ₺</p>}
        <p className="text-base font-extrabold text-[var(--color-brand)]">
          {centsToTl(price.displayCents)} ₺{enKucukBirim && <span className="text-[11px] font-normal text-neutral-500"> / adet</span>}
        </p>
        <p className="text-[10px] text-neutral-400">KDV Dahil</p>
        <CorporatePriceHint className="mt-0.5 justify-end" />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
          aria-pressed={favorite}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-50"
        >
          <HeartIcon
            className={`h-4 w-4 ${favorite ? "fill-[var(--color-brand)] text-[var(--color-brand)]" : "text-neutral-500"}`}
            aria-hidden="true"
          />
        </button>
        {inStock && (
          <button
            type="button"
            onClick={() => {
              addItem(product.id, 1, product.name, enKucukBirim?.birim ?? null);
              setAdded(true);
              setTimeout(() => setAdded(false), 1200);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition-all duration-200 active:scale-95 ${
              added ? "bg-emerald-600" : "bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)]"
            }`}
          >
            {added ? (
              <CheckIcon className="animate-pop h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <CartIcon className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {added ? "✓ Eklendi" : "Sepete Ekle"}
          </button>
        )}
      </div>
    </div>
  );
}
